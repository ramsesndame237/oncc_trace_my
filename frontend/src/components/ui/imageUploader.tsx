import { ALLOWED_IMAGE_TYPE } from "@/types/type";
import { UploadIcon } from "lucide-react";
import { useRef } from "react";
import { Button } from "./button";
import { Input } from "./input";

type ImageUploaderProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "onChange" | "type"
> & {
  onChange?: (file: File) => void;
  acceptedFileTypes?: string[];
};

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  children,
  onChange,
  onClick,
  acceptedFileTypes = ALLOWED_IMAGE_TYPE,
  ...props
}) => {
  const fileUploader = useRef<HTMLInputElement>(null);

  // Générer l'attribut accept à partir des types autorisés
  const acceptedTypes = acceptedFileTypes.join(",");

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { files } = event.target;
    if (files) {
      onChange?.(files[0]);
    }
    // Required to select the same file again
    event.target.value = "";
  };

  return (
    <Button
      {...props}
      type="button"
      onClick={(event) => {
        if (onClick) {
          onClick(event);
        }
        fileUploader.current!.click();
      }}
    >
      <UploadIcon className="h-4 w-4" />
      <span className="hidden lg:block">{children}</span>
      <Input
        name={props.name}
        ref={fileUploader}
        type="file"
        accept={acceptedTypes}
        onChange={handleFileChange}
        className="hidden"
      />
    </Button>
  );
};
