"use client";

import FormDocumentUploadWithOption from "@/components/forms/form-documentUploadWithOption";
import { Icon } from "@/components/icon";
import { BaseCard } from "@/components/modules/base-card";
import { SyncErrorAlert } from "@/components/modules/sync-error-alert";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { db } from "@/core/infrastructure/database/db";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams } from "next/navigation";
import React, { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useTransformerFormStore } from "../../../infrastructure/store/transformerFormStore";
import { useTransformerOptions } from "../../hooks/useActorOptions";
import { useTransformerFormNavigation } from "../../hooks/useTransformerFormNavigation";
import { useDocumentModal } from "@/features/document";
import type { IFileValue } from "@/types/type";
import {
  createStep3DocumentsSchemaWithValidation,
  type Step3DocumentsData,
} from "../../schemas/transformer-validation-schemas";
import TransformerFormLayout from "./TransformerFormLayout";

export default function TransformerEditStep3() {
  const { t } = useTranslation(["actor", "common", "document"]);
  const searchParams = useSearchParams();
  const entityId = searchParams.get("entityId");
  const editOffline = searchParams.has("editOffline");

  const {
    formData,
    updateStep3Data,
    setStepValidation,
    setCurrentStep,
    saveProgress,
  } = useTransformerFormStore();

  const { navigateToNext, navigateToPrevious } = useTransformerFormNavigation();
  const { transformerDocuments, complementDocuments } = useTransformerOptions();

  const { showDocumentPreview } = useDocumentModal();

  const handlePreviewClick = (document: IFileValue) => {
    showDocumentPreview(document);
  };

  // Créer le schéma de validation dynamique avec les documents requis
  const validationSchema = createStep3DocumentsSchemaWithValidation(
    t,
    transformerDocuments
  );

  // Form setup
  const form = useForm({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      documents: formData.step3?.documents || [],
      complementaryDocuments: formData.step3?.complementaryDocuments || [],
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
    setCurrentStep(3);
    // Initialiser l'état de validation
    const isValid = form.formState.isValid;
    setStepValidation(3, isValid);
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
            const transformerDocTypes = new Set<string>(
              transformerDocuments.map((d) => d.value)
            );
            const complementDocTypes = new Set<string>(
              complementDocuments.map((d) => d.value)
            );

            interface PayloadDocument {
              documentType: string;
              mimeType: string;
              base64Data: string;
            }

            // Grouper les documents selon leur type
            const transformerDocs: Array<{
              optionValues: [string, string];
              type: string;
              data: string;
              fileSize: number;
            }> = [];
            const complementDocs: Array<{
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

                if (transformerDocTypes.has(document.documentType)) {
                  transformerDocs.push(mappedDoc);
                } else if (complementDocTypes.has(document.documentType)) {
                  complementDocs.push(mappedDoc);
                }
              });
            }

            // Pré-remplir le formulaire avec les données des documents du payload
            const step3Data: Step3DocumentsData = {
              documents: transformerDocs.map((doc) => ({
                optionValues: doc.optionValues,
                type: doc.type,
                data: doc.data,
                fileSize: doc.fileSize,
                name: doc.optionValues[1] || "document",
              })),
              complementaryDocuments: complementDocs.map((doc) => ({
                optionValues: doc.optionValues,
                type: doc.type,
                data: doc.data,
                fileSize: doc.fileSize,
                name: doc.optionValues[1] || "document",
              })),
            };

            // Mettre à jour le store
            updateStep3Data(step3Data);

            // Réinitialiser le formulaire avec les nouvelles données
            form.reset(step3Data);

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
      updateStep3Data(data as Step3DocumentsData);
      saveProgress(); // Auto-save
    });
    return () => subscription.unsubscribe();
  }, [form, updateStep3Data, saveProgress]);

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
        {t("transformer.sections.documents")}
      </h1>
    </div>
  );

  return (
    <TransformerFormLayout className="lg:flex items-start lg:space-x-4">
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
          <form className="space-y-8" id="transformer-step3-form">
            {/* Section 1: Documents Transformer obligatoires */}
            <div className="lg:w-2/3">
              <FormDocumentUploadWithOption
                form={form}
                name="documents"
                label={t("transformer.sections.documents")}
                options={transformerDocuments}
                labelButton={t("common:actions.upload")}
                placeholder={t("transformer.sections.documents")}
                maxSizeMB={2}
                required
                defaultFiles={formData.step3?.documents || []}
                description={
                  <span className="text-sm text-amber-600 mt-1">
                    {t("documents.allDocumentsRequired")}
                  </span>
                }
                onPreviewClick={handlePreviewClick}
              />
            </div>

            <Separator className="my-4 lg:hidden" />

            {/* Section 2: Documents complémentaires (optionnels) */}
            <div className="lg:w-2/3">
              <FormDocumentUploadWithOption
                form={form}
                name="complementaryDocuments"
                label={t("document:labels.otherDocument")}
                options={complementDocuments}
                placeholder={t("document:labels.otherDocument")}
                labelButton={t("common:actions.upload")}
                defaultFiles={formData.step3?.complementaryDocuments || []}
                onPreviewClick={handlePreviewClick}
              />
            </div>
          </form>
        </Form>
      </BaseCard>
    </TransformerFormLayout>
  );
}
