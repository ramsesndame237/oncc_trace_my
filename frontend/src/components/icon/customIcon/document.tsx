import { cn } from "@/lib/utils";
import { type CustomIcon } from "../type";

export const DocumentIcon: CustomIcon = ({ className }) => {
  return (
    <svg
      viewBox="0 0 18 24"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("fill-none", className)}
    >
      {/* Corps du document avec opacité réduite */}
      <path
        d="M0 1C0 0.447716 0.447715 0 1 0L10.804 0L18 7.20903V23C18 23.5523 17.5523 24 17 24H1C0.447716 24 0 23.5523 0 23V1Z"
        fill="currentColor"
        className="opacity-70"
      />
      {/* Coin plié avec couleur pleine */}
      <path d="M10.8 0L18.0001 7.2H10.8V0Z" fill="currentColor" />
    </svg>
  );
};
