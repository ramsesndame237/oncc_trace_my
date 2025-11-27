"use client";

import {
  FormInput,
  FormSelect,
} from "@/components/forms";
import { Icon } from "@/components/icon";
import { BaseCard } from "@/components/modules/base-card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Form } from "@/components/ui/form";
import {
  PRODUCT_QUALITIES_CONSTANTS,
  PRODUCT_STANDARDS_CONSTANTS,
} from "@/core/domain/generated/cacao-types.types";
import { db } from "@/core/infrastructure/database/db";
import { useIsMobile } from "@/hooks/use-mobile";
import { zodResolver } from "@hookform/resolvers/zod";
import { ColumnDef } from "@tanstack/react-table";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
  usePurchaseAddFormStore,
} from "../../../../infrastructure/store/purchaseAddFormStore";
import { TransactionProductForm } from "../../../../infrastructure/store/saleAddFormStore";
import { usePurchaseAddFormNavigation } from "../../../hooks/usePurchaseAddFormNavigation";
import {
  createPurchaseSingleProductSchema,
  type PurchaseSingleProductData,
} from "../../../schemas/purchase-validation-schemas";
import { createPurchaseProductColumns } from "../../Columns";
import { PurchaseFormLayout } from "../PurchaseFormLayout";

export function PurchaseAddStep2() {
  const { t } = useTranslation(["transaction", "common"]);
  const searchParams = useSearchParams();
  const router = useRouter();
  const isMobile = useIsMobile();

  const {
    formData,
    addProduct,
    removeProduct,
    setProducts,
    setStepValidation,
    setCurrentStep,
    saveProgress,
    resetForm,
    entityId: storeEntityId,
    editOffline: storeEditOffline,
  } = usePurchaseAddFormStore();

  const { navigateToNext, navigateToPrevious } = usePurchaseAddFormNavigation();
  const [isNavigating, setIsNavigating] = useState(false);

  React.useEffect(() => {
    setIsNavigating(false);
  }, []);

  const entityIdFromParams = searchParams.get("entityId");
  const entityId = entityIdFromParams || storeEntityId;
  const editOffline = storeEditOffline;
  const returnTo = searchParams.get("returnTo");
  const directEntry = searchParams.get("directEntry") === "true";

  const products = formData.step2.products;

  const qualityOptions = useMemo(
    () => [
      {
        value: PRODUCT_QUALITIES_CONSTANTS.GRADE_1,
        label: t("transaction:purchaseAdd.qualityOptions.grade1"),
      },
      {
        value: PRODUCT_QUALITIES_CONSTANTS.GRADE_2,
        label: t("transaction:purchaseAdd.qualityOptions.grade2"),
      },
      {
        value: PRODUCT_QUALITIES_CONSTANTS.HS,
        label: t("transaction:purchaseAdd.qualityOptions.hs"),
      },
    ],
    [t]
  );

  const standardOptions = useMemo(() => {
    if (formData.step1.locationType === "MARKET") {
      return [
        {
          value: PRODUCT_STANDARDS_CONSTANTS.CONVENTIONNEL,
          label: t("transaction:purchaseAdd.standardOptions.conventionnel"),
        },
      ];
    }

    return [
      {
        value: PRODUCT_STANDARDS_CONSTANTS.CERTIFIE,
        label: t("transaction:purchaseAdd.standardOptions.certifie"),
      },
      {
        value: PRODUCT_STANDARDS_CONSTANTS.EXCELLENT,
        label: t("transaction:purchaseAdd.standardOptions.excellent"),
      },
      {
        value: PRODUCT_STANDARDS_CONSTANTS.FIN,
        label: t("transaction:purchaseAdd.standardOptions.fin"),
      },
      {
        value: PRODUCT_STANDARDS_CONSTANTS.CONVENTIONNEL,
        label: t("transaction:purchaseAdd.standardOptions.conventionnel"),
      },
    ];
  }, [t, formData.step1.locationType]);

  // Form setup pour ajouter UN produit (SANS producteur pour les achats)
  const form = useForm<PurchaseSingleProductData>({
    resolver: zodResolver(createPurchaseSingleProductSchema(t)),
    defaultValues: {
      quality: "",
      standard: "",
      weight: "" as unknown as number,
      bagCount: "" as unknown as number,
      pricePerKg: "" as unknown as number,
      humidity: "" as unknown as number,
    },
    mode: "onChange",
    criteriaMode: "firstError",
    shouldFocusError: true,
  });

  const { isValid } = form.formState;

  const watchedWeight = form.watch("weight");
  const watchedPricePerKg = form.watch("pricePerKg");

  const calculatedTotalPrice = useMemo(() => {
    const weight = Number(watchedWeight) || 0;
    const pricePerKg = Number(watchedPricePerKg) || 0;
    return weight * pricePerKg;
  }, [watchedWeight, watchedPricePerKg]);

  React.useEffect(() => {
    setCurrentStep(2);
  }, [setCurrentStep]);

  // Charger les données offline si en mode editOffline
  useEffect(() => {
    const loadOfflineData = async () => {
      if (!entityId || !editOffline) return;

      try {
        const pendingOperation = await db.pendingOperations
          .where("entityId")
          .equals(entityId)
          .first();

        if (pendingOperation && pendingOperation.payload) {
          const payload = pendingOperation.payload as Record<string, unknown>;

          if (payload.products && Array.isArray(payload.products)) {
            const existingProducts =
              payload.products as TransactionProductForm[];
            setProducts(existingProducts);
          }
        }
      } catch {
        // Silently fail
      }
    };

    loadOfflineData();
  }, [entityId, editOffline, setProducts]);

  // Observer la validation (étape 2 est valide si au moins 1 produit)
  useEffect(() => {
    setStepValidation("step2", products.length > 0);
  }, [products.length, setStepValidation]);

  const handleAddProduct: SubmitHandler<PurchaseSingleProductData> = useCallback(
    async (data) => {
      const isFormValid = await form.trigger();
      if (isFormValid) {
        const newProduct: TransactionProductForm = {
          id: crypto.randomUUID(),
          quality: data.quality,
          standard: data.standard,
          weight: Number(data.weight),
          bagCount: Number(data.bagCount),
          pricePerKg: Number(data.pricePerKg),
          totalPrice: Number(data.weight) * Number(data.pricePerKg),
          humidity: data.humidity ? Number(data.humidity) : null,
          producerId: null, // Pas de producteur pour les achats
          notes: null,
        };

        addProduct(newProduct);
        saveProgress();

        form.reset({
          quality: "",
          standard: "",
          weight: "" as unknown as number,
          bagCount: "" as unknown as number,
          pricePerKg: "" as unknown as number,
          humidity: "" as unknown as number,
        });
      }
    },
    [form, addProduct, saveProgress]
  );

  const handleRemoveProduct = useCallback(
    (index: number) => {
      removeProduct(index);
      saveProgress();
    },
    [removeProduct, saveProgress]
  );

  const handleNext = useCallback(async () => {
    if (products.length === 0) {
      alert(t("transaction:purchaseAdd.validation.atLeastOneProduct"));
      return;
    }

    if (!isNavigating) {
      setIsNavigating(true);
      navigateToNext(2, editOffline, entityId || undefined, returnTo || undefined);
    }
  }, [products.length, navigateToNext, isNavigating, t, editOffline, entityId, returnTo]);

  const handleBack = useCallback(() => {
    // Si directEntry et returnTo sont définis, retourner directement vers returnTo
    if (directEntry && returnTo) {
      resetForm();
      router.replace(returnTo);
    } else {
      navigateToPrevious(editOffline, entityId || undefined, returnTo || undefined);
    }
  }, [navigateToPrevious, editOffline, entityId, returnTo, directEntry, resetForm, router]);

  // Créer les colonnes pour le DataTable (SANS producteur)
  const columns = useMemo(
    () =>
      createPurchaseProductColumns({
        t,
        onDelete: handleRemoveProduct,
        showActions: true,
      }),
    [t, handleRemoveProduct]
  );

  const footerButtons = (
    <div className="flex gap-2 justify-end">
      <Button
        onClick={handleNext}
        disabled={products.length === 0 || isNavigating}
      >
        {t("common:actions.next")}
      </Button>
    </div>
  );

  const headerContent = (
    <div className="flex items-center space-x-3">
      <h1 className="text-xl font-medium text-gray-900">
        {t("transaction:purchaseAdd.steps.products")}
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
          <div className="space-y-6">
            {/* Formulaire d'ajout de produit (SANS producteur) */}
            <div className="space-y-4 rounded-lg border-2 border-dashed border-gray-300 p-4">
              <h3 className="font-semibold">
                {t("transaction:purchaseAdd.fields.addProductTitle")}
              </h3>

              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(handleAddProduct)}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Qualité */}
                    <FormSelect
                      form={form}
                      name="quality"
                      label={t("transaction:purchaseAdd.fields.quality")}
                      placeholder=""
                      options={qualityOptions}
                      required
                    />

                    {/* Standard */}
                    <FormSelect
                      form={form}
                      name="standard"
                      label={t("transaction:purchaseAdd.fields.standard")}
                      placeholder=""
                      options={standardOptions}
                      required
                    />

                    {/* Poids */}
                    <FormInput
                      form={form}
                      name="weight"
                      label={t("transaction:purchaseAdd.fields.weight")}
                      type="number"
                      required
                      unit="kg"
                      showUnit={true}
                      placeholder=""
                    />

                    {/* Nombre de sacs */}
                    <FormInput
                      form={form}
                      name="bagCount"
                      label={t("transaction:purchaseAdd.fields.bagCount")}
                      type="number"
                      required
                      placeholder=""
                    />

                    {/* Prix par kg */}
                    <FormInput
                      form={form}
                      name="pricePerKg"
                      label={t("transaction:purchaseAdd.fields.pricePerKg")}
                      type="number"
                      required
                      unit="FCFA"
                      showUnit={true}
                      placeholder=""
                    />

                    {/* Prix total (calculé) */}
                    <div className="lg:w-full">
                      <label className="block text-base font-medium text-gray-700 mb-2">
                        {t("transaction:purchaseAdd.fields.totalPrice")}
                      </label>
                      <div className="flex items-center h-12 px-3 rounded-md border border-gray-300 bg-gray-50">
                        <span className="text-gray-900 font-medium">
                          {calculatedTotalPrice.toLocaleString()} FCFA
                        </span>
                      </div>
                    </div>

                    {/* Humidité */}
                    <FormInput
                      form={form}
                      name="humidity"
                      label={t("transaction:purchaseAdd.fields.humidity")}
                      type="number"
                      unit="%"
                      showUnit={true}
                      placeholder=""
                    />

                    {/* PAS DE CHAMP PRODUCTEUR POUR LES ACHATS */}
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={!isValid}>
                      <Icon name="Plus" className="mr-2 h-4 w-4" />
                      {t("transaction:purchaseAdd.fields.addProduct")}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>

            {/* Tableau des produits ajoutés */}
            {products.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold">
                  {t("transaction:purchaseAdd.fields.productList")} (
                  {products.length})
                </h3>
                <DataTable
                  columns={
                    columns as unknown as ColumnDef<(typeof products)[0]>[]
                  }
                  data={products}
                  isMobile={isMobile}
                  pageSize={10}
                  emptyMessage={t(
                    "transaction:purchaseAdd.validation.atLeastOneProduct"
                  )}
                />
              </div>
            )}
          </div>
        </BaseCard>
      </div>
    </PurchaseFormLayout>
  );
}
