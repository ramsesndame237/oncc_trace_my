"use client";

import { DocumentPreview } from "@/components/documents";
import { BaseCard } from "@/components/modules/base-card";
import { DetailRow } from "@/components/modules/detail-row";
import { Heading } from "@/components/modules/heading";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTable } from "@/components/ui/data-table";
import { Form } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { db } from "@/core/infrastructure/database/db";
import { SyncStatus } from "@/core/domain/sync.types";
import { TransactionServiceProvider } from "@/features/transaction/infrastructure/di/transactionServiceProvider";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useIsMobile } from "@/hooks/use-mobile";
import { useDayjsLocale } from "@/hooks/useDayjsLocale";
import { showError, showInfo } from "@/lib/notifications/toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useSaleAddFormStore } from "../../../../infrastructure/store/saleAddFormStore";
import { useSaleAddFormNavigation } from "../../../hooks/useSaleAddFormNavigation";
import {
  createStep4SummarySchema,
  type Step4SummaryData,
} from "../../../schemas/sale-validation-schemas";
import { createSaleProductColumns } from "../../Columns";
import { SaleFormLayout } from "../SaleFormLayout";

/**
 * Convertit un Blob en chaîne base64
 */
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export function SaleAddStep4() {
  const { t } = useTranslation(["transaction", "common"]);
  const searchParams = useSearchParams();
  const entityId = searchParams.get("entityId");
  const editOffline = searchParams.has("editOffline");
  const isMobile = useIsMobile();
  const dayjs = useDayjsLocale();
  const isOnline = useOnlineStatus();

  const {
    formData,
    updateStep4Data,
    setCurrentStep,
    setStepValidation,
    saveProgress,
    resetForm,
  } = useSaleAddFormStore();

  const { handleFinish } = useSaleAddFormNavigation();

  const [isNavigating, setIsNavigating] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // States pour stocker les noms des acteurs
  const [sellerName, setSellerName] = useState<string>("");
  const [buyerName, setBuyerName] = useState<string>("");
  const [exporterName, setExporterName] = useState<string>("");
  const [calendarInfo, setCalendarInfo] = useState<string>("");
  const [conventionCode, setConventionCode] = useState<string>("");
  const producerOptions = useMemo<Array<{ value: string; label: string }>>(() => [], []);

  // Réinitialiser isNavigating quand le composant est monté (après PinGuard par exemple)
  useEffect(() => {
    setIsNavigating(false);
  }, []);

  // Form setup
  const form = useForm<Step4SummaryData>({
    resolver: zodResolver(createStep4SummarySchema(t)),
    defaultValues: {
      confirmed: false,
      notes: formData.step4.notes || "",
    },
    mode: "onChange",
    criteriaMode: "firstError",
    shouldFocusError: true,
  });

  const { isValid } = form.formState;
  const isConfirmed = form.watch("confirmed");

  // Initialiser l'étape courante
  useEffect(() => {
    setCurrentStep(4);
    // Forcer la confirmation à false à chaque fois qu'on arrive sur cette étape
    form.setValue("confirmed", false);
  }, [setCurrentStep, form]);

  // Charger les noms depuis IndexedDB
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoadingData(true);

        // ✅ Charger le nom du vendeur
        if (formData.step1.sellerId) {
          const sellerActor = await db.actors
            .where("serverId")
            .equals(formData.step1.sellerId)
            .or("localId")
            .equals(formData.step1.sellerId)
            .first();

          if (sellerActor) {
            setSellerName(
              `${sellerActor.familyName} ${sellerActor.givenName}`.trim()
            );
          }
        }

        // ✅ Charger le nom de l'acheteur
        if (formData.step1.buyerId) {
          const buyerActor = await db.actors
            .where("serverId")
            .equals(formData.step1.buyerId)
            .or("localId")
            .equals(formData.step1.buyerId)
            .first();

          if (buyerActor) {
            setBuyerName(
              `${buyerActor.familyName} ${buyerActor.givenName}`.trim()
            );
          }
        }

        // ✅ Charger le nom de l'exportateur principal
        if (formData.step1.principalExporterId) {
          const exporterActor = await db.actors
            .where("serverId")
            .equals(formData.step1.principalExporterId)
            .or("localId")
            .equals(formData.step1.principalExporterId)
            .first();

          if (exporterActor) {
            setExporterName(
              `${exporterActor.familyName} ${exporterActor.givenName}`.trim()
            );
          }
        }

        // ✅ Charger les informations du calendrier depuis db.calendars
        if (formData.step1.calendarId) {
          const calendar = await db.calendars
            .where("serverId")
            .equals(formData.step1.calendarId)
            .or("localId")
            .equals(formData.step1.calendarId)
            .first();

          if (calendar) {
            setCalendarInfo(
              `${calendar.location || ""} - ${dayjs(
                calendar.startDate
              ).format("LL")}`
            );
          }
        }

        // ✅ Charger le code de la convention depuis db.conventions
        if (formData.step1.conventionId) {
          const convention = await db.conventions
            .where("serverId")
            .equals(formData.step1.conventionId)
            .or("localId")
            .equals(formData.step1.conventionId)
            .first();

          if (convention) {
            setConventionCode(convention.code);
          }
        }
      } catch {
        // Silently fail - data loading is not critical
      } finally {
        setIsLoadingData(false);
      }
    };

    loadData();
  }, [
    formData.step1.sellerId,
    formData.step1.buyerId,
    formData.step1.principalExporterId,
    formData.step1.calendarId,
    formData.step1.conventionId,
    dayjs,
  ]);

  // Observer les changements de données (auto-save)
  useEffect(() => {
    const subscription = form.watch((data) => {
      updateStep4Data(data as Step4SummaryData);
      saveProgress();
    });
    return () => subscription.unsubscribe();
  }, [form, updateStep4Data, saveProgress]);

  // Observer la validation
  useEffect(() => {
    setStepValidation("step4", isValid);
  }, [isValid, setStepValidation]);

  // Créer les colonnes pour le DataTable (sans actions)
  const columns = useMemo(
    () =>
      createSaleProductColumns({
        t,
        showActions: false,
        producerOptions,
      }),
    [t, producerOptions]
  );

  const handleSubmit = useCallback(async () => {
    if (!isConfirmed || isNavigating || isSubmitting) return;

    // Vérifier les données requises
    if (
      !formData.step1.sellerId ||
      !formData.step1.buyerId ||
      !formData.step1.locationType ||
      !formData.step1.transactionDate
    ) {
      showError(t("transaction:errors.missingRequiredData"));
      return;
    }

    if (formData.step2.products.length === 0) {
      showError(t("transaction:saleAdd.validation.atLeastOneProduct"));
      return;
    }

    setIsSubmitting(true);
    setIsNavigating(true);
    showInfo(t("common:messages.processing"));

    try {
      // Convertir les documents en base64
      const documentsForAPI = await Promise.all(
        formData.step3.saleContractDocuments.map(async (doc) => {
          const base64Data =
            doc.data instanceof Blob ? await blobToBase64(doc.data) : doc.data;

          return {
            base64Data: base64Data as string,
            mimeType: doc.type,
            fileName: doc.name || "document.pdf",
            documentType: doc.optionValues[1] as string,
          };
        })
      );

      // Si en mode editOffline, on met à jour l'opération pendante existante
      if (editOffline && entityId) {
        const updateUseCase =
          TransactionServiceProvider.getUpdateTransactionUseCase();

        const updateData = {
          transactionType: "SALE" as const,
          locationType: formData.step1.locationType,
          sellerId: formData.step1.sellerId,
          buyerId: formData.step1.buyerId,
          principalExporterId: formData.step1.principalExporterId,
          calendarId: formData.step1.calendarId,
          conventionId: formData.step1.conventionId,
          transactionDate: formData.step1.transactionDate,
          notes: formData.step4.notes,
          products: formData.step2.products.map((product) => ({
            id: product.id,
            quality: product.quality,
            standard: product.standard,
            weight: product.weight,
            bagCount: product.bagCount,
            pricePerKg: product.pricePerKg,
            totalPrice: product.totalPrice,
            humidity: product.humidity,
            producerId: product.producerId,
            notes: product.notes,
          })),
          documents: documentsForAPI,
        };

        await updateUseCase.execute(entityId, updateData as never, true);
      } else {
        // Mode création normale
        // Note: campaignId n'est pas envoyé car il est déduit côté backend
        const createUseCase =
          TransactionServiceProvider.getCreateTransactionUseCase();

        const createData = {
          code: "", // Sera généré par le backend
          transactionType: "SALE" as const,
          locationType: formData.step1.locationType,
          status: "pending" as const,
          sellerId: formData.step1.sellerId,
          buyerId: formData.step1.buyerId,
          principalExporterId: formData.step1.principalExporterId,
          createdByActorId: null,
          campaignId: "", // Sera déduit par le backend
          calendarId: formData.step1.calendarId,
          conventionId: formData.step1.conventionId,
          transactionDate: formData.step1.transactionDate,
          notes: formData.step4.notes,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          products: formData.step2.products.map((product) => ({
            id: product.id,
            quality: product.quality,
            standard: product.standard,
            weight: product.weight,
            bagCount: product.bagCount,
            pricePerKg: product.pricePerKg,
            totalPrice: product.totalPrice,
            humidity: product.humidity,
            producerId: product.producerId,
            notes: product.notes,
          })),
          // Relations fictives (seront remplacées par le backend)
          seller: {} as never,
          buyer: {} as never,
          campaign: {} as never,
          syncStatus: SyncStatus.PENDING_CREATION,
          documents: documentsForAPI,
        };

        await createUseCase.execute(createData as never, isOnline);
      }

      // Réinitialiser le formulaire après succès
      resetForm();

      // Utiliser handleFinish pour la redirection
      handleFinish(editOffline);
    } catch (error) {
      showError(
        error instanceof Error
          ? error.message
          : t("transaction:errors.creationFailed")
      );
      setIsNavigating(false);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    isConfirmed,
    isNavigating,
    isSubmitting,
    formData,
    editOffline,
    entityId,
    isOnline,
    resetForm,
    handleFinish,
    t,
  ]);

  // Calculer les totaux
  const totalGeneral = formData.step2.products.reduce(
    (sum, product) => sum + (product.totalPrice || 0),
    0
  );

  const totalWeight = formData.step2.products.reduce(
    (sum, product) => sum + (product.weight || 0),
    0
  );

  // Boutons du footer
  const footerButtons = [
    <Button
      key="submit"
      type="button"
      onClick={handleSubmit}
      disabled={!isConfirmed || isNavigating || isSubmitting}
    >
      {isSubmitting
        ? t("common:messages.processing")
        : t("transaction:saleAdd.buttons.save")}
    </Button>,
  ];

  // Header content
  const headerContent = (
    <div className="flex items-center space-x-3">
      <h1 className="text-xl font-medium text-gray-900">
        {t("transaction:saleAdd.steps.summary")}
      </h1>
    </div>
  );

  return (
    <SaleFormLayout>
      <BaseCard
        title={headerContent}
        footer={footerButtons}
        className="w-full !max-w-4xl mx-auto"
        classNameFooter="!justify-between"
      >
        <Form {...form}>
          {/* Informations générales */}
          <div className="space-y-4">
            <DetailRow
              label={t("transaction:saleAdd.fields.locationType")}
              value={
                formData.step1.locationType
                  ? t(
                      `transaction:locationTypes.${formData.step1.locationType}`
                    )
                  : "---"
              }
              showChangeButton={true}
              changeHref="/transactions/sale/create/general-info"
            />

            <DetailRow
              label={t("transaction:saleAdd.fields.seller")}
              value={
                isLoadingData
                  ? t("common:messages.loading")
                  : sellerName || formData.step1.sellerId || "---"
              }
              showChangeButton={true}
              changeHref="/transactions/sale/create/general-info"
            />

            <DetailRow
              label={t("transaction:saleAdd.fields.buyer")}
              value={
                isLoadingData
                  ? t("common:messages.loading")
                  : buyerName || formData.step1.buyerId || "---"
              }
              showChangeButton={true}
              changeHref="/transactions/sale/create/general-info"
            />

            {formData.step1.principalExporterId && (
              <DetailRow
                label={t("transaction:saleAdd.fields.principalExporter")}
                value={
                  isLoadingData
                    ? t("common:messages.loading")
                    : exporterName || formData.step1.principalExporterId
                }
                showChangeButton={true}
                changeHref="/transactions/sale/create/general-info"
              />
            )}

            {(formData.step1.locationType === "MARKET" ||
              formData.step1.locationType === "CONVENTION") &&
              formData.step1.calendarId && (
                <DetailRow
                  label={t("transaction:saleAdd.fields.calendar")}
                  value={
                    isLoadingData
                      ? t("common:messages.loading")
                      : calendarInfo || formData.step1.calendarId
                  }
                  showChangeButton={true}
                  changeHref="/transactions/sale/create/general-info"
                />
              )}

            {formData.step1.locationType === "CONVENTION" &&
              formData.step1.conventionId && (
                <DetailRow
                  label={t("transaction:saleAdd.fields.convention")}
                  value={
                    isLoadingData
                      ? t("common:messages.loading")
                      : conventionCode || formData.step1.conventionId
                  }
                  showChangeButton={true}
                  changeHref="/transactions/sale/create/general-info"
                />
              )}

            <DetailRow
              label={t("transaction:saleAdd.fields.transactionDate")}
              value={
                formData.step1.transactionDate
                  ? dayjs(formData.step1.transactionDate).format("LL")
                  : "---"
              }
              showChangeButton={true}
              changeHref="/transactions/sale/create/general-info"
              noBorder={true}
            />
          </div>

          {/* Section Produits */}
          <div>
            <Separator className="my-6" />
            <div className="flex items-center justify-between mb-4">
              <Heading as="h3" size="body">
                {t("transaction:saleAdd.steps.products")} (
                {formData.step2.products.length})
              </Heading>
              <Link
                href="/transactions/sale/create/products"
                className="text-blue-600 hover:text-blue-700 p-0 h-auto font-normal text-sm"
              >
                {t("common:actions.edit")}
              </Link>
            </div>
            {formData.step2.products.length > 0 ? (
              <>
                <DataTable
                  columns={
                    columns as unknown as ColumnDef<
                      (typeof formData.step2.products)[0]
                    >[]
                  }
                  data={formData.step2.products}
                  isMobile={isMobile}
                  pageSize={10}
                  emptyMessage={t(
                    "transaction:saleAdd.validation.atLeastOneProduct"
                  )}
                />

                {/* Totaux */}
                <div className="rounded-lg bg-gray-50 p-4 space-y-2 mt-4">
                  <DetailRow
                    label={t("transaction:saleAdd.summary.totalWeight")}
                    value={`${totalWeight} kg`}
                  />
                  <DetailRow
                    label={t("transaction:saleAdd.summary.totalPrice")}
                    value={`${totalGeneral.toLocaleString()} FCFA`}
                    noBorder={true}
                  />
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-500">
                {t("transaction:saleAdd.validation.atLeastOneProduct")}
              </p>
            )}
          </div>

          {/* Documents */}
          <div>
            <Separator className="my-6" />
            <div className="flex items-center justify-between mb-4">
              <Heading as="h3" size="body">
                {t("transaction:saleAdd.steps.documents")}
              </Heading>
              <Link
                href="/transactions/sale/create/documents"
                className="text-blue-600 hover:text-blue-700 p-0 h-auto font-normal text-sm"
              >
                {t("common:actions.edit")}
              </Link>
            </div>
            {formData.step3.saleContractDocuments &&
            formData.step3.saleContractDocuments.length > 0 ? (
              <div className="space-y-2">
                {formData.step3.saleContractDocuments.map((doc, index) => (
                  <DocumentPreview key={index} document={doc as never} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                {t("transaction:saleAdd.validation.saleContractRequired")}
              </p>
            )}
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
                {t("transaction:saleAdd.summary.confirmInformation")}
              </label>
            </div>

            {!isConfirmed && (
              <p className="text-sm text-red-600 mt-2">
                {t("transaction:saleAdd.validation.confirmationRequired")}
              </p>
            )}
          </div>
        </Form>
      </BaseCard>
    </SaleFormLayout>
  );
}
