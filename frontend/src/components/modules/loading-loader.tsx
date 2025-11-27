import { Icon } from "../icon";

export function LoadingLoader() {
  return (
    <div className="flex items-center justify-center mb-4">
      <div className="relative w-16 h-16">
        {/* Coffee icon (fixe au centre) */}
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <Icon
            name="LoaderPinwheel"
            className="h-8 w-8 text-loader animate-spin"
          />
        </div>
        {/* Cercle animé (en dessous, qui tourne) */}
        <div className="absolute inset-0 animate-spin rounded-full border-b-2 border-loader" />
      </div>
    </div>
  );
}
