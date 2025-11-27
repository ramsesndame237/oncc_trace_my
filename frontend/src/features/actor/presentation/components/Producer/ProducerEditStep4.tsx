"use client";

import { DocumentPreview } from "@/components/documents";
import { BaseCard } from "@/components/modules/base-card";
import { DetailRow } from "@/components/modules/detail-row";
import { Heading } from "@/components/modules/heading";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Form } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { HierarchyDisplay } from "@/features/location/presentation/components";
import { blobToBase64 } from "@/lib/blobToBase64";
import { dayjs } from "@/lib/dayjs";
import { formatPhoneDisplay } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import React, { useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import type { ActorWithSync } from "../../../domain/actor.types";
import { useActorStore } from "../../../infrastructure/store/actorStore";
import { useProducerFormStore } from "../../../infrastructure/store/producerFormStore";
import { useActorOptions } from "../../hooks/useActorOptions";
import { useProducerFormNavigation } from "../../hooks/useProducerFormNavigation";
import {
  createStep4SummarySchema,
  type Step4SummaryData,
} from "../../schemas/producer-validation-schemas";
import ProducerFormLayout from "./ProducerFormLayout";

export default function ProducerEditStep4() {
  const { t } = useTranslation(["actor", "common"]);
  const searchParams = useSearchParams();
  const entityId = searchParams.get("entityId");
  const editOffline = searchParams.has("editOffline");

  const {
    formData,
    updateStep4Data,
    setStepValidation,
    setCurrentStep,
    saveProgress,
    resetForm,
  } = useProducerFormStore();

  const { createActor, updateActor, isLoading } = useActorStore();
  const { handleFinish } = useProducerFormNavigation();
  const { genders, parcelTypes } = useActorOptions();

  // Créer le schéma de validation
  const validationSchema = createStep4SummarySchema(t);

  // Form setup
  const form = useForm({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      confirmed: false, // Toujours false pour forcer la confirmation à chaque visite
    },
    mode: "onChange",
    criteriaMode: "firstError",
    shouldFocusError: true,
  });

  const { isValid } = form.formState;
  const isConfirmed = form.watch("confirmed");

  React.useEffect(() => {
    setCurrentStep(4);
    // Forcer la confirmation à false à chaque fois qu'on arrive sur cette étape
    form.setValue("confirmed", false);
  }, [setCurrentStep, form]);

  // Observer les changements de données
  useEffect(() => {
    const subscription = form.watch((data) => {
      updateStep4Data(data as Step4SummaryData);
      saveProgress(); // Auto-save
    });
    return () => subscription.unsubscribe();
  }, [form, updateStep4Data, saveProgress]);

  // Observer la validation
  useEffect(() => {
    setStepValidation(4, isValid);
  }, [isValid, setStepValidation]);

  const handleSubmit = useCallback(async () => {
    if (!isConfirmed) return;

    try {
      // Préparer les parcelles
      const parcels = (formData.step2?.parcels || []).map((parcel) => ({
        locationCode: parcel.locationCode,
        surfaceArea: parcel.surfaceArea || 0,
        parcelType: parcel.parcelType,
        identificationId: parcel.identificationId || "",
        onccId: parcel.onccId || "",
        // Convertir la date au format YYYY-MM-DD si elle existe
        parcelCreationDate: parcel.parcelCreationDate
          ? dayjs(parcel.parcelCreationDate).format("YYYY-MM-DD")
          : undefined,
        coordinates: (parcel.coordinates || []).map((coord, index) => ({
          latitude: coord.latitude,
          longitude: coord.longitude,
          pointOrder: index + 1,
        })),
      }));

      // Préparer les documents
      const allDocuments = [
        ...(formData.step3?.producerDocuments || []),
        ...(formData.step3?.landProofDocuments || []),
        ...(formData.step3?.complementaryDocuments || []),
      ];

      // ⭐ Conversion Blob → base64 au moment de l'upload
      const documents = await Promise.all(
        allDocuments.map(async (doc) => {
          // Si doc.data est un Blob, le convertir en base64
          // Sinon, c'est déjà une string base64 (document existant ou ancien format)
          const base64Data =
            doc.data instanceof Blob ? await blobToBase64(doc.data) : doc.data;

          return {
            base64Data,
            mimeType: doc.type,
            fileName: doc.name || "document",
            documentType: (doc.optionValues && doc.optionValues[1]) || "",
          };
        })
      );

      const metadata: Record<string, string | null> = {
        gender: formData.step1?.gender,
        birthDate: formData.step1?.birthDate,
        birthPlace: formData.step1?.birthPlace,
        sustainabilityProgram:
          formData.step1?.sustainabilityProgram?.toString() || null,
      };

      if (formData.step1?.cniNumber) {
        metadata.cniNumber = formData.step1?.cniNumber;
      }

      // Préparer les données de l'acteur selon le type ActorWithSync
      // Le statut sera défini automatiquement par le backend selon le rôle de l'utilisateur
      const actorData = {
        actorType: "PRODUCER" as const,
        familyName: formData.step1?.familyName || "",
        givenName: formData.step1?.givenName || "",
        email: formData.step1?.email,
        phone: formData.step1?.phone,
        locationCode: formData.step1?.locationCode || "",
        onccId: formData.step1?.onccId,
        identifiantId: formData.step1?.identifiantId,
        // status est omis volontairement - sera géré par le backend
        metadata,
        parcels,
        documents,
      };

      // Créer ou mettre à jour l'acteur
      if (editOffline && entityId) {
        // Mode édition offline : mettre à jour le payload existant
        await updateActor(
          entityId,
          actorData as unknown as Partial<ActorWithSync>,
          true
        );
      } else {
        // Mode création : créer un nouvel acteur
        await createActor(actorData as unknown as Omit<ActorWithSync, "id">);
      }

      // Réinitialiser le formulaire après succès
      resetForm();

      // Finaliser avec redirection
      handleFinish();
    } catch (error) {
      console.error("Erreur lors de la soumission:", error);
    }
  }, [
    isConfirmed,
    formData,
    createActor,
    updateActor,
    resetForm,
    handleFinish,
    editOffline,
    entityId,
  ]);

  // Boutons du footer
  const footerButtons = [
    <Button
      key="submit"
      type="button"
      onClick={handleSubmit}
      disabled={!isConfirmed || isLoading}
      className="flex items-center space-x-2"
    >
      <span>
        {editOffline && entityId
          ? t("summary.updateButton")
          : t("summary.confirmButton")}
      </span>
    </Button>,
  ];

  // Header avec titre
  const headerContent = (
    <div className="flex items-center space-x-3">
      <h1 className="text-xl font-medium text-gray-900">
        {t("summary.title")}
      </h1>
    </div>
  );

  return (
    <ProducerFormLayout className="!max-w-4xl">
      <BaseCard
        title={headerContent}
        footer={footerButtons}
        className="w-full"
        classNameFooter="!justify-between"
      >
        <Form {...form}>
          {/* Colonne de gauche - Informations personnelles */}
          <div className="space-y-4">
            <DetailRow
              label={t("form.familyName")}
              value={formData.step1?.familyName || ""}
              showChangeButton={true}
              changeHref="/actors/producer/create"
            />
            <DetailRow
              label={t("form.givenName")}
              value={formData.step1?.givenName || ""}
              showChangeButton={true}
              changeHref="/actors/producer/create"
            />
            <DetailRow
              label={t("form.gender")}
              value={
                genders.find(
                  (gender) => gender.value === formData.step1?.gender
                )?.label || ""
              }
              showChangeButton={true}
              changeHref="/actors/producer/create"
            />
            <DetailRow
              label={t("form.birthDate")}
              value={
                dayjs(formData.step1?.birthDate).format("DD/MM/YYYY") || ""
              }
              showChangeButton={true}
              changeHref="/actors/producer/create"
            />
            <DetailRow
              label={t("form.birthPlace")}
              value={formData.step1?.birthPlace || ""}
              showChangeButton={true}
              changeHref="/actors/producer/create"
            />
            <DetailRow
              label={t("form.locationCode")}
              value={
                <HierarchyDisplay code={formData.step1?.locationCode || ""} />
              }
              showChangeButton={true}
              changeHref="/actors/producer/create"
            />
            <DetailRow
              label={t("common:fields.phone")}
              value={
                (formData.step1?.phone &&
                  formatPhoneDisplay(formData.step1?.phone)) ||
                ""
              }
              showChangeButton={true}
              changeHref="/actors/producer/create"
            />
            <DetailRow
              label={t("common:fields.email")}
              value={formData.step1?.email || ""}
              showChangeButton={true}
              changeHref="/actors/producer/create"
            />
            <DetailRow
              label={t("form.cniNumber")}
              value={formData.step1?.cniNumber || ""}
              showChangeButton={true}
              changeHref="/actors/producer/create"
            />
            <DetailRow
              label={t("form.sustainabilityProgram")}
              value={
                formData.step1?.sustainabilityProgram
                  ? t("common:actions.yes")
                  : t("common:actions.no")
              }
              showChangeButton={true}
              changeHref="/actors/producer/create"
            />
            <DetailRow
              label={t("form.onccId")}
              value={formData.step1?.onccId || ""}
              showChangeButton={true}
              changeHref="/actors/producer/create"
            />
            <DetailRow
              label={t("form.identifiantId")}
              value={formData.step1?.identifiantId || ""}
              showChangeButton={true}
              changeHref="/actors/producer/create"
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
                    href="/actors/producer/create/parcels"
                    className="text-blue-600 hover:text-blue-700 p-0 h-auto font-normal text-sm"
                  >
                    {t("common:actions.change")}
                  </Link>
                </div>
                <div className="space-y-4">
                  {formData.step2.parcels.map((parcel, index) => (
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
                  ))}
                </div>
              </div>
            )}

            {/* Pièces jointes */}
            <div className="">
              <Separator className="my-6" />
              <div className="flex items-center justify-between mb-4">
                <Heading as="h3" size="body">
                  {t("summary.attachmentsTitle")}
                </Heading>
                <Link
                  href="/actors/producer/create/documents"
                  className="text-blue-600 hover:text-blue-700 p-0 h-auto font-normal text-sm"
                >
                  {t("summary.addAttachment")}
                </Link>
              </div>
              {(() => {
                const allDocuments = [
                  ...(formData.step3?.producerDocuments || []),
                  ...(formData.step3?.landProofDocuments || []),
                  ...(formData.step3?.complementaryDocuments || []),
                ];

                return allDocuments.length > 0 ? (
                  <div className="space-y-2">
                    {allDocuments.map((doc, index) => (
                      <DocumentPreview key={index} document={doc} />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    {t("summary.noAttachments")}
                  </p>
                );
              })()}
            </div>
          </div>

          {/* Confirmation en bas */}
          <div className="mt-8 mb-6">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="confirmed"
                checked={form.watch("confirmed")}
                onCheckedChange={(checked) =>
                  form.setValue("confirmed", checked as boolean)
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
        </Form>
      </BaseCard>
    </ProducerFormLayout>
  );
}
