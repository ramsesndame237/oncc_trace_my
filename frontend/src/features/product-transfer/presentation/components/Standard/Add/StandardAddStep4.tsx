"use client";

import FormDocumentUploadWithOption from "@/components/forms/form-documentUploadWithOption";
import { Icon } from "@/components/icon";
import { BaseCard } from "@/components/modules/base-card";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { db } from "@/core/infrastructure/database/db";
import { useDocumentModal } from "@/features/document";
import type { IFileValue } from "@/types/type";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useStandardAddFormStore } from "../../../../infrastructure/store/standardAddFormStore";
import { useStandardAddFormNavigation, useProductTransferOptions } from "../../../hooks";
import {
  step4Schema,
  type Step4Data,
} from "../../../schemas/standard-validation-schemas";
import { StandardFormLayout } from "./StandardFormLayout";

export function StandardAddStep4() {
  const { t } = useTranslation(["productTransfer", "common"]);

  const {
    formData,
    updateStep4Data,
    setCurrentStep,
    setStepValidation,
    saveProgress,
    entityId,
    editOffline,
  } = useStandardAddFormStore();

  const { navigateToNext, navigateToPrevious } = useStandardAddFormNavigation();
  const { showDocumentPreview } = useDocumentModal();

  const [validationState, setValidationState] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  // Réinitialiser isNavigating quand le composant est monté (après PinGuard par exemple)
  useEffect(() => {
    setIsNavigating(false);
  }, []);

  const documentsLoadedRef = useRef(false);

  // Options depuis le hook centralisé
  const { routeSheetDocuments: routeSheetDocumentOptions } = useProductTransferOptions();

  const handlePreviewClick = (document: IFileValue) => {
    showDocumentPreview(document);
  };

  // Form setup
  const form = useForm<Step4Data>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(step4Schema) as any,
    defaultValues: {
      routeSheetDocuments: formData.step4.routeSheetDocuments || [],
    },
    mode: "onChange",
    criteriaMode: "firstError",
    shouldFocusError: true,
  });

  // Initialiser l'étape courante
  useEffect(() => {
    setCurrentStep(4);
    const isValid = form.formState.isValid;
    setStepValidation("step4", isValid);
    setValidationState(isValid);
  }, [setCurrentStep, form.formState.isValid, setStepValidation]);

  // Charger les données offline si en mode editOffline
  useEffect(() => {
    const loadOfflineData = async () => {
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
          const documentsInPayload = payload.routeSheetDocuments as
            | Array<{
                base64Data: string;
                mimeType: string;
                fileName: string;
                documentType: string;
              }>
            | undefined;

          if (documentsInPayload && documentsInPayload.length > 0) {
            const routeSheetDocs: IFileValue[] = [];

            // Convertir chaque document au format IFileValue
            for (const doc of documentsInPayload) {
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

              routeSheetDocs.push(fileValue);
            }

            form.reset(
              {
                routeSheetDocuments: routeSheetDocs,
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

            updateStep4Data({
              routeSheetDocuments: routeSheetDocs,
            });

            setTimeout(async () => {
              await form.trigger();
            }, 200);
          }
        }
      } catch {
        // Silently fail - offline data loading is not critical
      }
    };

    loadOfflineData();
  }, [entityId, editOffline, form, updateStep4Data]);

  // Auto-save
  useEffect(() => {
    const subscription = form.watch((data) => {
      updateStep4Data(data as Step4Data);
      saveProgress();
    });
    return () => subscription.unsubscribe();
  }, [form, updateStep4Data, saveProgress]);

  // Observer la validation
  useEffect(() => {
    const subscription = form.watch(() => {
      const isValid = form.formState.isValid;
      setStepValidation("step4", isValid);
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

  const isNextButtonEnabled = validationState;

  // Footer buttons
  const footerButtons = (
    <div className="flex gap-2 justify-end">
      <Button
        onClick={handleNext}
        disabled={!isNextButtonEnabled || isNavigating}
      >
        {t("common:actions.next")}
      </Button>
    </div>
  );

  // Header content
  const headerContent = (
    <div className="flex items-center space-x-3">
      <h1 className="text-xl font-medium text-gray-900">
        {t("productTransfer:form.step4.title")}
      </h1>
    </div>
  );

  return (
    <StandardFormLayout>
      <div className="lg:flex items-start lg:space-x-4">
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
          className="w-full"
        >
          <Form {...form}>
            <form className="space-y-6">
              {/* Upload des bordereaux de route */}
              <div className="lg:w-2/3">
                <FormDocumentUploadWithOption
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  form={form as any}
                  name="routeSheetDocuments"
                  label={t("productTransfer:form.step4.routeSheetDocuments")}
                  placeholder={t(
                    "productTransfer:form.step4.routeSheetDocuments"
                  )}
                  options={routeSheetDocumentOptions}
                  maxSizeMB={2}
                  labelButton={t("common:actions.upload")}
                  defaultFiles={form.getValues("routeSheetDocuments") || []}
                  onPreviewClick={handlePreviewClick}
                />
              </div>
            </form>
          </Form>
        </BaseCard>
      </div>
    </StandardFormLayout>
  );
}
