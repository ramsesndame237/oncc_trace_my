"use client";

import { FormInput } from "@/components/forms";
import FormSelect from "@/components/forms/form-select";
import { Icon } from "@/components/icon";
import { BaseCard } from "@/components/modules/base-card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Form } from "@/components/ui/form";
import { db } from "@/core/infrastructure/database/db";
import type {
  ConventionProduct,
  ProductQuality,
  ProductStandard,
} from "@/features/convention/domain/types";
import { useConventionStore } from "@/features/convention/infrastructure/store/conventionStore";
import { useConventionOptions } from "@/features/convention/presentation/hooks";
import {
  createProductSchema,
  type ProductData,
  type ProductFormInput,
} from "@/features/convention/presentation/schemas/convention-validation-schemas";
import { useIsMobile } from "@/hooks/use-mobile";
import { zodResolver } from "@hookform/resolvers/zod";
import { ColumnDef } from "@tanstack/react-table";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { createProductColumns } from "./Columns";
import { ConventionFormLayout } from "./ConventionFormLayout";
import { useGetConventionById } from "../hooks/useGetConventionById";

export function ConventionEditProducts() {
  const { t } = useTranslation(["convention", "common"]);
  const isMobile = useIsMobile();
  const router = useRouter();
  const searchParams = useSearchParams();
  const conventionId = searchParams.get("entityId");
  const editOffline = searchParams.has("editOffline");

  const { updateConvention } = useConventionStore();
  const { convention } = useGetConventionById(conventionId || "");

  const [products, setProducts] = useState<ConventionProduct[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Options depuis le hook centralisé
  const { qualityOptions, standardOptions } = useConventionOptions();

  // Construire le titre de la convention
  const conventionTitle = convention
    ? `Convention - ${convention.buyerExporter?.familyName || ""} ${convention.buyerExporter?.givenName || ""} / ${convention.producers?.familyName || ""} ${convention.producers?.givenName || ""}`
    : t("form.title");

  // Form setup pour ajouter UN produit
  const form = useForm<ProductFormInput>({
    resolver: zodResolver(createProductSchema(t)),
    defaultValues: {
      quality: "",
      standard: "",
      weight: "" as unknown as number,
      bags: "" as unknown as number,
      pricePerKg: "" as unknown as number,
      humidity: "" as unknown as number,
    },
    mode: "onChange",
    criteriaMode: "firstError",
    shouldFocusError: true,
  });

  const { isValid } = form.formState;

  // Charger les produits existants
  useEffect(() => {
    const loadProducts = async () => {
      if (!conventionId) return;

      try {
        if (editOffline) {
          // Charger depuis pendingOperations
          const pendingOperation = await db.pendingOperations
            .where("entityId")
            .equals(conventionId)
            .first();

          if (pendingOperation && pendingOperation.payload) {
            const payload = pendingOperation.payload as Record<string, unknown>;
            if (payload.products && Array.isArray(payload.products)) {
              setProducts(payload.products as ConventionProduct[]);
            }
          }
        } else {
          // Charger depuis l'API via convention
          if (convention?.products) {
            setProducts(convention.products);
          }
        }
      } catch {
        toast.error(t("messages.loadError"));
      }
    };

    loadProducts();
  }, [conventionId, editOffline, convention, t]);

  const handleAddProduct: SubmitHandler<ProductData> = useCallback(
    async (data) => {
      const isFormValid = await form.trigger();
      if (isFormValid) {
        // Vérifier si un produit avec les mêmes caractéristiques existe déjà
        const existingProductIndex = products.findIndex(
          (p) =>
            p.quality === data.quality &&
            p.standard === data.standard &&
            p.pricePerKg === data.pricePerKg &&
            p.humidity === data.humidity
        );

        if (existingProductIndex !== -1) {
          // Produit existant trouvé - Cumuler weight et bags
          const updatedProducts = [...products];
          updatedProducts[existingProductIndex] = {
            ...updatedProducts[existingProductIndex],
            weight: updatedProducts[existingProductIndex].weight + data.weight,
            bags: updatedProducts[existingProductIndex].bags + data.bags,
          };
          setProducts(updatedProducts);
        } else {
          // Nouveau produit - Ajouter normalement
          setProducts([
            ...products,
            {
              quality: data.quality as ProductQuality,
              standard: data.standard as ProductStandard,
              weight: data.weight,
              bags: data.bags,
              pricePerKg: data.pricePerKg,
              humidity: data.humidity,
            },
          ]);
        }

        // Réinitialiser le formulaire
        form.reset({
          quality: "",
          standard: "",
          weight: "" as unknown as number,
          bags: "" as unknown as number,
          pricePerKg: "" as unknown as number,
          humidity: "" as unknown as number,
        });
      }
    },
    [form, products]
  );

  const handleRemoveProduct = useCallback(
    (index: number) => {
      const updatedProducts = products.filter((_, i) => i !== index);
      setProducts(updatedProducts);
    },
    [products]
  );

  const handleSubmit = useCallback(async () => {
    if (products.length === 0) {
      toast.error(t("form.step2.validation.atLeastOneProduct"));
      return;
    }

    if (!conventionId) {
      toast.error(t("view.invalidId"));
      return;
    }

    setIsSubmitting(true);
    try {
      await updateConvention(
        conventionId,
        { products },
        editOffline
      );

      // Redirection selon le mode
      if (editOffline) {
        router.push("/outbox");
      } else {
        router.push(`/conventions/view?entityId=${conventionId}`);
      }
    } catch {
      toast.error(t("convention:messages.updateError"));
    } finally {
      setIsSubmitting(false);
    }
  }, [conventionId, products, router, updateConvention, editOffline, t]);

  const handleCancel = useCallback(() => {
    if (!conventionId) return;
    if (editOffline) {
      router.push("/outbox");
    } else {
      router.push(`/conventions/view?entityId=${conventionId}`);
    }
  }, [conventionId, router, editOffline]);

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

  // Vérifier si le bouton enregistrer doit être activé
  const isSaveButtonEnabled = products.length > 0 && !isSubmitting;

  // Footer buttons
  const footerButtons = [
    <Button
      key="save"
      type="button"
      onClick={handleSubmit}
      disabled={!isSaveButtonEnabled}
      className="flex items-center space-x-2"
    >
      {isSubmitting ? (
        <>
          <Icon name="Loader2" className="animate-spin" />
          <span>{t("common:messages.saving")}</span>
        </>
      ) : (
        <span>{t("common:actions.save")}</span>
      )}
    </Button>,
  ];

  // Header content
  const headerContent = (
    <div className="flex items-center space-x-3">
      <h1 className="text-xl font-medium text-gray-900">
        {t("convention:form.step2.cardTitle")}
      </h1>
    </div>
  );

  if (!conventionId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">{t("view.invalidId")}</p>
      </div>
    );
  }

  return (
    <ConventionFormLayout
      className="lg:flex items-start lg:space-x-4"
      title={conventionTitle}
      onHandleCancel={handleCancel}
    >
      {/* Bouton Retour AVANT le BaseCard */}
      <div className="py-3">
        <Button variant="link" onClick={handleCancel}>
          <Icon name="ArrowLeft" />
          <span>{t("common:actions.back")}</span>
        </Button>
      </div>

      <BaseCard
        title={headerContent}
        footer={footerButtons}
        className="w-full"
        classNameFooter="!justify-between"
      >
        <div className="space-y-6">
          {/* Formulaire d'ajout de produit */}
          <div className="space-y-4 rounded-lg border-2 border-dashed border-gray-300 p-4">
            <h3 className="font-semibold">
              {t("convention:form.step2.addProductTitle")}
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
                    label={t("convention:form.step2.quality")}
                    placeholder=""
                    options={qualityOptions}
                    required
                  />

                  {/* Standard */}
                  <FormSelect
                    form={form}
                    name="standard"
                    label={t("convention:form.step2.standard")}
                    placeholder=""
                    options={standardOptions}
                    required
                  />

                  {/* Poids */}
                  <FormInput
                    form={form}
                    name="weight"
                    label={t("convention:form.step2.weight")}
                    type="number"
                    required
                    unit="Kg"
                    showUnit={true}
                  />

                  {/* Nombre de sacs */}
                  <FormInput
                    form={form}
                    name="bags"
                    label={t("convention:form.step2.bags")}
                    type="number"
                    required
                  />

                  {/* Taux d'humidité */}
                  <FormInput
                    form={form}
                    name="humidity"
                    label={t("convention:form.step2.humidity")}
                    type="number"
                    required
                    unit="%"
                    showUnit={true}
                  />

                  {/* Prix par kg */}
                  <FormInput
                    form={form}
                    name="pricePerKg"
                    label={t("convention:form.step2.pricePerKg")}
                    type="number"
                    required
                    unit="XAF"
                    showUnit={true}
                  />
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={!isValid}>
                    <Icon name="Plus" className="mr-2 h-4 w-4" />
                    {t("convention:form.step2.addButton")}
                  </Button>
                </div>
              </form>
            </Form>
          </div>

          {/* Tableau des produits ajoutés */}
          {products.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold">
                {t("convention:form.step2.productList")}
              </h3>
              <DataTable
                columns={
                  columns as unknown as ColumnDef<(typeof products)[0]>[]
                }
                data={products}
                isMobile={isMobile}
                pageSize={10}
                emptyMessage={t(
                  "convention:form.step2.validation.atLeastOneProduct"
                )}
              />
            </div>
          )}
        </div>
      </BaseCard>
    </ConventionFormLayout>
  );
}
