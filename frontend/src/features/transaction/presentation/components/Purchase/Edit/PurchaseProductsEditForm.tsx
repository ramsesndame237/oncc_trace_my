"use client";

import {
  FormInput,
  FormSelect,
} from "@/components/forms";
import { Icon } from "@/components/icon";
import { BaseCard } from "@/components/modules/base-card";
import { LoadingFallback } from "@/components/modules/loading-fallback";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Form } from "@/components/ui/form";
import {
  PRODUCT_QUALITIES_CONSTANTS,
  PRODUCT_STANDARDS_CONSTANTS,
} from "@/core/domain/generated/cacao-types.types";
import { ensureDIConfigured } from "@/core/infrastructure/di/container";
import { useIsMobile } from "@/hooks/use-mobile";
import { zodResolver } from "@hookform/resolvers/zod";
import { ColumnDef } from "@tanstack/react-table";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { container } from "tsyringe";
import { TransactionProductForm } from "../../../../infrastructure/store/saleAddFormStore";
import { useGetTransactionById } from "../../../hooks/useGetTransactionById";
import {
  createPurchaseSingleProductSchema,
  type PurchaseSingleProductData,
} from "../../../schemas/purchase-validation-schemas";
import { createPurchaseProductColumns } from "../../Columns";
import { PurchaseFormLayout } from "../PurchaseFormLayout";
import { UpdateTransactionProductsUseCase } from "../../../../application/useCases/UpdateTransactionProductsUseCase";

export function PurchaseProductsEditForm() {
  const { t } = useTranslation(["transaction", "common"]);
  const searchParams = useSearchParams();
  const router = useRouter();
  const isMobile = useIsMobile();

  const entityId = searchParams.get("entityId");

  const { transaction, isLoading, error } = useGetTransactionById(
    entityId || "",
    true
  );

  // Local state for products (NO Zustand store)
  const [products, setProducts] = useState<TransactionProductForm[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize products from transaction
  useEffect(() => {
    if (transaction && transaction.products) {
      const initialProducts: TransactionProductForm[] = transaction.products.map(
        (product) => ({
          id: product.id || crypto.randomUUID(),
          quality: product.quality,
          standard: product.standard,
          weight: Number(product.weight),
          bagCount: Number(product.bagCount),
          pricePerKg: Number(product.pricePerKg),
          totalPrice: Number(product.totalPrice),
          humidity: product.humidity ? Number(product.humidity) : null,
          producerId: product.producerId || null,
          notes: product.notes || null,
        })
      );
      setProducts(initialProducts);
    }
  }, [transaction]);

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
    if (transaction?.locationType === "MARKET") {
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
  }, [t, transaction?.locationType]);

  // Form setup for adding a single product
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
          producerId: null,
          notes: null,
        };

        setProducts((prev) => [...prev, newProduct]);

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
    [form]
  );

  const handleRemoveProduct = useCallback((index: number) => {
    setProducts((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSave = useCallback(async () => {
    if (!entityId) {
      toast.error(t("transaction:view.invalidId"));
      return;
    }

    if (products.length === 0) {
      toast.error(t("transaction:purchaseAdd.validation.atLeastOneProduct"));
      return;
    }

    setIsSaving(true);
    try {
      ensureDIConfigured();
      const updateProductsUseCase = container.resolve(
        UpdateTransactionProductsUseCase
      );

      await updateProductsUseCase.execute(entityId, products);

      toast.success(t("transaction:edit.messages.productsUpdateSuccess"));

      router.push(`/transactions/view?entityId=${entityId}`);
    } catch (err) {
      console.error("Error updating transaction products:", err);
      toast.error(
        err instanceof Error
          ? err.message
          : t("transaction:edit.messages.productsUpdateError")
      );
    } finally {
      setIsSaving(false);
    }
  }, [entityId, products, router, t]);

  const handleCancel = useCallback(() => {
    if (entityId) {
      router.push(`/transactions/view?entityId=${entityId}`);
    } else {
      router.push("/transactions");
    }
  }, [entityId, router]);

  // Create columns for DataTable
  const columns = useMemo(
    () =>
      createPurchaseProductColumns({
        t,
        onDelete: handleRemoveProduct,
        showActions: true,
      }),
    [t, handleRemoveProduct]
  );

  // Handle loading and error states
  if (!entityId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">
          {t("transaction:view.invalidId")}
        </p>
      </div>
    );
  }

  if (isLoading || !transaction) {
    return <LoadingFallback message={t("common:messages.loading")} />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-destructive mb-4">
            {t("transaction:view.notFoundDescription")}
          </p>
          <Button onClick={() => router.push("/transactions")}>
            {t("transaction:view.backToList")}
          </Button>
        </div>
      </div>
    );
  }

  if (transaction.transactionType !== "PURCHASE") {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-destructive mb-4">
            {t("transaction:edit.wrongTypeError")}
          </p>
          <Button
            onClick={() =>
              router.push(`/transactions/view?entityId=${entityId}`)
            }
          >
            {t("common:actions.back")}
          </Button>
        </div>
      </div>
    );
  }

  if (transaction.status !== "pending") {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-destructive mb-4">
            {t("transaction:edit.onlyPendingError")}
          </p>
          <Button
            onClick={() =>
              router.push(`/transactions/view?entityId=${entityId}`)
            }
          >
            {t("common:actions.back")}
          </Button>
        </div>
      </div>
    );
  }

  const footerButtons = (
    <div className="flex gap-2 justify-end">
      <Button
        onClick={handleSave}
        disabled={products.length === 0 || isSaving}
      >
        {isSaving
          ? t("common:messages.processing")
          : t("common:actions.save")}
      </Button>
    </div>
  );

  const headerContent = (
    <div className="flex items-center space-x-3">
      <h1 className="text-xl font-medium text-gray-900">
        {t("transaction:edit.productsPageTitle")}
      </h1>
    </div>
  );

  return (
    <PurchaseFormLayout
      title={t("transaction:edit.productsPageTitle")}
      onHandleCancel={handleCancel}
    >
      <div className="lg:flex items-start lg:space-x-4">
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
        >
          <div className="space-y-6">
            {/* Product addition form */}
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
                    {/* Quality */}
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

                    {/* Weight */}
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

                    {/* Bag Count */}
                    <FormInput
                      form={form}
                      name="bagCount"
                      label={t("transaction:purchaseAdd.fields.bagCount")}
                      type="number"
                      required
                      placeholder=""
                    />

                    {/* Price per kg */}
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

                    {/* Total price (calculated) */}
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

                    {/* Humidity */}
                    <FormInput
                      form={form}
                      name="humidity"
                      label={t("transaction:purchaseAdd.fields.humidity")}
                      type="number"
                      unit="%"
                      showUnit={true}
                      placeholder=""
                    />
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

            {/* Product list table */}
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
