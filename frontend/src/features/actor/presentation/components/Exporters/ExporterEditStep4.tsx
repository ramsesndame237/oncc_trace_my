"use client";

import FormDocumentUploadWithOption from "@/components/forms/form-documentUploadWithOption";
import { Icon } from "@/components/icon";
import { BaseCard } from "@/components/modules/base-card";
import { SyncErrorAlert } from "@/components/modules/sync-error-alert";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { db } from "@/core/infrastructure/database/db";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams } from "next/navigation";
import React, { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useExporterFormStore } from "../../../infrastructure/store/exporterFormStore";
import { useExporterOptions } from "../../hooks/useActorOptions";
import { useExporterFormNavigation } from "../../hooks/useExporterFormNavigation";
import { useDocumentModal } from "@/features/document";
import type { IFileValue } from "@/types/type";
import {
  createStep4DocumentsSchemaWithValidation,
  type Step4DocumentsData,
} from "../../schemas/exporter-validation-schemas";
import ExportersFormLayout from "./ExportersFormLayout";

export default function ExporterEditStep4() {
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
  } = useExporterFormStore();

  const { navigateToNext, navigateToPrevious } = useExporterFormNavigation();
  const { exporterDocuments } = useExporterOptions();

  const { showDocumentPreview } = useDocumentModal();

  const handlePreviewClick = (document: IFileValue) => {
    showDocumentPreview(document);
  };

  // Créer le schéma de validation dynamique avec les documents requis
  const validationSchema = createStep4DocumentsSchemaWithValidation(
    t,
    exporterDocuments
  );

  // Form setup
  const form = useForm({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      exporterDocuments: formData.step4?.exporterDocuments || [],
    },
    mode: "onChange",
    criteriaMode: "firstError",
    shouldFocusError: true,
  });

  // State pour forcer la mise à jour du bouton
  const [validationState, setValidationState] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isLoadingOfflineData, setIsLoadingOfflineData] = useState(false);
  const [hasLoadedData, setHasLoadedData] = useState(false);

  // Réinitialiser isNavigating quand le composant est monté (après PinGuard par exemple)
  useEffect(() => {
    setIsNavigating(false);
  }, []);

  React.useEffect(() => {
    setCurrentStep(4);
    // Initialiser l'état de validation
    const isValid = form.formState.isValid;
    setStepValidation(4, isValid);
    setValidationState(isValid);
  }, [setCurrentStep, form.formState.isValid, setStepValidation]);

  // Charger les données depuis pendingOperations si en mode offline
  useEffect(() => {
    const loadOfflineData = async () => {
      if (entityId && editOffline && !hasLoadedData) {
        setIsLoadingOfflineData(true);
        try {
          const pendingOperation = await db.pendingOperations
            .where("entityId")
            .equals(entityId)
            .first();

          if (pendingOperation && pendingOperation.payload) {
            const payload = pendingOperation.payload as Record<string, unknown>;

            // Créer des sets pour identifier les types de documents
            const exporterDocTypes = new Set<string>(
              exporterDocuments.map((d) => d.value)
            );

            interface PayloadDocument {
              documentType: string;
              mimeType: string;
              base64Data: string;
            }

            // Grouper les documents selon leur type
            const exporterDocs: Array<{
              optionValues: [string, string];
              type: string;
              data: string;
              fileSize: number;
            }> = [];

            // Parcourir tous les documents du payload
            if (payload?.documents && Array.isArray(payload.documents)) {
              payload.documents.forEach((doc: unknown) => {
                const document = doc as PayloadDocument;
                // Calculer la taille du fichier à partir du base64
                const base64String = document.base64Data?.split(",")[1] || "";
                const fileSize = Math.ceil((base64String.length * 3) / 4);

                // Mapper la structure du payload vers la structure attendue par le schéma
                const mappedDoc = {
                  optionValues: ["", document.documentType] as [string, string],
                  type: document.mimeType,
                  data: document.base64Data,
                  fileSize: fileSize,
                };

                if (exporterDocTypes.has(document.documentType)) {
                  exporterDocs.push(mappedDoc);
                }
              });
            }

            // Pré-remplir le formulaire avec les données des documents du payload
            const step4Data: Step4DocumentsData = {
              exporterDocuments: exporterDocs.map((doc) => ({
                optionValues: doc.optionValues,
                type: doc.type,
                data: doc.data,
                fileSize: doc.fileSize,
                name: doc.optionValues[1] || "document",
              })),
            };

            // Mettre à jour le store
            updateStep4Data(step4Data);

            // Réinitialiser le formulaire avec les nouvelles données
            form.reset(step4Data);

            // Forcer une revalidation complète
            form.trigger();
          }
        } catch (error) {
          console.error(
            "Erreur lors du chargement des données offline:",
            error
          );
        } finally {
          setIsLoadingOfflineData(false);
          setHasLoadedData(true);
        }
      } else if (!entityId || !editOffline) {
        // Réinitialiser si on n'est plus en mode offline
        setHasLoadedData(false);
        setIsLoadingOfflineData(false);
      }
    };

    loadOfflineData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityId, editOffline, hasLoadedData]);

  // Observer les changements de données
  useEffect(() => {
    const subscription = form.watch((data) => {
      updateStep4Data(data as Step4DocumentsData);
      saveProgress(); // Auto-save
    });
    return () => subscription.unsubscribe();
  }, [form, updateStep4Data, saveProgress]);

  // Observer la validation
  useEffect(() => {
    const subscription = form.watch(() => {
      const isValid = form.formState.isValid;
      setStepValidation(3, isValid);
      setValidationState(isValid);
    });
    return () => subscription.unsubscribe();
  }, [form, setStepValidation]);

  const handleNext = useCallback(async () => {
    // Trigger form validation
    const isValid = await form.trigger();

    if (isValid && !isNavigating) {
      setIsNavigating(true);
      navigateToNext();
    }
  }, [form, navigateToNext, isNavigating]);

  const handlePrevious = useCallback(() => {
    navigateToPrevious();
  }, [navigateToPrevious]);

  // Vérifier si le bouton suivant doit être activé
  const isNextButtonEnabled = validationState;

  // Boutons du footer
  const footerButtons = [
    <Button
      key="next"
      type="button"
      onClick={handleNext}
      disabled={!isNextButtonEnabled || isNavigating}
      className="flex items-center space-x-2"
    >
      <span>{t("common:actions.next")}</span>
    </Button>,
  ];

  // Header avec titre et description
  const headerContent = (
    <div className="space-y-2">
      <h1 className="text-xl font-medium text-gray-900">
        {t("exporter.sections.documents")}
      </h1>
    </div>
  );

  return (
    <ExportersFormLayout className="lg:flex items-start lg:space-x-4">
      <div className="py-3">
        <Button variant="link" onClick={handlePrevious}>
          <Icon name="ArrowLeft" />
          <span>{t("common:actions.back")}</span>
        </Button>
      </div>
      <BaseCard
        title={headerContent}
        footer={footerButtons}
        className="w-full flex-1"
        classNameFooter="!justify-between"
      >
        {/* Alerte d'erreur de synchronisation */}
        {editOffline && entityId && (
          <SyncErrorAlert entityId={entityId} entityType="actor" />
        )}

        {isLoadingOfflineData && (
          <div className="p-4 text-center text-muted-foreground">
            {t("form.loadingData")}
          </div>
        )}

        <Form {...form}>
          <form className="space-y-8" id="exporter-step4-form">
            {/* Section 1: Documents Exporter obligatoires */}
            <div className="lg:w-2/3">
              <FormDocumentUploadWithOption
                form={form}
                name="exporterDocuments"
                label={t("exporter.sections.documents")}
                options={exporterDocuments}
                labelButton={t("common:actions.upload")}
                placeholder={t("exporter.sections.documents")}
                maxSizeMB={2}
                required
                defaultFiles={formData.step4?.exporterDocuments || []}
                description={
                  <span className="text-sm text-amber-600 mt-1">
                    {t("documents.allDocumentsRequired")}
                  </span>
                }
                onPreviewClick={handlePreviewClick}
              />
            </div>
          </form>
        </Form>
      </BaseCard>
    </ExportersFormLayout>
  );
}
