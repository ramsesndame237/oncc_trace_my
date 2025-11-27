"use client";

import FormDocumentUploadWithOption from "@/components/forms/form-documentUploadWithOption";
import { Icon } from "@/components/icon";
import { BaseCard } from "@/components/modules/base-card";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { db } from "@/core/infrastructure/database/db";
import { useConventionFormStore } from "@/features/convention/infrastructure/store/conventionFormStore";
import {
  useConventionFormNavigation,
  useConventionOptions,
} from "@/features/convention/presentation/hooks";
import { useDocumentModal } from "@/features/document";
import {
  createStep3Schema,
  type Step3Data,
} from "@/features/convention/presentation/schemas/convention-validation-schemas";
import type { IFileValue } from "@/types/type";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { ConventionFormLayout } from "./ConventionFormLayout";

export function ConventionCreateStep3() {
  const { t } = useTranslation(["convention", "common"]);
  const searchParams = useSearchParams();
  const entityId = searchParams.get("entityId");
  const editOffline = searchParams.has("editOffline");

  const {
    formData,
    updateStep3Data,
    setCurrentStep,
    setStepValidation,
    saveProgress,
  } = useConventionFormStore();

  const { navigateToNext, navigateToPrevious, handleCancel } =
    useConventionFormNavigation();

  const { showDocumentPreview } = useDocumentModal();

  const handlePreviewClick = (document: IFileValue) => {
    showDocumentPreview(document);
  };

  // State pour forcer la mise à jour du bouton
  const [validationState, setValidationState] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const documentsLoadedRef = useRef(false);

  // Réinitialiser isNavigating quand le composant est monté (après PinGuard par exemple)
  useEffect(() => {
    setIsNavigating(false);
  }, []);

  // Options depuis le hook centralisé
  const { conventionDocuments, complementDocuments } = useConventionOptions();

  // Form setup
  const form = useForm({
    resolver: zodResolver(createStep3Schema(t)),
    defaultValues: {
      conventionDocuments: formData.step3.conventionDocuments || [],
      complementDocuments: formData.step3.complementDocuments || [],
    },
    mode: "onChange",
    criteriaMode: "firstError",
    shouldFocusError: true,
  });

  // Initialiser l'étape courante
  useEffect(() => {
    setCurrentStep(3);
    // Initialiser l'état de validation
    const isValid = form.formState.isValid;
    setStepValidation("step3", isValid);
    setValidationState(isValid);
  }, [setCurrentStep, form.formState.isValid, setStepValidation]);

  // Charger les documents depuis pendingOperations si en mode offline
  useEffect(() => {
    const loadDocumentsFromPendingOperation = async () => {
      // Ne charger qu'une seule fois
      if (!entityId || !editOffline || documentsLoadedRef.current) return;
      documentsLoadedRef.current = true;

      try {
        const pendingOperation = await db.pendingOperations
          .where("entityId")
          .equals(entityId)
          .first();

        if (pendingOperation && pendingOperation.payload) {
          const payload = pendingOperation.payload as Record<string, unknown>;

          // Extraire les documents du payload
          const documentsInPayload = payload.documents as Array<{
            base64Data: string;
            mimeType: string;
            fileName: string;
            documentType: string;
          }> | undefined;

          if (documentsInPayload && documentsInPayload.length > 0) {
            // Séparer les documents selon leur type
            const conventionDocTypes = new Set<string>(
              conventionDocuments.map((d) => d.value)
            );
            const complementDocTypes = new Set<string>(
              complementDocuments.map((d) => d.value)
            );

            const conventionDocs: IFileValue[] = [];
            const complementDocs: IFileValue[] = [];

            // Convertir chaque document au format IFileValue
            for (const doc of documentsInPayload) {
              // Calculer la taille approximative du fichier à partir du base64
              const base64String = doc.base64Data.includes(",")
                ? doc.base64Data.split(",")[1]
                : doc.base64Data;
              const fileSize = Math.ceil((base64String.length * 3) / 4);

              const fileValue: IFileValue = {
                optionValues: ["", doc.documentType],
                type: doc.mimeType,
                data: doc.base64Data,
                fileSize: fileSize,
                name: doc.fileName,
              };

              if (conventionDocTypes.has(doc.documentType)) {
                conventionDocs.push(fileValue);
              } else if (complementDocTypes.has(doc.documentType)) {
                complementDocs.push(fileValue);
              }
            }

            // Pré-remplir le formulaire avec les documents
            form.reset(
              {
                conventionDocuments: conventionDocs,
                complementDocuments: complementDocs,
              },
              {
                keepErrors: false,
                keepDirty: false,
                keepIsSubmitted: false,
                keepTouched: false,
                keepIsValid: false,
                keepSubmitCount: false,
              }
            );

            // Mettre à jour le formStore
            updateStep3Data({
              conventionDocuments: conventionDocs,
              complementDocuments: complementDocs,
            });

            // Forcer la revalidation après le reset
            setTimeout(async () => {
              await form.trigger();
            }, 200);
          }
        }
      } catch {
        // Silently fail - document loading is not critical
      }
    };

    loadDocumentsFromPendingOperation();
  }, [entityId, editOffline, form, updateStep3Data, conventionDocuments, complementDocuments]);

  // Auto-save quand les documents changent
  useEffect(() => {
    const subscription = form.watch((data) => {
      updateStep3Data(data as Step3Data);
      saveProgress();
    });
    return () => subscription.unsubscribe();
  }, [form, updateStep3Data, saveProgress]);

  // Observer la validation
  useEffect(() => {
    const subscription = form.watch(() => {
      const isValid = form.formState.isValid;
      setStepValidation("step3", isValid);
      setValidationState(isValid);
    });
    return () => subscription.unsubscribe();
  }, [form, setStepValidation]);

  const handleNext = useCallback(async () => {
    const isFormValid = await form.trigger();
    if (isFormValid && !isNavigating) {
      setIsNavigating(true);
      navigateToNext();
    }
  }, [form, navigateToNext, isNavigating]);

  const handleBack = useCallback(() => {
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

  // Header content
  const headerContent = (
    <div className="flex items-center space-x-3">
      <h1 className="text-xl font-medium text-gray-900">
        {t("convention:form.step3.cardTitle")}
      </h1>
    </div>
  );

  return (
    <ConventionFormLayout
      onHandleCancel={handleCancel}
      className="lg:flex items-start lg:space-x-4"
    >
      {/* Bouton Retour AVANT le BaseCard */}
      <div className="py-3">
        <Button variant="link" onClick={handleBack}>
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
        <Form {...form}>
          <form className="space-y-8" id="convention-step3-form">
            {/* Upload du contrat */}
            <div className="lg:w-2/3">
              <FormDocumentUploadWithOption
                form={form}
                name="conventionDocuments"
                label={t("convention:form.step3.contract")}
                description={
                  <span className="text-sm text-amber-600 mt-1">
                    {t("convention:form.step3.contractDescription")}
                  </span>
                }
                placeholder={t("convention:form.step3.contract")}
                options={conventionDocuments}
                required
                maxSizeMB={2}
                labelButton={t("common:actions.upload")}
                defaultFiles={form.getValues("conventionDocuments") || []}
                onPreviewClick={handlePreviewClick}
              />
            </div>

            <Separator className="my-4 lg:hidden" />

            {/* Upload des documents d'identification */}
            <div className="lg:w-2/3">
              <FormDocumentUploadWithOption
                form={form}
                name="complementDocuments"
                label={t("convention:form.step3.identificationDocs")}
                placeholder={t("convention:form.step3.identificationDocs")}
                options={complementDocuments}
                maxSizeMB={2}
                labelButton={t("common:actions.upload")}
                defaultFiles={form.getValues("complementDocuments") || []}
                onPreviewClick={handlePreviewClick}
              />
            </div>
          </form>
        </Form>
      </BaseCard>
    </ConventionFormLayout>
  );
}
