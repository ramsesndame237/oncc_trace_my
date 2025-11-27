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
  type PurchaseAddFormData,
  usePurchaseAddFormStore,
} from "../../../../infrastructure/store/purchaseAddFormStore";
import { usePurchaseAddFormNavigation } from "../../../hooks/usePurchaseAddFormNavigation";
import { usePurchaseOptions } from "../../../hooks/usePurchaseOptions";
import {
  createPurchaseStep3DocumentsSchema,
  type PurchaseStep3DocumentsData,
} from "../../../schemas/purchase-validation-schemas";
import { PurchaseFormLayout } from "../PurchaseFormLayout";

const mapStoredPurchaseDocumentsToFileValues = (
  documents: PurchaseAddFormData["step3"]["purchaseContractDocuments"]
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

export function PurchaseAddStep3() {
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
  } = usePurchaseAddFormStore();

  const { navigateToNext, navigateToPrevious } = usePurchaseAddFormNavigation();

  const { showDocumentPreview } = useDocumentModal();

  const handlePreviewClick = (document: IFileValue) => {
    showDocumentPreview(document);
  };

  const [validationState, setValidationState] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const documentsLoadedRef = useRef(false);

  useEffect(() => {
    setIsNavigating(false);
  }, []);

  // Options pour les contrats d'achat
  const { purchaseContractDocuments } = usePurchaseOptions();

  const form = useForm<PurchaseStep3DocumentsData>({
    resolver: zodResolver(createPurchaseStep3DocumentsSchema(t)),
    defaultValues: {
      purchaseContractDocuments: mapStoredPurchaseDocumentsToFileValues(
        formData.step3.purchaseContractDocuments || []
      ),
    },
    mode: "onChange",
    criteriaMode: "firstError",
    shouldFocusError: true,
  });

  useEffect(() => {
    setCurrentStep(3);
    const isValid = form.formState.isValid;
    setStepValidation("step3", isValid);
    setValidationState(isValid);
  }, [setCurrentStep, form.formState.isValid, setStepValidation]);

  // Charger les documents depuis pendingOperations si en mode offline
  useEffect(() => {
    const loadDocumentsFromPendingOperation = async () => {
      if (!entityId || !editOffline || documentsLoadedRef.current) return;
      documentsLoadedRef.current = true;

      try {
        const pendingOperation = await db.pendingOperations
          .where("entityId")
          .equals(entityId)
          .first();

        if (pendingOperation && pendingOperation.payload) {
          const payload = pendingOperation.payload as Record<string, unknown>;

          const documentsInPayload = payload.documents as
            | Array<{
                base64Data: string;
                mimeType: string;
                fileName: string;
                documentType: string;
              }>
            | undefined;

          if (documentsInPayload && documentsInPayload.length > 0) {
            const purchaseContractDocTypes = new Set<string>(
              purchaseContractDocuments.map((d) => d.value)
            );

            const contractDocs: IFileValue[] = [];

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

              if (purchaseContractDocTypes.has(doc.documentType)) {
                contractDocs.push(fileValue);
              }
            }

            form.reset(
              {
                purchaseContractDocuments: contractDocs,
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

            updateStep3Data({
              purchaseContractDocuments: contractDocs,
            });

            setTimeout(async () => {
              await form.trigger();
            }, 200);
          }
        }
      } catch {
        // Silently fail
      }
    };

    loadDocumentsFromPendingOperation();
  }, [entityId, editOffline, form, updateStep3Data, purchaseContractDocuments]);

  // Auto-save quand les documents changent
  useEffect(() => {
    const subscription = form.watch((data) => {
      updateStep3Data(data as PurchaseStep3DocumentsData);
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

  const isNextButtonEnabled = validationState;

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

  const headerContent = (
    <div className="flex items-center space-x-3">
      <h1 className="text-xl font-medium text-gray-900">
        {t("transaction:purchaseAdd.steps.documents")}
      </h1>
    </div>
  );

  return (
    <PurchaseFormLayout>
      <div className="lg:flex items-start lg:space-x-4">
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
            <form className="space-y-8" id="purchase-step3-form">
              {/* Upload du contrat d'achat */}
              <div className="lg:w-2/3">
                <FormDocumentUploadWithOption
                  form={form}
                  name="purchaseContractDocuments"
                  label={t("transaction:purchaseAdd.fields.purchaseContract")}
                  description={
                    <span className="text-sm text-amber-600 mt-1">
                      {t(
                        "transaction:purchaseAdd.fields.purchaseContractDescription"
                      )}
                    </span>
                  }
                  placeholder={t(
                    "transaction:purchaseAdd.fields.purchaseContract"
                  )}
                  options={purchaseContractDocuments}
                  required
                  maxSizeMB={2}
                  labelButton={t("common:actions.upload")}
                  defaultFiles={
                    form.getValues("purchaseContractDocuments") || []
                  }
                  onPreviewClick={handlePreviewClick}
                />
              </div>
            </form>
          </Form>
        </BaseCard>
      </div>
    </PurchaseFormLayout>
  );
}
