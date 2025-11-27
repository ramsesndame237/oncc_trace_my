import { InputSelect } from "@/components/ui/input-select";
import { bytesToMB } from "@/lib/imageUtils";
import {
  ALLOWED_IMAGE_TYPE,
  IAttachmentValue,
  IFileValue,
  IFormFieldValue,
  Option,
} from "@/types/type";
import imageCompression from "browser-image-compression";
import { clone, remove } from "lodash";
import { useEffect, useState } from "react";
import { ImageUploader } from "../imageUploader";
import DocumentListPreview from "./documentListPreview";

const DEFAULT_MAX_SIZE_MB = 5;

const defaultOptions = {
  maxSizeMB: 0.4,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
};

type IFullProps = {
  name: string;
  placeholder?: string;
  extraValue: IFormFieldValue;
  options: Option[];
  files: IFileValue[];
  // hideOnEmptyOption?: boolean;
  onComplete: (files: IFileValue[]) => void;
  onUploadingStateChanged?: (isUploading: boolean) => void;
  compressImagesToSizeMB?: number;
  maxSizeMB?: number;
  labelButton?: string;
  acceptedFileTypes?: string[];
  onPreviewClick?: (file: IFileValue) => void;
};

type DocumentFields = {
  documentType: string;
  documentData: string;
};

// ⭐ Note: getBase64String n'est plus nécessaire car on stocke directement les Blobs
// La conversion en base64 se fait au moment de l'upload dans ProducerEditStep4
// Cette fonction est conservée pour référence mais peut être supprimée
// const getBase64String = (file: File) => {
//   return new Promise<string>((resolve, reject) => {
//     const reader = new FileReader();
//     reader.readAsDataURL(file);
//     reader.onload = () => {
//       if (reader.result) {
//         return resolve(reader.result.toString());
//       }
//     };
//     reader.onerror = (error) => reject(error);
//   });
// };

const initializeDropDownOption = (
  options: Option[],
  files: IFileValue[]
): Option[] => {
  const outputOptions = clone(options);
  if (files) {
    files.forEach((element: IFileValue) => {
      remove(
        outputOptions,
        (option: Option) => option.value === element.optionValues[1]
      );
    });
  }

  return outputOptions;
};

const DocumentUploadWithOption = ({
  labelButton = "Upload",
  onPreviewClick,
  ...props
}: IFullProps) => {
  const [dropdownOptions, setDropdownOptions] = useState<Option[]>(
    initializeDropDownOption(props.options, props.files)
  );

  const [allFields, setAllFields] = useState<IFileValue[]>(props.files || []);

  const [fields, setFields] = useState<DocumentFields>({
    documentType: "",
    documentData: "",
  });

  const maxSize = props.maxSizeMB ?? DEFAULT_MAX_SIZE_MB;

  const [filesBeingProcessed, setFilesBeingProcessed] = useState<
    Array<{ label: string }>
  >([]);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Synchroniser les états internes quand les props changent
  useEffect(() => {
    setAllFields(props.files || []);
    setDropdownOptions(initializeDropDownOption(props.options, props.files));
  }, [props.files, props.options]);

  const onChange = (documentType: string) => {
    setFields((currentFields) => ({
      ...currentFields,
      documentType,
    }));
  };

  const processImage = async (uploadedImage: File) => {
    const options = { ...defaultOptions };
    const allowedTypes = props.acceptedFileTypes || ALLOWED_IMAGE_TYPE;

    if (!allowedTypes.includes(uploadedImage.type)) {
      // Générer dynamiquement les extensions supportées à partir des types acceptés
      const supportedExtensions = allowedTypes
        .map((type) => {
          if (type === "image/jpeg" || type === "image/jpg") return "JPG";
          if (type === "image/png") return "PNG";
          if (type === "image/webp") return "WEBP";
          if (type === "application/pdf") return "PDF";
          return type.split("/")[1].toUpperCase();
        })
        .filter((ext, index, self) => self.indexOf(ext) === index) // Supprimer les doublons
        .join(", ");

      throw new Error(
        `Type de fichier non supporté. Formats acceptés : ${supportedExtensions}`
      );
    }

    if (bytesToMB(uploadedImage.size) > maxSize) {
      throw new Error(
        `La taille du fichier (${bytesToMB(uploadedImage.size).toFixed(
          2
        )} MB) dépasse la limite autorisée de ${maxSize} MB`
      );
    }

    // Les PDF ne nécessitent pas de compression, on les retourne tels quels
    if (uploadedImage.type === "application/pdf") {
      return uploadedImage;
    }

    // Compression uniquement pour les images
    if (props.compressImagesToSizeMB !== undefined) {
      options.maxSizeMB = props.compressImagesToSizeMB;
    }
    if (
      !Boolean(options.maxSizeMB) ||
      bytesToMB(uploadedImage.size) <= options.maxSizeMB
    ) {
      return uploadedImage;
    }

    const resized = await imageCompression(uploadedImage, options);

    return resized;
  };

  const isValid = (): boolean => {
    // If there is only one option available then no need to select it
    // and it's not shown either
    const isValid = !!fields.documentType || props.options.length === 1;

    // setErrorMessage(
    //   isValid ? EMPTY_STRING : intl.formatMessage(messages.documentTypeRequired)
    // )

    return isValid;
  };

  const onDelete = (image: IFileValue | IAttachmentValue) => {
    const previewImage = image as IFileValue;
    const addableOption = props.options.find(
      (item: Option) => item.value === previewImage.optionValues[1]
    );

    // Si l'option n'est pas trouvée (par exemple après un changement de constantes),
    // on supprime simplement le fichier sans essayer de remettre l'option
    if (addableOption) {
      setDropdownOptions((options) => {
        const index = props.options.findIndex(
          (option) => option.value === addableOption.value
        );
        if (index === -1) {
          return [...options, addableOption]; // Ajoute à la fin si non trouvé
        }
        const newOptions = [...options];
        newOptions.splice(index, 0, addableOption); // Ajoute à sa position initiale
        return newOptions;
      });
    }

    const newAllFields = allFields.filter((file) => file !== previewImage);

    setAllFields(newAllFields);
    props.onComplete(newAllFields);
  };

  const handleFileChange = async (uploadedImage: File) => {
    if (!uploadedImage) {
      return;
    }

    // Effacer les messages d'erreur précédents
    setErrorMessage(null);

    // If there is only one option available then it would stay selected
    const documentType = fields.documentType || dropdownOptions[0].value;

    let processedFile: File;
    const optionValues: [IFormFieldValue, string] = [
      props.extraValue,
      documentType,
    ];

    setFilesBeingProcessed((filesCurrentlyBeingProcessed) => [
      ...filesCurrentlyBeingProcessed,
      {
        label: optionValues[1],
      },
    ]);

    if (props.onUploadingStateChanged) {
      props.onUploadingStateChanged(true);
    }

    const minimumProcessingTime = new Promise<void>((resolve) =>
      setTimeout(resolve, 2000)
    );

    try {
      // Start processing
      [processedFile] = await Promise.all([
        processImage(uploadedImage),
        minimumProcessingTime,
      ]);
      // Effacer les erreurs précédentes en cas de succès
      setErrorMessage(null);
    } catch (error) {
      console.error("❌ Erreur traitement fichier:", error);
      if (props.onUploadingStateChanged) {
        props.onUploadingStateChanged(false);
      }

      // Afficher le message d'erreur spécifique
      const errorMsg =
        error instanceof Error
          ? error.message
          : `Erreur lors du traitement du fichier. Taille maximale autorisée : ${maxSize} MB`;
      setErrorMessage(errorMsg);

      setFilesBeingProcessed((filesCurrentlyBeingProcessed) =>
        filesCurrentlyBeingProcessed.filter(
          ({ label }) => label !== optionValues[1]
        )
      );
      return;
    }

    const tempOptions = dropdownOptions;

    remove(tempOptions, (option: Option) => option.value === documentType);

    // ⭐ Stocker le Blob directement au lieu de le convertir en base64
    // Cela permet d'utiliser IndexedDB sans limite de taille (vs localStorage 5-10 MB)
    const newDocument: IFileValue = {
      optionValues,
      type: processedFile.type,
      data: processedFile,  // ✅ Stockage du Blob (sera converti en base64 au moment de l'upload)
      fileSize: processedFile.size,
      name: processedFile.name,
    };

    const newAllFields = [...allFields, newDocument];

    setAllFields(newAllFields);
    props.onComplete(newAllFields);

    if (props.onUploadingStateChanged) {
      props.onUploadingStateChanged(false);
    }

    // setErrorMessage(EMPTY_STRING);
    setFields({
      documentType: "",
      documentData: "",
    });
    setDropdownOptions(tempOptions);
    setFilesBeingProcessed((filesCurrentlyBeingProcessed) =>
      filesCurrentlyBeingProcessed.filter(
        ({ label }) => label !== optionValues[1]
      )
    );
  };

  return (
    <div className="w-full">
      <DocumentListPreview
        processingDocuments={filesBeingProcessed}
        documents={allFields}
        onSelect={() => {}}
        dropdownOptions={props.options}
        onDelete={onDelete}
        onPreviewClick={onPreviewClick}
      />
      <div className="flex items-stretch gap-2">
        <InputSelect
          options={dropdownOptions}
          placeholder={props.placeholder}
          onValueChange={onChange}
          value={fields.documentType}
          className="flex-1 border-2 !h-12"
          disabled={filesBeingProcessed.length > 0}
        />
        <ImageUploader
          id="upload_document"
          name={props.name}
          onClick={(e) => !isValid() && e.preventDefault()}
          onChange={handleFileChange}
          disabled={filesBeingProcessed.length > 0}
          acceptedFileTypes={props.acceptedFileTypes}
        >
          {labelButton}
        </ImageUploader>
      </div>
      {errorMessage && (
        <div className="mt-2 text-destructive text-xs">{errorMessage}</div>
      )}
    </div>
  );
};

export default DocumentUploadWithOption;
