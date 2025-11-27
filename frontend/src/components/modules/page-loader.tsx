import { LoadingLoader } from "./loading-loader";

/**
 * Loader pour le contenu de la page uniquement
 * Utilisé dans Suspense pour ne pas affecter le layout (sidebar/header)
 */
export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <LoadingLoader />
      </div>
    </div>
  );
}
