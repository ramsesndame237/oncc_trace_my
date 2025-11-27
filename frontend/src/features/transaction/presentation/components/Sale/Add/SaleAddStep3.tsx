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
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
  type SaleAddFormData,
  useSaleAddFormStore,
} from "../../../../infrastructure/store/saleAddFormStore";
import { useSaleAddFormNavigation } from "../../../hooks/useSaleAddFormNavigation";
import { useSaleOptions } from "../../../hooks/useSaleOptions";
import {
  createStep3DocumentsSchema,
  type Step3DocumentsData,
} from "../../../schemas/sale-validation-schemas";
import { SaleFormLayout } from "../SaleFormLayout";

const mapStoredDocumentsToFileValues = (
  documents: SaleAddFormData["step3"]["saleContractDocuments"]
): IFileValue[] =>
  documents.map((doc) => ({
    optionValues: Array.isArray(doc.optionValues)
      ? (doc.optionValues as IFileValue["optionValues"])
      : [],
    type: doc.type,
    data: doc.data,
    fileSize: doc.fileSize,
    name: doc.name,
  }));

export function SaleAddStep3() {
  const { t } = useTranslation(["transaction", "common"]);
  const searchParams = useSearchParams();
  const entityId = searchParams.get("entityId");
  const editOffline = searchParams.has("editOffline");
  const returnTo = searchParams.get("returnTo");

  const {
    formData,
    updateStep3Data,
    setCurrentStep,
    setStepValidation,
    saveProgress,
  } = useSaleAddFormStore();

  const { navigateToNext, navigateToPrevious } = useSaleAddFormNavigation();

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
  const { saleContractDocuments } = useSaleOptions();

  // Form setup
  const form = useForm<Step3DocumentsData>({
    resolver: zodResolver(createStep3DocumentsSchema(t)),
    defaultValues: {
      saleContractDocuments: mapStoredDocumentsToFileValues(
        formData.step3.saleContractDocuments || []
      ),
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
          const documentsInPayload = payload.documents as
            | Array<{
                base64Data: string;
                mimeType: string;
                fileName: string;
                documentType: string;
              }>
            | undefined;

          if (documentsInPayload && documentsInPayload.length > 0) {
            const saleContractDocTypes = new Set<string>(
              saleContractDocuments.map((d) => d.value)
            );

            const contractDocs: IFileValue[] = [];

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

              if (saleContractDocTypes.has(doc.documentType)) {
                contractDocs.push(fileValue);
              }
            }

            // Pré-remplir le formulaire avec les documents
            form.reset(
              {
                saleContractDocuments: contractDocs,
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
              saleContractDocuments: contractDocs,
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
  }, [entityId, editOffline, form, updateStep3Data, saleContractDocuments]);

  // Auto-save quand les documents changent
  useEffect(() => {
    const subscription = form.watch((data) => {
      updateStep3Data(data as Step3DocumentsData);
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
      navigateToNext(
        3,
        editOffline,
        entityId || undefined,
        returnTo || undefined
      );
    }
  }, [form, navigateToNext, isNavigating, editOffline, entityId, returnTo]);

  const handleBack = useCallback(() => {
    navigateToPrevious(
      editOffline,
      entityId || undefined,
      returnTo || undefined
    );
  }, [navigateToPrevious, editOffline, entityId, returnTo]);

  // Vérifier si le bouton suivant doit être activé
  const isNextButtonEnabled = validationState;

  // Boutons du footer
  const footerButtons = (
    <div className="flex gap-2 justify-end">
      <Button
        type="button"
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
        {t("transaction:saleAdd.steps.documents")}
      </h1>
    </div>
  );

  return (
    <SaleFormLayout>
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
            <form className="space-y-8" id="sale-step3-form">
              {/* Upload du contrat de vente */}
              <div className="lg:w-2/3">
                <FormDocumentUploadWithOption
                  form={form}
                  name="saleContractDocuments"
                  label={t("transaction:saleAdd.fields.saleContract")}
                  description={
                    <span className="text-sm text-amber-600 mt-1">
                      {t("transaction:saleAdd.fields.saleContractDescription")}
                    </span>
                  }
                  placeholder={t("transaction:saleAdd.fields.saleContract")}
                  options={saleContractDocuments}
                  required
                  maxSizeMB={2}
                  labelButton={t("common:actions.upload")}
                  defaultFiles={form.getValues("saleContractDocuments") || []}
                  onPreviewClick={handlePreviewClick}
                />
              </div>
            </form>
          </Form>
        </BaseCard>
      </div>
    </SaleFormLayout>
  );
}
