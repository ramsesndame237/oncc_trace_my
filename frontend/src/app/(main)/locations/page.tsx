"use client";

import { Icon } from "@/components/icon";
import { AppContent } from "@/components/layout/app-content";
import { LoadingFallback } from "@/components/modules/loading-fallback";
import { LocationList } from "@/features/location/presentation/components";
import { Breadcrumbs } from "@/features/location/presentation/components/Breadcrumbs";
import { Suspense } from "react";

export default function LocationsPage() {
  return (
    <Suspense
      fallback={
        <LoadingFallback message="Chargement de la page de localisations..." />
      }
    >
      <AppContent
        title={<Breadcrumbs />}
        icon={<Icon name="MapIcon" />}
        listContent
      >
        <LocationList />
      </AppContent>
    </Suspense>
  );
}
