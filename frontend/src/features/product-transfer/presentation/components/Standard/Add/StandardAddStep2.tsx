"use client";

import { FormInput } from "@/components/forms";
import FormSelect from "@/components/forms/form-select";
import { Icon } from "@/components/icon";
import { BaseCard } from "@/components/modules/base-card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Form } from "@/components/ui/form";
import { db } from "@/core/infrastructure/database/db";
import type { ProductItem } from "@/features/product-transfer/domain";
import { useStandardAddFormStore } from "@/features/product-transfer/infrastructure/store/standardAddFormStore";
import {
  useStandardAddFormNavigation,
  useProductTransferOptions,
} from "@/features/product-transfer/presentation/hooks";
import {
  productSchema,
  type ProductData,
} from "@/features/product-transfer/presentation/schemas/standard-validation-schemas";
import { useIsMobile } from "@/hooks/use-mobile";
import { zodResolver } from "@hookform/resolvers/zod";
import { ColumnDef } from "@tanstack/react-table";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { createProductColumns } from "../../Columns";
import { StandardFormLayout } from "./StandardFormLayout";

export function StandardAddStep2() {
  const { t } = useTranslation(["productTransfer", "common"]);
  const isMobile = useIsMobile();
  const { qualityOptions } = useProductTransferOptions();

  const {
    formData,
    addProduct,
    removeProduct,
    setCurrentStep,
    setStepValidation,
    saveProgress,
    entityId,
    editOffline,
    setProducts,
  } = useStandardAddFormStore();

  const { navigateToNext, navigateToPrevious } = useStandardAddFormNavigation();
  const [isNavigating, setIsNavigating] = useState(false);

  // Réinitialiser isNavigating quand le composant est monté (après PinGuard par exemple)
  useEffect(() => {
    setIsNavigating(false);
  }, []);

  const products = formData.step2.products;

  // Form setup pour ajouter UN produit
  const form = useForm<ProductData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      quality: "",
      weight: "" as unknown as number,
      numberOfBags: "" as unknown as number,
    },
    mode: "onChange",
    criteriaMode: "firstError",
    shouldFocusError: true,
  });

  const { isValid } = form.formState;

  // Initialiser l'étape courante
  useEffect(() => {
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

          // Charger les produits
          if (payload.products && Array.isArray(payload.products)) {
            const loadedProducts = payload.products as ProductItem[];
            setProducts(loadedProducts);
          }
        }
      } catch {
        // Silently fail - offline data loading is not critical
      }
    };

    loadOfflineData();
  }, [entityId, editOffline, setProducts]);

  // Observer la validation (étape 2 est valide si au moins 1 produit)
  useEffect(() => {
    setStepValidation("step2", products.length > 0);
  }, [products.length, setStepValidation]);

  const handleAddProduct: SubmitHandler<ProductData> = useCallback(
    async (data) => {
      const isFormValid = await form.trigger();
      if (isFormValid) {
        // Vérifier si un produit avec la même qualité existe déjà
        const existingProductIndex = products.findIndex(
          (p) => p.quality === data.quality
        );

        if (existingProductIndex !== -1) {
          // Produit existant trouvé - Cumuler weight et numberOfBags
          const existingProduct = products[existingProductIndex];

          const updatedProducts: ProductItem[] = products.map((p, index) =>
            index === existingProductIndex
              ? {
                  quality: existingProduct.quality,
                  weight: Number(existingProduct.weight) + Number(data.weight),
                  numberOfBags:
                    Number(existingProduct.numberOfBags) +
                    Number(data.numberOfBags),
                }
              : {
                  quality: p.quality,
                  weight: Number(p.weight),
                  numberOfBags: Number(p.numberOfBags),
                }
          );

          // Mettre à jour le store avec la liste mise à jour
          setProducts(updatedProducts);
        } else {
          // Nouveau produit - Ajouter normalement
          addProduct({
            quality: data.quality,
            weight: Number(data.weight),
            numberOfBags: Number(data.numberOfBags),
          });
        }

        // Sauvegarder la progression
        saveProgress();

        // Réinitialiser le formulaire
        form.reset({
          quality: "",
          weight: "" as unknown as number,
          numberOfBags: "" as unknown as number,
        });
      }
    },
    [form, addProduct, saveProgress, products, setProducts]
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
      alert(t("productTransfer:form.step2.validation.atLeastOneProduct"));
      return;
    }

    if (!isNavigating) {
      setIsNavigating(true);
      navigateToNext();
    }
  }, [products.length, navigateToNext, isNavigating, t]);

  const handleBack = useCallback(() => {
    navigateToPrevious();
  }, [navigateToPrevious]);

  // Créer les colonnes pour le DataTable
  const columns = useMemo(
    () =>
      createProductColumns({
        t,
        onDelete: handleRemoveProduct,
        showActions: true,
      }),
    [t, handleRemoveProduct]
  );

  // Footer buttons
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

  // Header content
  const headerContent = (
    <div className="flex items-center space-x-3">
      <h1 className="text-xl font-medium text-gray-900">
        {t("productTransfer:form.step2.cardTitle")}
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
          <div className="space-y-6">
            {/* Formulaire d'ajout de produit */}
            <div className="space-y-4 rounded-lg border-2 border-dashed border-gray-300 p-4">
              <h3 className="font-semibold">
                {t("productTransfer:form.step2.addProductTitle")}
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
                      label={t("productTransfer:form.step2.quality")}
                      placeholder=""
                      options={qualityOptions}
                      required
                    />

                    {/* Poids */}
                    <FormInput
                      form={form}
                      name="weight"
                      label={t("productTransfer:form.step2.weight")}
                      type="number"
                      required
                      unit="kg"
                      showUnit={true}
                      placeholder=""
                    />

                    {/* Nombre de sacs */}
                    <FormInput
                      form={form}
                      name="numberOfBags"
                      label={t("productTransfer:form.step2.numberOfBags")}
                      type="number"
                      required
                      placeholder=""
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={!isValid}>
                      <Icon name="Plus" className="mr-2 h-4 w-4" />
                      {t("productTransfer:form.step2.addButton")}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>

            {/* Tableau des produits ajoutés */}
            {products.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold">
                  {t("productTransfer:form.step2.productList")}
                </h3>
                <DataTable
                  columns={
                    columns as unknown as ColumnDef<(typeof products)[0]>[]
                  }
                  data={products}
                  isMobile={isMobile}
                  pageSize={10}
                  emptyMessage={t(
                    "productTransfer:form.step2.validation.atLeastOneProduct"
                  )}
                />
              </div>
            )}
          </div>
        </BaseCard>
      </div>
    </StandardFormLayout>
  );
}
