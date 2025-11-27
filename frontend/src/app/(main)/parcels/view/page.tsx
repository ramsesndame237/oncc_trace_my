"use client";

import { LoadingFallback } from "@/components/modules/loading-fallback";
import { ParcelViewContent } from "@/features/parcel/presentation/components/ParcelViewContent";
import { Suspense } from "react";

const ParcelViewPage: React.FC = () => {
  return (
    <Suspense
      fallback={
        <LoadingFallback message="Chargement de la page de visualisation des parcelles..." />
      }
    >
      <ParcelViewContent />
    </Suspense>
  );
};

export default ParcelViewPage;