"use client";

import {
  FormInput,
  FormInputAutocompletion,
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
import { db } from "@/core/infrastructure/database/db";
import { container } from "@/core/infrastructure/di/container";
import { useIsMobile } from "@/hooks/use-mobile";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { showError, showSuccess } from "@/lib/notifications/toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { ColumnDef } from "@tanstack/react-table";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { UpdateTransactionProductsUseCase } from "../../../../application/useCases/UpdateTransactionProductsUseCase";
import { TransactionProductForm } from "../../../../infrastructure/store/saleAddFormStore";
import { useGetTransactionById } from "../../../hooks/useGetTransactionById";
import {
  createSingleProductSchema,
  type SingleProductData,
} from "../../../schemas/sale-validation-schemas";
import { createSaleProductColumns } from "../../Columns";
import { SaleFormLayout } from "../SaleFormLayout";

export function SaleProductsEditForm() {
  const { t } = useTranslation(["transaction", "common"]);
  const searchParams = useSearchParams();
  const router = useRouter();
  const isOnline = useOnlineStatus();
  const isMobile = useIsMobile();

  const entityId = searchParams.get("entityId");

  // Charger la transaction
  const { transaction, isLoading, error } = useGetTransactionById(
    entityId || "",
    isOnline
  );

  // État local pour les produits
  const [products, setProducts] = useState<TransactionProductForm[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Options pour les producteurs (si seller est OPA)
  const [producerOptions, setProducerOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [isLoadingProducers, setIsLoadingProducers] = useState(false);
  const [sellerIsOPA, setSellerIsOPA] = useState(false);

  // Initialiser les produits depuis la transaction
  useEffect(() => {
    if (transaction?.products) {
      const mappedProducts: TransactionProductForm[] = transaction.products.map(
        (p) => ({
          id: p.id || crypto.randomUUID(),
          quality: p.quality,
          standard: p.standard,
          weight: Number(p.weight),
          bagCount: Number(p.bagCount),
          pricePerKg: Number(p.pricePerKg),
          totalPrice: Number(p.totalPrice),
          humidity: p.humidity ? Number(p.humidity) : null,
          producerId: p.producerId ?? null,
          notes: p.notes ?? null,
        })
      );
      setProducts(mappedProducts);
    }
  }, [transaction]);

  // Vérifier si le seller est un OPA et charger les producteurs
  useEffect(() => {
    const checkSellerAndLoadProducers = async () => {
      if (!transaction?.sellerId) {
        setSellerIsOPA(false);
        setProducerOptions([]);
        return;
      }

      try {
        // ✅ Charger le seller avec .where().or()
        const sellerActor = await db.actors
          .where("serverId")
          .equals(transaction.sellerId)
          .or("localId")
          .equals(transaction.sellerId)
          .first();

        if (sellerActor && sellerActor.actorType === "PRODUCERS") {
          setSellerIsOPA(true);
          setIsLoadingProducers(true);

          // ✅ Charger les producteurs depuis la table producerOpaRelations
          const producerRelations = await db.producerOpaRelations
            .where("opaServerId")
            .equals(transaction.sellerId)
            .or("opaLocalId")
            .equals(transaction.sellerId)
            .toArray();

          if (producerRelations && producerRelations.length > 0) {
            const producerIds = producerRelations.map(
              (rel) => rel.producerServerId || rel.producerLocalId || ""
            );

            const producers = await db.actors
              .where("serverId")
              .anyOf(producerIds)
              .or("localId")
              .anyOf(producerIds)
              .toArray();

            const producerOpts = producers
              .filter((producer) => producer.status === "active")
              .map((producer) => ({
                value: producer.serverId || producer.localId || "",
                label: `${producer.familyName} ${producer.givenName}`.trim(),
              }));
            setProducerOptions(producerOpts);
          } else {
            setProducerOptions([]);
          }

          setIsLoadingProducers(false);
        } else {
          setSellerIsOPA(false);
          setProducerOptions([]);
        }
      } catch (error) {
        console.error("Erreur lors de la vérification du seller:", error);
        setSellerIsOPA(false);
        setProducerOptions([]);
      }
    };

    checkSellerAndLoadProducers();
  }, [transaction?.sellerId]);

  const qualityOptions = useMemo(
    () => [
      {
        value: PRODUCT_QUALITIES_CONSTANTS.GRADE_1,
        label: t("transaction:saleAdd.qualityOptions.grade1"),
      },
      {
        value: PRODUCT_QUALITIES_CONSTANTS.GRADE_2,
        label: t("transaction:saleAdd.qualityOptions.grade2"),
      },
      {
        value: PRODUCT_QUALITIES_CONSTANTS.HS,
        label: t("transaction:saleAdd.qualityOptions.hs"),
      },
    ],
    [t]
  );

  const standardOptions = useMemo(() => {
    if (transaction?.locationType === "MARKET") {
      return [
        {
          value: PRODUCT_STANDARDS_CONSTANTS.CONVENTIONNEL,
          label: t("transaction:saleAdd.standardOptions.conventionnel"),
        },
      ];
    }

    return [
      {
        value: PRODUCT_STANDARDS_CONSTANTS.CERTIFIE,
        label: t("transaction:saleAdd.standardOptions.certifie"),
      },
      {
        value: PRODUCT_STANDARDS_CONSTANTS.EXCELLENT,
        label: t("transaction:saleAdd.standardOptions.excellent"),
      },
      {
        value: PRODUCT_STANDARDS_CONSTANTS.FIN,
        label: t("transaction:saleAdd.standardOptions.fin"),
      },
      {
        value: PRODUCT_STANDARDS_CONSTANTS.CONVENTIONNEL,
        label: t("transaction:saleAdd.standardOptions.conventionnel"),
      },
    ];
  }, [t, transaction?.locationType]);

  // Form setup pour ajouter UN produit
  const form = useForm<SingleProductData>({
    resolver: zodResolver(createSingleProductSchema(t)),
    defaultValues: {
      quality: "",
      standard: "",
      weight: "" as unknown as number,
      bagCount: "" as unknown as number,
      pricePerKg: "" as unknown as number,
      humidity: "" as unknown as number,
      producerId: "",
    },
    mode: "onChange",
  });

  const { isValid } = form.formState;

  const watchedWeight = form.watch("weight");
  const watchedPricePerKg = form.watch("pricePerKg");
  const watchedProducerId = form.watch("producerId");

  const calculatedTotalPrice = useMemo(() => {
    const weight = Number(watchedWeight) || 0;
    const pricePerKg = Number(watchedPricePerKg) || 0;
    return weight * pricePerKg;
  }, [watchedWeight, watchedPricePerKg]);

  // Désactiver le bouton si seller est OPA mais aucun producteur sélectionné
  const isAddButtonDisabled = useMemo(() => {
    if (!isValid) return true;
    if (sellerIsOPA && !watchedProducerId) return true;
    return false;
  }, [isValid, sellerIsOPA, watchedProducerId]);

  const handleAddProduct: SubmitHandler<SingleProductData> = useCallback(
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
          producerId: data.producerId || null,
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
          producerId: "",
        });
      }
    },
    [form]
  );

  const handleRemoveProduct = useCallback((index: number) => {
    setProducts((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSave = useCallback(async () => {
    if (products.length === 0) {
      showError(t("transaction:saleAdd.validation.atLeastOneProduct"));
      return;
    }

    if (!entityId) return;

    setIsSaving(true);
    try {
      const updateProductsUseCase = container.resolve(
        UpdateTransactionProductsUseCase
      );

      await updateProductsUseCase.execute(entityId, products);

      showSuccess(t("transaction:edit.messages.productsUpdateSuccess"));
      router.push(`/transactions/view?entityId=${entityId}`);
    } catch (err) {
      console.error("Error updating products:", err);
      showError(
        err instanceof Error
          ? err.message
          : t("transaction:edit.messages.productsUpdateError")
      );
    } finally {
      setIsSaving(false);
    }
  }, [products, entityId, router, t]);

  const handleCancel = useCallback(() => {
    router.push(`/transactions/view?entityId=${entityId}`);
  }, [router, entityId]);

  // Créer les colonnes pour le DataTable
  const columns = useMemo(
    () =>
      createSaleProductColumns({
        t,
        onDelete: handleRemoveProduct,
        showActions: true,
        producerOptions: sellerIsOPA ? producerOptions : undefined,
      }),
    [t, handleRemoveProduct, sellerIsOPA, producerOptions]
  );

  // Gestion des états de chargement et d'erreur
  if (!entityId) {
    return (
      <SaleFormLayout title={t("transaction:edit.productsPageTitle")}>
        <div className="text-red-500">{t("transaction:view.invalidId")}</div>
      </SaleFormLayout>
    );
  }

  if (isLoading || !transaction) {
    return (
      <SaleFormLayout title={t("transaction:edit.productsPageTitle")}>
        <LoadingFallback message={t("common:messages.loading")} />
      </SaleFormLayout>
    );
  }

  if (error) {
    return (
      <SaleFormLayout title={t("transaction:edit.productsPageTitle")}>
        <div className="text-red-500">{error}</div>
      </SaleFormLayout>
    );
  }

  if (transaction.transactionType !== "SALE") {
    return (
      <SaleFormLayout title={t("transaction:edit.productsPageTitle")}>
        <div className="text-red-500">
          {t("transaction:edit.wrongTypeError")}
        </div>
      </SaleFormLayout>
    );
  }

  if (transaction.status !== "pending") {
    return (
      <SaleFormLayout title={t("transaction:edit.productsPageTitle")}>
        <div className="text-red-500">
          {t("transaction:edit.onlyPendingError")}
        </div>
      </SaleFormLayout>
    );
  }

  const footerButtons = (
    <div className="flex gap-2 justify-end">
      <Button onClick={handleSave} disabled={products.length === 0 || isSaving}>
        {isSaving ? t("common:messages.saving") : t("common:actions.save")}
      </Button>
    </div>
  );

  const headerContent = (
    <div className="flex items-center space-x-3">
      <h1 className="text-xl font-medium text-gray-900">
        {t("transaction:saleAdd.steps.products")}
      </h1>
    </div>
  );

  return (
    <SaleFormLayout
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
            {/* Formulaire d'ajout de produit */}
            <div className="space-y-4 rounded-lg border-2 border-dashed border-gray-300 p-4">
              <h3 className="font-semibold">
                {t("transaction:saleAdd.fields.addProductTitle")}
              </h3>

              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(handleAddProduct)}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <FormSelect
                      form={form}
                      name="quality"
                      label={t("transaction:saleAdd.fields.quality")}
                      placeholder=""
                      options={qualityOptions}
                      required
                    />

                    <FormSelect
                      form={form}
                      name="standard"
                      label={t("transaction:saleAdd.fields.standard")}
                      placeholder=""
                      options={standardOptions}
                      required
                    />

                    <FormInput
                      form={form}
                      name="weight"
                      label={t("transaction:saleAdd.fields.weight")}
                      type="number"
                      required
                      unit="kg"
                      showUnit={true}
                      placeholder=""
                    />

                    <FormInput
                      form={form}
                      name="bagCount"
                      label={t("transaction:saleAdd.fields.bagCount")}
                      type="number"
                      required
                      placeholder=""
                    />

                    <FormInput
                      form={form}
                      name="pricePerKg"
                      label={t("transaction:saleAdd.fields.pricePerKg")}
                      type="number"
                      required
                      unit="FCFA"
                      showUnit={true}
                      placeholder=""
                    />

                    <div className="lg:w-full">
                      <label className="block text-base font-medium text-gray-700 mb-2">
                        {t("transaction:saleAdd.fields.totalPrice")}
                      </label>
                      <div className="flex items-center h-12 px-3 rounded-md border border-gray-300 bg-gray-50">
                        <span className="text-gray-900 font-medium">
                          {calculatedTotalPrice.toLocaleString("fr-FR")} FCFA
                        </span>
                      </div>
                    </div>

                    <FormInput
                      form={form}
                      name="humidity"
                      label={t("transaction:saleAdd.fields.humidity")}
                      type="number"
                      unit="%"
                      showUnit={true}
                      placeholder=""
                    />

                    {sellerIsOPA && (
                      <FormInputAutocompletion
                        form={form}
                        name="producerId"
                        label={t("transaction:saleAdd.fields.producer")}
                        placeholder=""
                        options={producerOptions}
                        disabled={isLoadingProducers}
                        required
                      />
                    )}
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={isAddButtonDisabled}>
                      <Icon name="Plus" className="mr-2 h-4 w-4" />
                      {t("transaction:saleAdd.fields.addProduct")}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>

            {/* Tableau des produits ajoutés */}
            {products.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold">
                  {t("transaction:saleAdd.fields.productList")} (
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
                    "transaction:saleAdd.validation.atLeastOneProduct"
                  )}
                />
              </div>
            )}
          </div>
        </BaseCard>
      </div>
    </SaleFormLayout>
  );
}
