"use client";

import DocumentUploadWithOption from "@/components/ui/documentUploadWithOption/documentUploadWithOption";
import { FormControl } from "@/components/ui/form";
import { IFileValue, Option } from "@/types/type";
import { ReactNode, useEffect, useState } from "react";
import {
  FieldValues,
  Path,
  RegisterOptions,
  UseFormReturn,
} from "react-hook-form";
import { FormFieldWrapper } from "./form-wrapper";

type FormDocumentUploadWithOptionProps<T extends FieldValues> = {
  form: UseFormReturn<T>;
  name: Path<T>;
  placeholder?: string;
  extraValue?: string | number;
  options: Option[];
  defaultFiles?: IFileValue[];
  label?: string | ReactNode;
  labelButton?: string;
  required?: boolean;
  compressImagesToSizeMB?: number;
  maxSizeMB?: number;
  description?: string | ReactNode;
  acceptedFileTypes?: string[];
  rules?: Omit<
    RegisterOptions<T, Path<T>>,
    "valueAsNumber" | "valueAsDate" | "setValueAs" | "disabled"
  >;
  onPreviewClick?: (file: IFileValue) => void;
};

export default function FormDocumentUploadWithOption<T extends FieldValues>({
  name,
  form,
  placeholder,
  extraValue = "",
  options,
  defaultFiles = [],
  label,
  labelButton,
  required = false,
  compressImagesToSizeMB,
  maxSizeMB,
  description,
  acceptedFileTypes,
  rules,
  onPreviewClick,
}: FormDocumentUploadWithOptionProps<T>) {
  const [files, setFiles] = useState<IFileValue[]>(defaultFiles);
  const [isUploading, setIsUploading] = useState(false);

  // Synchroniser l'état local avec les valeurs du formulaire et les defaultFiles
  useEffect(() => {
    const formValues = form.getValues(name);
    if (formValues && Array.isArray(formValues) && formValues.length > 0) {
      setFiles(formValues);
    } else if (defaultFiles && defaultFiles.length > 0) {
      setFiles(defaultFiles);
    }
  }, [form, name, defaultFiles]);

  const handleComplete = (newFiles: IFileValue[]) => {
    setFiles(newFiles);
  };

  const handleUploadingStateChanged = (uploading: boolean) => {
    setIsUploading(uploading);
  };

  return (
    <FormFieldWrapper
      form={form}
      name={name}
      label={label}
      description={description}
      required={required}
      rules={rules}
      renderField={(field) => (
        <FormControl>
          <div>
            <DocumentUploadWithOption
              name={name}
              placeholder={placeholder}
              extraValue={extraValue}
              options={options}
              files={files}
              onComplete={(newFiles) => {
                field.onChange(newFiles);
                handleComplete(newFiles);
              }}
              onUploadingStateChanged={handleUploadingStateChanged}
              compressImagesToSizeMB={compressImagesToSizeMB}
              maxSizeMB={maxSizeMB}
              labelButton={labelButton}
              acceptedFileTypes={acceptedFileTypes}
              onPreviewClick={onPreviewClick}
            />
            {isUploading && (
              <p className="text-xs text-blue-500 mt-1">
                Chargement du document en cours...
              </p>
            )}
          </div>
        </FormControl>
      )}
    />
  );
}
