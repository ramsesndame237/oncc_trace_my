"use client";

import { DocumentPreview } from "@/components/documents";
import { Icon } from "@/components/icon";
import { BaseCard } from "@/components/modules/base-card";
import { DetailRow } from "@/components/modules/detail-row";
import { Heading } from "@/components/modules/heading";
import { SyncErrorAlert } from "@/components/modules/sync-error-alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Form } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { db, type OfflineActorData } from "@/core/infrastructure/database/db";
import { HierarchyDisplay } from "@/features/location/presentation/components";
import { blobToBase64 } from "@/lib/blobToBase64";
import { useDayjsLocale } from "@/hooks/useDayjsLocale";
import { formatPhoneDisplay } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import React, { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import type { ActorWithSync } from "../../../domain/actor.types";
import { useActorStore } from "../../../infrastructure/store/actorStore";
import { useExporterFormStore } from "../../../infrastructure/store/exporterFormStore";
import { useExporterFormNavigation } from "../../hooks/useExporterFormNavigation";
import {
  createStep5SummarySchema,
  type Step5SummaryData,
} from "../../schemas/exporter-validation-schemas";
import ExportersFormLayout from "./ExportersFormLayout";

export default function ExporterEditStep5() {
  const { t } = useTranslation(["actor", "common"]);
  const dayjs = useDayjsLocale();

  // État pour les buyers sélectionnés
  const [selectedBuyers, setSelectedBuyers] = useState<OfflineActorData[]>([]);
  const [isLoadingBuyers, setIsLoadingBuyers] = useState(false);
  const searchParams = useSearchParams();
  const entityId = searchParams.get("entityId");
  const editOffline = searchParams.has("editOffline");

  const {
    formData,
    updateStep5Data,
    setStepValidation,
    setCurrentStep,
    saveProgress,
    resetForm,
  } = useExporterFormStore();

  const { createActor, updateActor, isLoading } = useActorStore();
  const { handleFinish } = useExporterFormNavigation();

  // Créer le schéma de validation
  const validationSchema = createStep5SummarySchema(t);

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

  // Helper pour formater les dates avec dayjs
  const formatDate = (date: string | undefined | null) => {
    if (!date) return "";
    return dayjs(date).format("LL");
  };

  // Charger les buyers sélectionnés depuis IndexedDB
  useEffect(() => {
    const loadSelectedBuyers = async () => {
      setIsLoadingBuyers(true);
      try {
        const selectedIds = formData.step3?.selectedBuyerIds || [];
        if (selectedIds.length === 0) {
          setSelectedBuyers([]);
          setIsLoadingBuyers(false);
          return;
        }

        // Récupérer les buyers depuis IndexedDB
        const buyers = await db.actors
          .where("localId")
          .anyOf(selectedIds)
          .or("serverId")
          .anyOf(selectedIds)
          .toArray();

        setSelectedBuyers(buyers);
      } catch (error) {
        console.error("Erreur lors du chargement des buyers:", error);
        setSelectedBuyers([]);
      } finally {
        setIsLoadingBuyers(false);
      }
    };

    loadSelectedBuyers();
  }, [formData.step3?.selectedBuyerIds]);

  React.useEffect(() => {
    setCurrentStep(5);
    // Forcer la confirmation à false à chaque fois qu'on arrive sur cette étape
    form.setValue("confirmed", false);
  }, [setCurrentStep, form]);

  // Observer les changements de données
  useEffect(() => {
    const subscription = form.watch((data) => {
      updateStep5Data(data as Step5SummaryData);
      saveProgress(); // Auto-save
    });
    return () => subscription.unsubscribe();
  }, [form, updateStep5Data, saveProgress]);

  // Observer la validation
  useEffect(() => {
    setStepValidation(5, isValid);
  }, [isValid, setStepValidation]);

  const handleSubmit = useCallback(async () => {
    if (!isConfirmed) return;

    try {
      // Préparer les documents
      const allDocuments = [...(formData.step4?.exporterDocuments || [])];

      // ⭐ Conversion Blob → base64 au moment de l'upload
      const documents = await Promise.all(
        allDocuments.map(async (doc) => {
          // Si doc.data est un Blob, le convertir en base64
          // Sinon, c'est déjà une string base64 (document existant ou ancien format)
          const base64Data = doc.data instanceof Blob
            ? await blobToBase64(doc.data)
            : doc.data;

          return {
            base64Data,
            mimeType: doc.type,
            fileName: doc.name || "document",
            documentType: (doc.optionValues && doc.optionValues[1]) || "",
          };
        })
      );

      // Préparer les métadonnées Exporter
      const metadata: {
        professionalNumber?: string;
        rccmNumber?: string;
        exporterCode?: string;
      } = {};

      if (formData.step1?.metadata?.professionalNumber) {
        metadata.professionalNumber =
          formData.step1.metadata.professionalNumber;
      }
      if (formData.step1?.metadata?.rccmNumber) {
        metadata.rccmNumber = formData.step1.metadata.rccmNumber;
      }
      if (formData.step1?.metadata?.exporterCode) {
        metadata.exporterCode = formData.step1.metadata.exporterCode;
      }

      // Préparer les acheteurs mandataires sélectionnés
      const buyers =
        formData.step3?.selectedBuyerIds?.map((buyerId) => ({
          buyerId,
          mandateDate: undefined, // Optionnel - peut être ajouté plus tard
          status: "active" as const,
        })) || [];

      // Préparer les données de l'acteur selon le type ActorWithSync
      // Le statut sera défini automatiquement par le backend selon le rôle de l'utilisateur
      const actorData = {
        actorType: "EXPORTER" as const,
        familyName: formData.step1?.familyName || "",
        givenName: formData.step1?.givenName || "",
        locationCode: formData.step1?.locationCode || "",
        onccId: formData.step1?.onccId,
        identifiantId: formData.step1?.identifiantId,
        // status est omis volontairement - sera géré par le backend
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
        existenceDeclarationDate: formData.step1?.hasExistenceDeclaration
          ? formData.step1.existenceDeclarationDate
          : null,
        existenceDeclarationCode: formData.step1?.hasExistenceDeclaration
          ? formData.step1.existenceDeclarationCode
          : null,
        existenceDeclarationYears: formData.step1?.hasExistenceDeclaration
          ? parseInt(formData.step1.existenceDeclarationYears || "2")
          : null,
        managerInfo: {
          nom: formData.step2?.nom || "",
          prenom: formData.step2?.prenom || "",
          ...(formData.step2?.phone && { phone: formData.step2.phone }),
          email: formData.step2?.email || "",
        },
        buyers, // Ajouter les buyers transformés
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
      <span>{t("exporter.createExporter")}</span>
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
    <ExportersFormLayout className="!max-w-4xl">
      <BaseCard
        title={headerContent}
        footer={footerButtons}
        className="w-full"
        classNameFooter="!justify-between"
      >
        {/* Alerte d'erreur de synchronisation */}
        {editOffline && entityId && (
          <SyncErrorAlert entityId={entityId} entityType="actor" />
        )}

        <Form {...form}>
          {/* Informations Exporter */}
          <div className="space-y-4">
            <DetailRow
              label={t("exporter.fields.familyName")}
              value={formData.step1?.familyName || ""}
              showChangeButton={true}
              changeHref="/actors/exporters/create"
            />
            <DetailRow
              label={t("exporter.fields.givenName")}
              value={formData.step1?.givenName || ""}
              showChangeButton={true}
              changeHref="/actors/exporters/create"
            />
            <DetailRow
              label={t("exporter.fields.locationCode")}
              value={
                <HierarchyDisplay code={formData.step1?.locationCode || ""} />
              }
              showChangeButton={true}
              changeHref="/actors/exporters/create"
            />
            <DetailRow
              label={t("exporter.fields.onccId")}
              value={formData.step1?.onccId || ""}
              showChangeButton={true}
              changeHref="/actors/exporters/create"
            />
            <DetailRow
              label={t("exporter.fields.identifiantId")}
              value={formData.step1?.identifiantId || ""}
              showChangeButton={true}
              changeHref="/actors/exporters/create"
            />

            {/* Métadonnées */}
            <DetailRow
              label={t("exporter.fields.professionalNumber")}
              value={formData.step1?.metadata?.professionalNumber || ""}
              showChangeButton={true}
              changeHref="/actors/exporters/create"
            />
            <DetailRow
              label={t("exporter.fields.rccmNumber")}
              value={formData.step1?.metadata?.rccmNumber || ""}
              showChangeButton={true}
              changeHref="/actors/exporters/create"
            />
            <DetailRow
              label={t("exporter.fields.exporterCode")}
              value={formData.step1?.metadata?.exporterCode || ""}
              showChangeButton={true}
              changeHref="/actors/exporters/create"
            />

            {/* Déclaration d'existence */}
            <DetailRow
              label={t("exporter.fields.hasExistenceDeclaration")}
              value={
                formData.step1?.hasExistenceDeclaration
                  ? t("common:actions.yes")
                  : t("common:actions.no")
              }
              showChangeButton={true}
              changeHref="/actors/exporters/create"
              noBorder={!formData.step1?.hasExistenceDeclaration}
            />

            {formData.step1?.hasExistenceDeclaration && (
              <>
                <DetailRow
                  label={t("exporter.fields.existenceDeclarationDate")}
                  value={formatDate(formData.step1.existenceDeclarationDate)}
                  showChangeButton={true}
                  changeHref="/actors/exporters/create"
                />
                <DetailRow
                  label={t("exporter.fields.existenceDeclarationCode")}
                  value={formData.step1.existenceDeclarationCode || ""}
                  showChangeButton={true}
                  changeHref="/actors/exporters/create"
                />
                <DetailRow
                  label={t("exporter.fields.existenceDeclarationYears")}
                  value={`${formData.step1.existenceDeclarationYears} ${t(
                    parseInt(formData.step1.existenceDeclarationYears || "0") === 1
                      ? "common:units.year"
                      : "common:units.years"
                  )}`}
                  showChangeButton={true}
                  changeHref="/actors/exporters/create"
                  noBorder={true}
                />
              </>
            )}

            {/* Informations du gestionnaire */}
            <Separator className="my-6" />
            <Heading as="h3" size="body">
              {t("exporter.sections.manager")}
            </Heading>
            <DetailRow
              label={t("exporter.fields.managerLastName")}
              value={formData.step2?.nom || ""}
              showChangeButton={true}
              changeHref="/actors/exporters/create/manager"
            />
            <DetailRow
              label={t("exporter.fields.managerFirstName")}
              value={formData.step2?.prenom || ""}
              showChangeButton={true}
              changeHref="/actors/exporters/create/manager"
            />
            <DetailRow
              label={t("exporter.fields.managerEmail")}
              value={formData.step2?.email || ""}
              showChangeButton={true}
              changeHref="/actors/exporters/create/manager"
            />

            <DetailRow
              label={t("exporter.fields.managerPhone")}
              value={formatPhoneDisplay(formData.step2.phone)}
              showChangeButton={true}
              changeHref="/actors/exporters/create/manager"
              noBorder={true}
            />

            {/* Section Acheteurs Mandataires (step3) */}
            <div className="space-y-4">
              <Separator className="my-6" />
              <div className="flex items-center justify-between mb-4">
                <Heading as="h3" size="body">
                  {t("buyer.summary.buyersTitle", {
                    count: formData.step3?.selectedBuyerIds?.length || 0,
                  })}
                </Heading>
                <Link
                  href="/actors/exporters/create/buyers"
                  className="text-blue-600 hover:text-blue-700 p-0 h-auto font-normal text-sm"
                >
                  {t("common:actions.change")}
                </Link>
              </div>

              {isLoadingBuyers ? (
                <div className="text-center py-4">
                  <Icon
                    name="Loader2"
                    className="h-8 w-8 text-gray-400 mx-auto mb-2 animate-spin"
                  />
                  <p className="text-sm text-muted-foreground">
                    {t("form.loadingData")}
                  </p>
                </div>
              ) : selectedBuyers.length === 0 ? (
                <p className="text-sm text-gray-500">
                  {t("buyer.summary.buyersCount", { count: 0 })}
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t("buyersTable.columns.fullName")}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t("buyersTable.columns.onccId")}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedBuyers.map((buyer, index) => (
                        <tr key={buyer.serverId || buyer.localId || index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center">
                              <Icon
                                name="UserIcon"
                                className="h-4 w-4 text-gray-400 mr-2"
                              />
                              <span className="text-sm font-medium text-gray-900">
                                {buyer.familyName} {buyer.givenName}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-sm text-gray-500">
                              {buyer.onccId || "-"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Pièces jointes */}
            <div className="">
              <Separator className="my-6" />
              <div className="flex items-center justify-between mb-4">
                <Heading as="h3" size="body">
                  {t("summary.attachmentsTitle")}
                </Heading>
                <Link
                  href="/actors/exporters/create/documents"
                  className="text-blue-600 hover:text-blue-700 p-0 h-auto font-normal text-sm"
                >
                  {t("summary.addAttachment")}
                </Link>
              </div>
              {(() => {
                const allDocuments = [
                  ...(formData.step4?.exporterDocuments || []),
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
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:exportercity-70"
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
    </ExportersFormLayout>
  );
}
