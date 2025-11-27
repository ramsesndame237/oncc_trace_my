"use client";

import {
  FormInput,
  FormInputAutocompletion,
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
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { zodResolver } from "@hookform/resolvers/zod";
import { ColumnDef } from "@tanstack/react-table";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
  useSaleAddFormStore,
  type TransactionProductForm,
} from "../../../../infrastructure/store/saleAddFormStore";
import { useSaleAddFormNavigation } from "../../../hooks/useSaleAddFormNavigation";
import {
  createSingleProductSchema,
  type SingleProductData,
} from "../../../schemas/sale-validation-schemas";
import { createSaleProductColumns } from "../../Columns";
import { SaleFormLayout } from "../SaleFormLayout";

export function SaleAddStep2() {
  const { t } = useTranslation(["transaction", "common"]);
  const searchParams = useSearchParams();
  const router = useRouter();
  const isOnline = useOnlineStatus();
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
  } = useSaleAddFormStore();

  const { navigateToNext, navigateToPrevious } = useSaleAddFormNavigation();
  const [isNavigating, setIsNavigating] = useState(false);

  // Réinitialiser isNavigating quand le composant est monté (après PinGuard par exemple)
  React.useEffect(() => {
    setIsNavigating(false);
  }, []);

  // Détection du mode édition depuis les query params
  const entityIdFromParams = searchParams.get("entityId");
  const entityId = entityIdFromParams || storeEntityId;
  const editOffline = storeEditOffline;
  const returnTo = searchParams.get("returnTo");
  const directEntry = searchParams.get("directEntry") === "true";

  const products = formData.step2.products;

  // Options pour les produits (mêmes que conventions)
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
    // Si locationType est MARKET, seul le standard CONVENTIONNEL est disponible
    if (formData.step1.locationType === "MARKET") {
      return [
        {
          value: PRODUCT_STANDARDS_CONSTANTS.CONVENTIONNEL,
          label: t("transaction:saleAdd.standardOptions.conventionnel"),
        },
      ];
    }

    // Sinon, tous les standards sont disponibles
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
  }, [t, formData.step1.locationType]);

  // Options pour les producteurs (si seller est OPA)
  const [producerOptions, setProducerOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [isLoadingProducers, setIsLoadingProducers] = useState(false);
  const [sellerIsOPA, setSellerIsOPA] = useState(false);

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
    criteriaMode: "firstError",
    shouldFocusError: true,
  });

  const { isValid } = form.formState;

  // Watch pour calculer le prix total
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

  // Initialiser l'étape courante
  React.useEffect(() => {
    setCurrentStep(2);
  }, [setCurrentStep]);

  // Vérifier si le seller est un OPA et charger les producteurs de cet OPA
  useEffect(() => {
    const checkSellerAndLoadProducers = async () => {
      const sellerId = formData.step1.sellerId;
      if (!sellerId) {
        setSellerIsOPA(false);
        setProducerOptions([]);
        return;
      }

      try {
        // ✅ Charger le seller avec .where().or()
        const sellerActor = await db.actors
          .where("serverId")
          .equals(sellerId)
          .or("localId")
          .equals(sellerId)
          .first();

        if (sellerActor && sellerActor.actorType === "PRODUCERS") {
          setSellerIsOPA(true);
          setIsLoadingProducers(true);

          // ✅ Charger les producteurs depuis la table producerOpaRelations
          const producerRelations = await db.producerOpaRelations
            .where("opaServerId")
            .equals(sellerId)
            .or("opaLocalId")
            .equals(sellerId)
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
  }, [formData.step1.sellerId, isOnline]);

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

        addProduct(newProduct);
        saveProgress();

        // Réinitialiser le formulaire
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
      alert(t("transaction:saleAdd.validation.atLeastOneProduct"));
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
        {t("transaction:saleAdd.steps.products")}
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
                    {/* Qualité */}
                    <FormSelect
                      form={form}
                      name="quality"
                      label={t("transaction:saleAdd.fields.quality")}
                      placeholder=""
                      options={qualityOptions}
                      required
                    />

                    {/* Standard */}
                    <FormSelect
                      form={form}
                      name="standard"
                      label={t("transaction:saleAdd.fields.standard")}
                      placeholder=""
                      options={standardOptions}
                      required
                    />

                    {/* Poids */}
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

                    {/* Nombre de sacs */}
                    <FormInput
                      form={form}
                      name="bagCount"
                      label={t("transaction:saleAdd.fields.bagCount")}
                      type="number"
                      required
                      placeholder=""
                    />

                    {/* Prix par kg */}
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

                    {/* Prix total (calculé) */}
                    <div className="lg:w-full">
                      <label className="block text-base font-medium text-gray-700 mb-2">
                        {t("transaction:saleAdd.fields.totalPrice")}
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
                      label={t("transaction:saleAdd.fields.humidity")}
                      type="number"
                      unit="%"
                      showUnit={true}
                      placeholder=""
                    />

                    {/* Producteur (si seller est OPA) */}
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
