"use client";

import { Icon } from "@/components/icon";
import { DetailRow } from "@/components/modules/detail-row";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { InputSelect } from "@/components/ui/input-select";
import { Separator } from "@/components/ui/separator";
import { useProducerOptions } from "@/features/actor/presentation/hooks";
import { HierarchyDisplay } from "@/features/location/presentation/components";
import { useParcelStore } from "@/features/parcel";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { dayjs } from "@/lib/dayjs";
import { showError } from "@/lib/notifications/toast";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useGetProducerParcels } from "../hooks/useGetProducerParcels";
import { useParcelModal } from "../hooks/useParcelModal";
import { ParcelMap } from "./ParcelMap";

interface ProducerParcelsSectionProps {
  actorId: string;
}

export const ProducerParcelsSection: React.FC<ProducerParcelsSectionProps> = ({
  actorId,
}) => {
  const { t } = useTranslation(["parcel", "common"]);
  const router = useRouter();
  const [selectedParcelId, setSelectedParcelId] = useState<string | null>(null);
  const isOnline = useOnlineStatus();

  const { updateParcelStatus } = useParcelStore();
  const { confirmParcelActivation, confirmParcelDeactivation } =
    useParcelModal();

  // Data fetching - récupérer toutes les parcelles
  const { parcels, isLoading, error, refetch } = useGetProducerParcels(
    { actorId, page: 1, limit: 100 },
    !!actorId
  );

  const { parcelTypes } = useProducerOptions();

  // Transformer les parcelles en options pour InputSelect
  const parcelOptions =
    parcels?.map((parcel, index) => ({
      value: parcel.id,
      label: t("section.parcelNumber", { number: index + 1 }),
    })) || [];

  // Parcelle sélectionnée
  const selectedParcel =
    parcels?.find((p) => p.id === selectedParcelId) || parcels?.[0];

  // Initialiser la sélection avec la première parcelle
  if (selectedParcelId === null && parcels && parcels.length > 0) {
    setSelectedParcelId(parcels[0].id);
  }

  const handleParcelChange = (parcelId: string) => {
    setSelectedParcelId(parcelId);
  };

  const handleModify = () => {
    if (selectedParcel) {
      router.push(
        `/actors/producer/edit/parcels?entityId=${actorId}&parcelId=${selectedParcel.id}`
      );
    }
  };

  // Handle parcel activation
  const handleActivate = async () => {
    if (!selectedParcel?.id) return;

    try {
      const confirmed = await confirmParcelActivation(
        selectedParcel.id,
        async () => {
          await updateParcelStatus(selectedParcel.id, "active");
          await refetch();
        }
      );

      if (confirmed) {
        console.log(t("actions.activatedSuccess"));
      }
    } catch (error) {
      console.error(t("actions.activationError"), error);
      showError(
        error instanceof Error ? error.message : t("actions.activationError")
      );
    }
  };

  // Handle parcel deactivation
  const handleDeactivate = async () => {
    if (!selectedParcel?.id) return;

    try {
      const confirmed = await confirmParcelDeactivation(
        selectedParcel.id,
        async () => {
          await updateParcelStatus(selectedParcel.id, "inactive");
          await refetch();
        }
      );

      if (confirmed) {
        console.log(t("actions.deactivatedSuccess"));
      }
    } catch (error) {
      console.error(t("actions.deactivationError"), error);
      showError(
        error instanceof Error ? error.message : t("actions.deactivationError")
      );
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2">
              <Icon name="LoaderIcon" className="h-4 w-4 animate-spin" />
              <span className="text-sm text-muted-foreground">
                {t("section.loading")}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-destructive text-sm mb-4">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
            >
              {t("common:actions.retry")}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!parcels || parcels.length === 0) {
    return (
      <Card>
        <CardContent>
          <div className="text-center py-8">
            <Icon
              name="MapPinIcon"
              className="h-12 w-12 mx-auto text-muted-foreground mb-4"
            />
            <p className="text-muted-foreground text-sm">
              {t("section.noParcels")}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <>
        {/* Dropdown de sélection des parcelles avec boutons d'action */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <InputSelect
              value={selectedParcelId || ""}
              onValueChange={handleParcelChange}
              options={parcelOptions}
              placeholder={t("section.placeholder")}
              emptyMessage={t("section.noAvailable")}
              className="w-full"
            />
          </div>

          {/* Boutons d'action */}
          <div className="flex gap-2">
            <Button
              variant="link"
              onClick={handleModify}
              disabled={!selectedParcel || !isOnline}
            >
              {t("actions.modify")}
            </Button>
            {selectedParcel?.status === "active" ? (
              <Button
                variant="link"
                onClick={handleDeactivate}
                disabled={!selectedParcel || !isOnline}
                className="text-destructive"
              >
                {t("actions.deactivate")}
              </Button>
            ) : (
              <Button
                variant="link"
                onClick={handleActivate}
                disabled={!selectedParcel || !isOnline}
              >
                {t("actions.activate")}
              </Button>
            )}
          </div>
        </div>

        <Separator className="my-4" />
        {/* Informations de la parcelle sélectionnée */}
        {selectedParcel && (
          <div className="space-y-3 py-4">
            <DetailRow
              label={t("details.location")}
              value={<HierarchyDisplay code={selectedParcel.locationCode} />}
              noBorder
            />
            <DetailRow
              label={t("details.parcelType")}
              value={
                parcelTypes.find(
                  (type) => type.value === selectedParcel.parcelType
                )?.label || "---"
              }
              noBorder
            />
            <DetailRow
              label={t("details.surfaceArea")}
              value={`${selectedParcel.surfaceArea} m²`}
              noBorder
            />
            <DetailRow
              label={t("details.creationDate")}
              value={
                selectedParcel.parcelCreationDate
                  ? dayjs(selectedParcel.parcelCreationDate).format(
                      "DD/MM/YYYY"
                    )
                  : "---"
              }
              noBorder
            />
            <DetailRow
              label={t("details.identificationId")}
              value={selectedParcel.identificationId || "---"}
              noBorder
            />
            <DetailRow
              label={t("details.onccId")}
              value={selectedParcel.onccId || "---"}
              noBorder
            />
          </div>
        )}

        {/* Carte interactive */}
        {selectedParcel &&
          selectedParcel?.coordinates &&
          selectedParcel?.coordinates?.length > 0 && (
            <div className="border-t pt-4">
              <div className="w-full h-[600px] border rounded-lg overflow-hidden">
                <ParcelMap
                  parcels={[selectedParcel]}
                  selectedParcel={selectedParcel}
                  onParcelSelect={() => {}} // Pas de sélection car on affiche qu'une parcelle
                  className="w-full h-full"
                />
              </div>
            </div>
          )}
      </>
    </div>
  );
};
