import { LoadingFallback } from "@/components/modules/loading-fallback";
import { ConventionEditProducts } from "@/features/convention/presentation/components/ConventionEditProducts";
import { Suspense } from "react";

export default function ConventionEditProductsPage() {
  return (
    <Suspense fallback={<LoadingFallback message="Chargement..." />}>
      <ConventionEditProducts />
    </Suspense>
  );
}
