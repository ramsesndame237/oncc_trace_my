"use client";

import { BaseCard } from "@/components/modules/base-card";
import { DetailRow } from "@/components/modules/detail-row";
import { Heading } from "@/components/modules/heading";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { db } from "@/core/infrastructure/database/db";
import type { Actor } from "@/features/actor/domain/actor.types";
import { useActorStore } from "@/features/actor/infrastructure/store/actorStore";
import { HierarchyDisplay } from "@/features/location/presentation/components";
import type {
  CreateParcelData,
  ParcelType,
} from "@/features/parcel/domain/parcel.types";
import { useParcelStore } from "@/features/parcel/infrastructure/store/parcelStore";
import { dayjs } from "@/lib/dayjs";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useProducerAddFormStore } from "../../../infrastructure/store/producerAddFormStore";
import { useActorOptions } from "../../hooks/useActorOptions";
import { useProducerAddFormNavigation } from "../../hooks/useProducerAddFormNavigation";
import { type Step2ParcelInfoData } from "../../schemas/producer-validation-schemas";
import ProducerFormLayout from "./ProducerFormLayout";

export default function ProducerAddStep3() {
  const { t } = useTranslation(["actor", "common"]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const entityId = searchParams.get("entityId");
  const editOffline = searchParams.has("editOffline");

  const { fetchActorById } = useActorStore();
  const { createParcelsBulk, isLoading: isSaving } = useParcelStore();

  const { formData, setCurrentStep, resetForm } = useProducerAddFormStore();
  const { handleCancel } = useProducerAddFormNavigation();
  const { parcelTypes } = useActorOptions();

  const [selectedProducer, setSelectedProducer] = useState<Actor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirmed, setIsConfirmed] = useState(false);

  // Initialiser l'étape courante
  useEffect(() => {
    setCurrentStep(3);
    // Forcer la confirmation à false à chaque fois qu'on arrive sur cette étape
    setIsConfirmed(false);
  }, [setCurrentStep]);

  // Charger les informations du producteur sélectionné
  useEffect(() => {
    const loadProducer = async () => {
      setIsLoading(true);
      try {
        if (entityId && editOffline) {
          // Mode offline : charger depuis pendingOperations
          const pendingOperation = await db.pendingOperations
            .where("entityId")
            .equals(entityId)
            .first();

          if (pendingOperation && pendingOperation.payload) {
            const payload = pendingOperation.payload as Record<string, unknown>;

            // Extraire les infos du producteur depuis producerInfo ou depuis le payload direct
            const producerInfo = payload.producerInfo as
              | {
                  familyName: string;
                  givenName: string;
                  locationCode: string;
                  onccId?: string;
                  identifiantId?: string;
                }
              | undefined;

            // Construire un objet producer temporaire à partir du payload
            const tempProducer: Actor = {
              id: payload.actorId as string,
              actorType: "PRODUCER",
              familyName:
                producerInfo?.familyName ||
                (payload.familyName as string) ||
                "",
              givenName:
                producerInfo?.givenName || (payload.givenName as string) || "",
              email: (payload.email as string) || undefined,
              phone: (payload.phone as string) || undefined,
              locationCode:
                producerInfo?.locationCode ||
                (payload.locationCode as string) ||
                "",
              onccId:
                producerInfo?.onccId || (payload.onccId as string) || undefined,
              identifiantId:
                producerInfo?.identifiantId ||
                (payload.identifiantId as string) ||
                undefined,
              status: "active",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

            setSelectedProducer(tempProducer);
          } else {
            console.error(
              "ProducerAddStep3 - Aucune opération trouvée pour entityId:",
              entityId
            );
            toast.error("Impossible de charger les données.");
            router.push("/actors/producer");
          }
        } else {
          // Mode online : charger depuis l'API
          const selectedProducerId = formData.step1.selectedProducerId;
          if (selectedProducerId) {
            const producer = await fetchActorById(selectedProducerId);
            setSelectedProducer(producer);
          }
        }
      } catch (error) {
        console.error("Error loading producer:", error);
        toast.error(t("common:messages.error"));
        router.push("/actors/producer");
      } finally {
        setIsLoading(false);
      }
    };

    loadProducer();
  }, [
    entityId,
    editOffline,
    formData.step1.selectedProducerId,
    fetchActorById,
    t,
    router,
  ]);

  const handleSubmit = async () => {
    if (!isConfirmed || !selectedProducer) return;

    try {
      // Récupérer l'ID du producteur
      const producerId =
        editOffline && entityId
          ? selectedProducer.id
          : formData.step1.selectedProducerId;

      if (!producerId) {
        toast.error(t("producer.add.noProducerSelected"));
        return;
      }

      // Préparer les parcelles pour l'envoi
      const parcels: CreateParcelData[] = (formData.step2?.parcels || []).map(
        (parcel) => {
          const coordinates =
            parcel.coordinates && parcel.coordinates.length > 0
              ? parcel.coordinates.map((coord, index) => ({
                  latitude: coord.latitude,
                  longitude: coord.longitude,
                  pointOrder: index + 1,
                }))
              : undefined;

          return {
            locationCode: parcel.locationCode,
            surfaceArea: parcel.surfaceArea || 0,
            parcelType: parcel.parcelType as ParcelType,
            identificationId: parcel.identificationId || "",
            onccId: parcel.onccId || "",
            // Convertir la date au format YYYY-MM-DD si elle existe
            parcelCreationDate: parcel.parcelCreationDate
              ? dayjs(parcel.parcelCreationDate).format("YYYY-MM-DD")
              : undefined,
            ...(coordinates && { coordinates }),
          };
        }
      );

      // Vérifier qu'il y a au moins une parcelle
      if (parcels.length === 0) {
        toast.error(t("producer.add.noParcels"));
        return;
      }

      // Créer les parcelles en masse
      await createParcelsBulk(
        {
          type: "add_producer",
          actorId: producerId,
          parcels,
          // Ajouter les informations du producteur pour l'affichage offline
          producerInfo: {
            familyName: selectedProducer.familyName || "",
            givenName: selectedProducer.givenName || "",
            locationCode: selectedProducer.locationCode || "",
            onccId: selectedProducer.onccId,
            identifiantId: selectedProducer.identifiantId,
          },
        },
        editOffline ? entityId || undefined : undefined
      );

      // Réinitialiser le formulaire
      resetForm();

      // Rediriger selon le mode
      if (editOffline) {
        router.push("/outbox");
      } else {
        router.push("/actors/producer");
      }
    } catch (error) {
      console.error("Error adding producer parcels:", error);
      toast.error(
        error instanceof Error ? error.message : t("producer.add.errorMessage")
      );
    }
  };

  // Boutons du footer
  const footerButtons = [
    <Button
      key="submit"
      type="button"
      onClick={handleSubmit}
      disabled={!isConfirmed || isSaving}
      className="flex items-center space-x-2"
    >
      <span>
        {isSaving
          ? t("common:messages.saving")
          : editOffline
          ? t("producer.add.updateParcels")
          : t("producer.add.confirmAdd")}
      </span>
    </Button>,
  ];

  // Header avec titre
  const headerContent = (
    <div className="flex items-center space-x-3">
      <h1 className="text-xl font-medium text-gray-900">
        {t("producer.add.summaryTitle")}
      </h1>
    </div>
  );

  if (isLoading || !selectedProducer) {
    return (
      <ProducerFormLayout
        onHandleCancel={handleCancel}
        title={t("producer.add.title")}
      >
        <div className="flex items-center justify-center h-screen">
          <p className="text-muted-foreground">
            {t("common:messages.loading")}
          </p>
        </div>
      </ProducerFormLayout>
    );
  }

  return (
    <ProducerFormLayout
      className="!max-w-4xl"
      onHandleCancel={handleCancel}
      title={t("producer.add.title")}
    >
      <BaseCard
        title={headerContent}
        footer={footerButtons}
        className="w-full"
        classNameFooter="!justify-between"
      >
        <div className="space-y-4">
          {/* Informations du producteur sélectionné */}
          <div className="mb-4">
            <Heading as="h3" size="body">
              {t("producer.add.selectedProducerInfo")}
            </Heading>
          </div>

          <DetailRow
            label={t("form.familyName")}
            value={selectedProducer.familyName || ""}
            showChangeButton={true}
            changeHref={
              editOffline && entityId
                ? `/actors/producer/add?entityId=${entityId}&editOffline=true`
                : "/actors/producer/add"
            }
          />
          <DetailRow
            label={t("form.givenName")}
            value={selectedProducer.givenName || ""}
            showChangeButton={true}
            changeHref={
              editOffline && entityId
                ? `/actors/producer/add?entityId=${entityId}&editOffline=true`
                : "/actors/producer/add"
            }
          />
          <DetailRow
            label={t("form.locationCode")}
            value={
              <HierarchyDisplay code={selectedProducer.locationCode || ""} />
            }
            showChangeButton={true}
            changeHref={
              editOffline && entityId
                ? `/actors/producer/add?entityId=${entityId}&editOffline=true`
                : "/actors/producer/add"
            }
          />
          <DetailRow
            label={t("form.onccId")}
            value={selectedProducer.onccId || "---"}
            showChangeButton={true}
            changeHref={
              editOffline && entityId
                ? `/actors/producer/add?entityId=${entityId}&editOffline=true`
                : "/actors/producer/add"
            }
          />
          <DetailRow
            label={t("form.identifiantId")}
            value={selectedProducer.identifiantId || "---"}
            showChangeButton={true}
            changeHref={
              editOffline && entityId
                ? `/actors/producer/add?entityId=${entityId}&editOffline=true`
                : "/actors/producer/add"
            }
            noBorder={true}
          />

          {/* Informations sur les parcelles */}
          {formData.step2?.parcels && formData.step2.parcels.length > 0 && (
            <div className="">
              <Separator className="my-6" />
              <div className="flex items-center justify-between mb-4">
                <Heading as="h3" size="body">
                  {t("summary.parcelsTitle", {
                    count: formData.step2.parcels.length,
                  })}
                </Heading>
                <Link
                  href="/actors/producer/add/parcels"
                  className="text-blue-600 hover:text-blue-700 p-0 h-auto font-normal text-sm"
                >
                  {t("common:actions.change")}
                </Link>
              </div>
              <div className="space-y-4">
                {formData.step2.parcels.map(
                  (parcel: Step2ParcelInfoData["parcels"][number], index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded border">
                      <div className="mb-2">
                        <span className="font-medium text-sm">
                          {t("parcels.parcelNumber", { number: index + 1 })}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <div className="md:col-span-2">
                          <span className="text-gray-600 font-medium">
                            {t("summary.location")}:
                          </span>{" "}
                          <span className="text-sm font-normal">
                            {(parcel.locationCode && (
                              <HierarchyDisplay code={parcel.locationCode} />
                            )) ||
                              t("parcels.notSpecified")}
                          </span>
                        </div>
                        <div className="space-y-2">
                          <div>
                            <span className="text-gray-600 font-medium">
                              {t("parcels.surfaceArea")}:
                            </span>{" "}
                            <span className="text-sm font-normal">
                              {parcel.surfaceArea
                                ? `${parcel.surfaceArea} m²`
                                : t("parcels.notSpecified")}
                            </span>
                          </div>

                          {parcel.coordinates &&
                            parcel.coordinates.length > 0 && (
                              <div className="md:col-span-2">
                                <span className="text-gray-600 font-medium">
                                  {t("summary.coordinates", {
                                    count: parcel.coordinates.length,
                                  })}
                                  :
                                </span>
                                <div className="mt-1 space-y-1">
                                  {parcel.coordinates.map(
                                    (coord, coordIndex) => (
                                      <div key={coordIndex} className="text-xs">
                                        <span className="font-mono">
                                          {coordIndex + 1}. {coord.latitude}°N,{" "}
                                          {coord.longitude}°E
                                        </span>
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>
                            )}
                        </div>

                        <div className="space-y-2">
                          <div className="space-x-2">
                            <span className="text-gray-600 font-medium">
                              {t("parcels.parcelType")}:
                            </span>
                            <span className="text-sm font-normal">
                              {parcelTypes.find(
                                (type) => type.value === parcel.parcelType
                              )?.label || "---"}
                            </span>
                          </div>
                          <div className="space-x-2">
                            <span className="text-gray-600 font-medium">
                              {t("parcels.declarationDate")}:
                            </span>{" "}
                            <span className="text-sm font-normal">
                              {parcel.parcelCreationDate
                                ? dayjs(parcel.parcelCreationDate).format(
                                    "DD/MM/YYYY"
                                  )
                                : "---"}
                            </span>
                          </div>

                          <div className="space-x-2">
                            <span className="text-gray-600 font-medium">
                              {t("parcels.identificationCode")}:
                            </span>{" "}
                            <span className="text-sm font-normal">
                              {parcel.identificationId || "---"}
                            </span>
                          </div>
                          <div className="space-x-2">
                            <span className="text-gray-600 font-medium">
                              {t("form.onccId")}:
                            </span>{" "}
                            <span className="text-sm font-normal">
                              {parcel.onccId || "---"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {/* Confirmation en bas */}
          <div className="mt-8 mb-6">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="confirmed"
                checked={isConfirmed}
                onCheckedChange={(checked) =>
                  setIsConfirmed(checked as boolean)
                }
              />
              <label
                htmlFor="confirmed"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {t("summary.confirmCheckbox")}
              </label>
            </div>

            {!isConfirmed && (
              <p className="text-sm text-red-600 mt-2">
                {t("summary.confirmRequired")}
              </p>
            )}
          </div>
        </div>
      </BaseCard>
    </ProducerFormLayout>
  );
}
