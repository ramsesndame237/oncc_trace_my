export interface Option {
  value: string;
  label: string;
  disabled?: boolean;
  className?: string;
}

export type IFormFieldValue =
  | string
  | string[]
  | number
  | boolean
  | Date
  | IFileValue;

export interface IFileValue {
  optionValues: IFormFieldValue[];
  type: string;
  data: string | Blob;  // ⭐ Peut être une URL base64 (string) OU un objet Blob
  fileSize: number;
  name?: string;
  id?: string;
}

export const ALLOWED_IMAGE_TYPE = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "application/pdf",
];

export interface IAttachmentValue {
  name?: string;
  type: string;
  data: string;
  uri?: string;
}
