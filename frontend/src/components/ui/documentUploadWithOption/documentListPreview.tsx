import { IAttachmentValue, IFileValue, Option } from "@/types/type";
import { EyeIcon, Loader2, PaperclipIcon, TrashIcon } from "lucide-react";
import { Button } from "../button";
import { Label } from "../label";

type Props = {
  id?: string;
  documents?: IFileValue[] | null;
  processingDocuments?: Array<{ label: string }>;
  attachment?: IAttachmentValue;
  label?: string;
  onSelect: (document: IFileValue | IAttachmentValue) => void;
  dropdownOptions?: Option[];
  onDelete?: (image: IFileValue | IAttachmentValue) => void;
  inReviewSection?: boolean;
  onPreviewClick?: (file: IFileValue) => void;
};

const DocumentListPreview = ({
  id,
  documents,
  processingDocuments,
  dropdownOptions,
  onDelete,
  inReviewSection,
  onPreviewClick,
}: Props) => {
  const getFormattedLabelForDocType = (docType: string) => {
    const matchingOptionForDocType =
      dropdownOptions &&
      dropdownOptions.find((option) => option.value === docType);
    return matchingOptionForDocType && matchingOptionForDocType.label;
  };

  return (
    <div
      className="max-w-full [&>*:last-child]:mb-4"
      id={`${id}-document-list-preview`}
    >
      {documents?.map((document, key) => (
        <div
          className="w-full flex items-center justify-between gap-2 border-b py-2"
          key={key}
        >
          <Label className="flex items-center gap-2">
            <PaperclipIcon className="w-4 h-4" />
            <span>
              {(inReviewSection &&
                dropdownOptions &&
                dropdownOptions[key]?.label) ||
                getFormattedLabelForDocType(
                  document.optionValues[1] as string
                ) ||
                (document.optionValues[1] as string)}
            </span>
          </Label>
          <div className="flex items-center gap-1">
            {onPreviewClick && (
              <Button
                id="preview_view"
                variant="ghost"
                size="sm"
                type="button"
                aria-label="Prévisualiser l'image"
                onClick={() => {
                  onPreviewClick?.(document);
                }}
                className="text-blue-600 hover:text-blue-800"
              >
                <EyeIcon className="w-4 h-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                id="preview_delete"
                variant="ghost"
                size="sm"
                type="button"
                aria-label="Delete attachment"
                onClick={() => onDelete(document)}
                className="text-destructive"
              >
                <TrashIcon className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      ))}
      {processingDocuments &&
        processingDocuments.map(({ label }) => (
          <div
            className="w-full flex items-center justify-between gap-2 border-b py-2"
            key={label}
          >
            <Label>
              <PaperclipIcon className="w-4 h-4" />
              <span>{getFormattedLabelForDocType(label) || label}</span>
            </Label>
            <Loader2
              className="h-4 w-4 animate-spin"
              id={`document_${label}_processing`}
            />
          </div>
        ))}
    </div>
  );
};

export default DocumentListPreview;
