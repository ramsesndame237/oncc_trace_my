"use client";

import { Icon } from "@/components/icon";
import { AppContent } from "@/components/layout/app-content";
import { DetailRow } from "@/components/modules/detail-row";
import { Heading } from "@/components/modules/heading";
import { LoadingFallback } from "@/components/modules/loading-fallback";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapErrorBoundary } from "@/components/error-boundary/MapErrorBoundary";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { ApiParcelResponse } from "../../domain/parcel.types";
import { useGetProducerParcels } from "../hooks/useGetProducerParcels";
import { ParcelMap } from "./ParcelMap";

export const ParcelViewContent: React.FC = () => {
  const { t } = useTranslation(["parcel", "common"]);
  const searchParams = useSearchParams();
  const actorId = searchParams.get("actorId") || "";
  const [selectedParcel, setSelectedParcel] =
    useState<ApiParcelResponse | null>(null);

  // Data fetching
  const { parcels, isLoading, error, refetch } = useGetProducerParcels(
    { actorId, page: 1, limit: 100 },
    !!actorId
  );

  // Gestion de la sélection de parcelle
  const handleParcelSelect = (parcel: ApiParcelResponse) => {
    setSelectedParcel(parcel);
  };

  const handleParcelChange = (parcelId: string) => {
    const parcel = parcels.find((p) => p.id === parcelId);
    setSelectedParcel(parcel || null);
  };

  // 1. Invalid actorId state
  if (!actorId || actorId.trim() === "") {
    return (
      <AppContent title={t("view.error")} icon={<Icon name="MapIcon" />}>
        <div className="text-center py-8">
          <p className="text-destructive">{t("view.invalidActorId")}</p>
          <Button asChild className="mt-4">
            <Link href="/actors">{t("view.backToProducers")}</Link>
          </Button>
        </div>
      </AppContent>
    );
  }

  // 2. Loading state
  if (isLoading) {
    return <LoadingFallback message={t("section.loading")} />;
  }

  // 3. Error state
  if (error) {
    return (
      <AppContent title={t("view.error")} icon={<Icon name="MapIcon" />}>
        <div className="text-center py-8">
          <p className="text-destructive mb-4">{error}</p>
          <div className="space-x-2 flex justify-center">
            <Button onClick={refetch} variant="outline">
              {t("common:actions.retry")}
            </Button>
            <Button asChild>
              <Link href="/actors">{t("view.backToProducers")}</Link>
            </Button>
          </div>
        </div>
      </AppContent>
    );
  }

  // 4. No parcels state
  if (parcels.length === 0) {
    return (
      <AppContent title={t("view.noParcels")} icon={<Icon name="MapIcon" />}>
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">
            {t("view.noParcelsFound")}
          </p>
          <Button asChild>
            <Link href="/actors">{t("view.backToProducers")}</Link>
          </Button>
        </div>
      </AppContent>
    );
  }

  // Sélectionner la première parcelle par défaut si aucune n'est sélectionnée
  const currentParcel = selectedParcel || parcels[0];

  return (
    <AppContent
      title={t("view.title")}
      icon={<Icon name="MapIcon" />}
      topActionButton={[
        <Button key="back" variant="outline" asChild>
          <Link href="/actors">
            <Icon name="ArrowLeftIcon" className="h-4 w-4" />
            {t("view.back")}
          </Link>
        </Button>,
      ]}
    >
      <div className="space-y-6">
        {/* Sélection de la parcelle */}
        <div className="flex items-center justify-between">
          <div className="flex-1 max-w-md">
            <Select
              value={currentParcel?.id || ""}
              onValueChange={handleParcelChange}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("section.select")} />
              </SelectTrigger>
              <SelectContent>
                {parcels.map((parcel) => (
                  <SelectItem key={parcel.id} value={parcel.id}>
                    {parcel.identificationId ||
                      parcel.onccId ||
                      `Parcelle ${parcel.id.slice(0, 8)}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                /* TODO: Implémenter la modification */
              }}
            >
              {t("actions.modify")}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                /* TODO: Implémenter la désactivation */
              }}
            >
              {t("actions.deactivate")}
            </Button>
          </div>
        </div>

        {currentParcel && (
          <>
            {/* Informations de la parcelle */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
              <DetailRow
                label={t("details.plantationLocation")}
                value={currentParcel.location?.name || "---"}
                noBorder
              />
              <DetailRow
                label={t("details.surfaceArea")}
                value={`${currentParcel.surfaceArea || 0} ha`}
                noBorder
              />
              <DetailRow
                label={t("details.plantationCode")}
                value={
                  currentParcel.identificationId ||
                  currentParcel.onccId ||
                  currentParcel.locationCode ||
                  "---"
                }
                noBorder
              />
            </div>

            {/* Carte */}
            <div className="space-y-4">
              <Heading size="h3">{t("details.mapLocation")}</Heading>
              <MapErrorBoundary>
                <ParcelMap
                  parcels={parcels}
                  selectedParcel={currentParcel}
                  onParcelSelect={handleParcelSelect}
                  className="h-96 border rounded-lg"
                />
              </MapErrorBoundary>
            </div>

            {/* Informations détaillées */}
            {/* Note: description n'existe pas dans ApiParcelResponse, section désactivée */}
            {/* {currentParcel.description && (
              <div className="space-y-4">
                <Heading size="h3">Description</Heading>
                <p className="text-sm text-muted-foreground p-4 bg-muted/50 rounded-lg">
                  {currentParcel.description}
                </p>
              </div>
            )} */}
          </>
        )}
      </div>
    </AppContent>
  );
};
