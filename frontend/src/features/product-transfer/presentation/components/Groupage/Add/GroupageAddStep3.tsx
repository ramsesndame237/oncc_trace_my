"use client";

import { BaseCard } from "@/components/modules/base-card";
import { DetailRow } from "@/components/modules/detail-row";
import { Heading } from "@/components/modules/heading";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTable } from "@/components/ui/data-table";
import { Form } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { db } from "@/core/infrastructure/database/db";
import { useGroupageAddFormStore } from "@/features/product-transfer/infrastructure/store/groupageAddFormStore";
import { useProductTransferStore } from "@/features/product-transfer/infrastructure/store/productTransferStore";
import { useGroupageAddFormNavigation } from "@/features/product-transfer/presentation/hooks";
import {
  step3Schema,
  type Step3Data,
} from "@/features/product-transfer/presentation/schemas/groupage-validation-schemas";
import { useIsMobile } from "@/hooks/use-mobile";
import { useDayjsLocale } from "@/hooks/useDayjsLocale";
import { zodResolver } from "@hookform/resolvers/zod";
import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { createProductColumns } from "../../Columns";
import { GroupageFormLayout } from "./GroupageFormLayout";

export function GroupageAddStep3() {
  const { t } = useTranslation(["productTransfer", "common"]);
  const isMobile = useIsMobile();
  const dayjs = useDayjsLocale();

  const { createProductTransfer, updateProductTransfer } = useProductTransferStore();

  const {
    formData,
    updateStep3Data,
    setStepValidation,
    setCurrentStep,
    saveProgress,
    resetForm,
    isSubmitting,
    setSubmitting,
    entityId,
    editOffline,
  } = useGroupageAddFormStore();

  // Utiliser le hook de navigation
  const { handleFinish } = useGroupageAddFormNavigation();

  // States pour stocker les noms des acteurs et du magasin
  const [senderActorName, setSenderActorName] = useState<string>("");
  const [receiverActorName, setReceiverActorName] = useState<string>("");
  const [receiverStoreName, setReceiverStoreName] = useState<string>("");
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Form setup
  const form = useForm<Step3Data>({
    resolver: zodResolver(step3Schema),
    defaultValues: {
      confirmed: false,
    },
    mode: "onChange",
    criteriaMode: "firstError",
    shouldFocusError: true,
  });

  const { isValid } = form.formState;
  const isConfirmed = form.watch("confirmed");

  // Extraire les données des différentes étapes
  const { senderActorId, receiverActorId, receiverStoreId, transferDate } =
    formData.step1;
  const { products } = formData.step2;

  React.useEffect(() => {
    setCurrentStep(3);
    // Forcer la confirmation à false à chaque fois qu'on arrive sur cette étape
    form.setValue("confirmed", false);
  }, [setCurrentStep, form]);

  // Charger les noms depuis IndexedDB
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoadingData(true);

        // Charger le nom de l'expéditeur
        if (senderActorId) {
          const senderActor = await db.actors
            .where("serverId")
            .equals(senderActorId)
            .or("localId")
            .equals(senderActorId)
            .first();

          if (senderActor) {
            setSenderActorName(
              `${senderActor.familyName} ${senderActor.givenName}`.trim()
            );
          }
        }

        // Charger le nom du destinataire
        if (receiverActorId) {
          const receiverActor = await db.actors
            .where("serverId")
            .equals(receiverActorId)
            .or("localId")
            .equals(receiverActorId)
            .first();

          if (receiverActor) {
            setReceiverActorName(
              `${receiverActor.familyName} ${receiverActor.givenName}`.trim()
            );

            // Charger le nom du magasin depuis les stores de l'OPA
            if (receiverStoreId && receiverActor.stores && receiverActor.stores.length > 0) {
              const store = receiverActor.stores.find(
                (s) => s.id === receiverStoreId
              );
              if (store) {
                setReceiverStoreName(
                  `${store.name}${store.code ? ` (${store.code})` : ""}`
                );
              }
            }
          }
        }

        // Si le store n'a pas été trouvé dans receiverActor, chercher dans tous les acteurs
        if (receiverStoreId && !receiverStoreName) {
          const allActors = await db.actors.toArray();
          for (const actor of allActors) {
            if (actor.stores && actor.stores.length > 0) {
              const store = actor.stores.find((s) => s.id === receiverStoreId);
              if (store) {
                setReceiverStoreName(
                  `${store.name}${store.code ? ` (${store.code})` : ""}`
                );
                break;
              }
            }
          }
        }
      } catch {
        // Silently fail - data loading is not critical
      } finally {
        setIsLoadingData(false);
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [senderActorId, receiverActorId, receiverStoreId]); // receiverStoreName est une variable d'état, pas une dépendance

  // Observer les changements de données
  useEffect(() => {
    const subscription = form.watch((data) => {
      updateStep3Data(data as Step3Data);
      saveProgress();
    });
    return () => subscription.unsubscribe();
  }, [form, updateStep3Data, saveProgress]);

  // Observer la validation
  useEffect(() => {
    setStepValidation("step3", isValid);
  }, [isValid, setStepValidation]);

  // Créer les colonnes pour le DataTable (sans actions)
  const columns = useMemo(
    () =>
      createProductColumns({
        t,
        showActions: false, // Pas d'actions dans la vue récapitulatif
      }),
    [t]
  );

  const handleSubmit = useCallback(async () => {
    if (!isConfirmed) return;

    try {
      setSubmitting(true);

      // Normaliser les produits : convertir weight et numberOfBags en number
      const normalizedProducts = products.map((product) => ({
        quality: product.quality,
        weight: typeof product.weight === "string" ? parseFloat(product.weight) : product.weight,
        numberOfBags: typeof product.numberOfBags === "string" ? parseInt(product.numberOfBags, 10) : product.numberOfBags,
      }));

      // Si en mode editOffline, on met à jour l'opération pendante existante
      if (editOffline && entityId) {
        // Pour la mise à jour : UpdateProductTransferRequest (tous les champs sont optionnels)
        const updateData = {
          transferType: "GROUPAGE" as const,
          senderActorId,
          receiverActorId,
          receiverStoreId,
          transferDate,
          products: normalizedProducts,
        };
        await updateProductTransfer(entityId, updateData, true); // true = editOffline
      } else {
        // Mode normal : créer un nouveau transfert
        // Pour la création : CreateProductTransferRequest (senderStoreId requis)
        const createData = {
          transferType: "GROUPAGE" as const,
          senderActorId,
          senderStoreId: "", // Vide pour GROUPAGE (producteur sans magasin)
          receiverActorId,
          receiverStoreId,
          transferDate,
          products: normalizedProducts,
        };
        await createProductTransfer(createData);
      }

      // Réinitialiser le formulaire après succès
      resetForm();

      // Utiliser handleFinish pour la redirection (gère automatiquement editOffline)
      handleFinish();
    } catch {
      // Le store gère déjà l'affichage de l'erreur
    } finally {
      setSubmitting(false);
    }
  }, [
    isConfirmed,
    senderActorId,
    receiverActorId,
    receiverStoreId,
    transferDate,
    products,
    createProductTransfer,
    updateProductTransfer,
    editOffline,
    entityId,
    resetForm,
    handleFinish,
    setSubmitting,
  ]);

  // Boutons du footer
  const footerButtons = [
    <Button
      key="submit"
      type="button"
      onClick={handleSubmit}
      disabled={!isConfirmed || isSubmitting}
      className="flex items-center space-x-2"
    >
      <span>
        {isSubmitting
          ? t("common:messages.loading")
          : t("productTransfer:form.step3.confirm")}
      </span>
    </Button>,
  ];

  // Header avec titre
  const headerContent = (
    <div className="flex items-center space-x-3">
      <h1 className="text-xl font-medium text-gray-900">
        {t("productTransfer:form.step3.cardTitle")}
      </h1>
    </div>
  );

  return (
    <GroupageFormLayout className="!max-w-4xl">
      <BaseCard
        title={headerContent}
        footer={footerButtons}
        className="w-full"
        classNameFooter="!justify-between"
      >
          <Form {...form}>
            {/* Informations générales */}
            <div className="space-y-4">
              <DetailRow
                label={t("productTransfer:form.step1.senderActor")}
                value={
                  isLoadingData
                    ? t("common:messages.loading")
                    : senderActorName || senderActorId || ""
                }
                showChangeButton={true}
                changeHref="/product-transfers/groupage/create/general-info"
              />

              <DetailRow
                label={t("productTransfer:form.step1.receiverActor")}
                value={
                  isLoadingData
                    ? t("common:messages.loading")
                    : receiverActorName || receiverActorId || ""
                }
                showChangeButton={true}
                changeHref="/product-transfers/groupage/create/general-info"
              />

              <DetailRow
                label={t("productTransfer:form.step1.receiverStore")}
                value={
                  isLoadingData
                    ? t("common:messages.loading")
                    : receiverStoreName || receiverStoreId || ""
                }
                showChangeButton={true}
                changeHref="/product-transfers/groupage/create/general-info"
              />

              <DetailRow
                label={t("productTransfer:form.step1.transferDate")}
                value={transferDate ? dayjs(transferDate).format("LL") : ""}
                showChangeButton={true}
                changeHref="/product-transfers/groupage/create/general-info"
                noBorder={true}
              />
            </div>

            {/* Section Produits */}
            <div className="">
              <Separator className="my-6" />
              <div className="flex items-center justify-between mb-4">
                <Heading as="h3" size="body">
                  {t("productTransfer:form.step3.productsTitle")} (
                  {products.length})
                </Heading>
                <Link
                  href="/product-transfers/groupage/create/products"
                  className="text-blue-600 hover:text-blue-700 p-0 h-auto font-normal text-sm"
                >
                  {t("common:actions.edit")}
                </Link>
              </div>
              {products.length > 0 ? (
                <>
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
                </>
              ) : (
                <p className="text-sm text-gray-500">
                  {t("productTransfer:form.step2.validation.atLeastOneProduct")}
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
                  {t("productTransfer:form.step3.validation.confirmCheckbox")}
                </label>
              </div>

              {!isConfirmed && (
                <p className="text-sm text-red-600 mt-2">
                  {t("productTransfer:form.step3.validation.confirmRequired")}
                </p>
              )}
          </div>
        </Form>
      </BaseCard>
    </GroupageFormLayout>
  );
}
