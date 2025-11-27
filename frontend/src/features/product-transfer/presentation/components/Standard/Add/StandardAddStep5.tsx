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
import { useProductTransferStore } from "@/features/product-transfer/infrastructure/store/productTransferStore";
import { useStandardAddFormStore } from "@/features/product-transfer/infrastructure/store/standardAddFormStore";
import { useStandardAddFormNavigation } from "@/features/product-transfer/presentation/hooks";
import {
  step5Schema,
  type Step5Data,
} from "@/features/product-transfer/presentation/schemas/standard-validation-schemas";
import { useIsMobile } from "@/hooks/use-mobile";
import { useDayjsLocale } from "@/hooks/useDayjsLocale";
import { blobToBase64 } from "@/lib/blobToBase64";
import { zodResolver } from "@hookform/resolvers/zod";
import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { createProductColumns } from "../../Columns";
import { StandardFormLayout } from "./StandardFormLayout";

export function StandardAddStep5() {
  const { t } = useTranslation(["productTransfer", "common"]);
  const isMobile = useIsMobile();
  const dayjs = useDayjsLocale();

  const { createProductTransfer, updateProductTransfer } =
    useProductTransferStore();

  const {
    formData,
    updateStep5Data,
    setStepValidation,
    setCurrentStep,
    saveProgress,
    resetForm,
    isSubmitting,
    setSubmitting,
    entityId,
    editOffline,
  } = useStandardAddFormStore();

  const { handleFinish } = useStandardAddFormNavigation();

  // States pour stocker les noms des acteurs et magasins
  const [senderActorName, setSenderActorName] = useState<string>("");
  const [senderStoreName, setSenderStoreName] = useState<string>("");
  const [receiverActorName, setReceiverActorName] = useState<string>("");
  const [receiverStoreName, setReceiverStoreName] = useState<string>("");
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Form setup
  const form = useForm<Step5Data>({
    resolver: zodResolver(step5Schema),
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
  const {
    senderActorId,
    senderStoreId,
    receiverActorId,
    receiverStoreId,
    transferDate,
  } = formData.step1;
  const { products } = formData.step2;
  const { hasDriver, driverInfo } = formData.step3;
  const { routeSheetDocuments } = formData.step4;

  React.useEffect(() => {
    setCurrentStep(5);
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

            // Récupérer le nom du magasin expéditeur depuis les stores de l'acteur
            if (
              senderStoreId &&
              senderActor.stores &&
              senderActor.stores.length > 0
            ) {
              const store = senderActor.stores.find(
                (s) => s.id === senderStoreId
              );
              if (store) {
                setSenderStoreName(
                  `${store.name}${store.code ? ` (${store.code})` : ""}`
                );
              }
            }
          }
        }

        // Si le sender store n'a pas été trouvé, chercher dans tous les acteurs
        if (senderStoreId && !senderStoreName) {
          const allActors = await db.actors.toArray();
          for (const actor of allActors) {
            if (actor.stores && actor.stores.length > 0) {
              const store = actor.stores.find((s) => s.id === senderStoreId);
              if (store) {
                setSenderStoreName(
                  `${store.name}${store.code ? ` (${store.code})` : ""}`
                );
                break;
              }
            }
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

            // Récupérer le nom du magasin destinataire depuis les stores de l'acteur
            if (
              receiverStoreId &&
              receiverActor.stores &&
              receiverActor.stores.length > 0
            ) {
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

        // Si le receiver store n'a pas été trouvé, chercher dans tous les acteurs
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
  }, [senderActorId, senderStoreId, receiverActorId, receiverStoreId]); // receiverStoreName et senderStoreName sont des variables d'état, pas des dépendances

  // Observer les changements de données
  useEffect(() => {
    const subscription = form.watch((data) => {
      updateStep5Data(data as Step5Data);
      saveProgress();
    });
    return () => subscription.unsubscribe();
  }, [form, updateStep5Data, saveProgress]);

  // Observer la validation
  useEffect(() => {
    setStepValidation("step5", isValid);
  }, [isValid, setStepValidation]);

  // Créer les colonnes pour le DataTable (sans actions)
  const columns = useMemo(
    () =>
      createProductColumns({
        t,
        showActions: false,
      }),
    [t]
  );

  const handleSubmit = useCallback(async () => {
    if (!isConfirmed) return;

    try {
      setSubmitting(true);

      // Normaliser les produits
      const normalizedProducts = products.map((product) => ({
        quality: product.quality,
        weight:
          typeof product.weight === "string"
            ? parseFloat(product.weight)
            : product.weight,
        numberOfBags:
          typeof product.numberOfBags === "string"
            ? parseInt(product.numberOfBags, 10)
            : product.numberOfBags,
      }));

      // Préparer les données du chauffeur si applicable
      const driverData = hasDriver && driverInfo ? driverInfo : undefined;

      // ⭐ Conversion Blob → base64 au moment de l'upload
      const documentsForAPI = await Promise.all(
        routeSheetDocuments.map(async (doc) => {
          // Si doc.data est un Blob, le convertir en base64
          // Sinon, c'est déjà une string base64 (document existant ou ancien format)
          const base64Data =
            doc.data instanceof Blob ? await blobToBase64(doc.data) : doc.data;

          return {
            base64Data,
            mimeType: doc.type,
            fileName: doc.name || "document.pdf",
            documentType: doc.optionValues[1] as string,
          };
        })
      );

      // Si en mode editOffline, on met à jour l'opération pendante existante
      if (editOffline && entityId) {
        const updateData = {
          transferType: "STANDARD" as const,
          senderActorId,
          senderStoreId,
          receiverActorId,
          receiverStoreId,
          transferDate,
          products: normalizedProducts,
          driverInfo: driverData,
          routeSheetDocuments: documentsForAPI,
        };
        await updateProductTransfer(entityId, updateData, true);
      } else {
        // Mode normal : créer un nouveau transfert
        const createData = {
          transferType: "STANDARD" as const,
          senderActorId,
          senderStoreId,
          receiverActorId,
          receiverStoreId,
          transferDate,
          products: normalizedProducts,
          driverInfo: driverData,
          routeSheetDocuments: documentsForAPI,
        };
        await createProductTransfer(createData);
      }

      // Réinitialiser le formulaire après succès
      resetForm();

      // Utiliser handleFinish pour la redirection
      handleFinish();
    } catch {
      // Le store gère déjà l'affichage de l'erreur
    } finally {
      setSubmitting(false);
    }
  }, [
    isConfirmed,
    senderActorId,
    senderStoreId,
    receiverActorId,
    receiverStoreId,
    transferDate,
    products,
    hasDriver,
    driverInfo,
    routeSheetDocuments,
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
          : t("productTransfer:form.step5.confirm")}
      </span>
    </Button>,
  ];

  // Header avec titre
  const headerContent = (
    <div className="flex items-center space-x-3">
      <h1 className="text-xl font-medium text-gray-900">
        {t("productTransfer:form.step5.cardTitle")}
      </h1>
    </div>
  );

  return (
    <StandardFormLayout className="!max-w-4xl">
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
              changeHref="/product-transfers/standard/create/general-info"
            />

            <DetailRow
              label={t("productTransfer:form.step1.senderStore")}
              value={
                isLoadingData
                  ? t("common:messages.loading")
                  : senderStoreName || senderStoreId || ""
              }
              showChangeButton={true}
              changeHref="/product-transfers/standard/create/general-info"
            />

            <DetailRow
              label={t("productTransfer:form.step1.receiverActor")}
              value={
                isLoadingData
                  ? t("common:messages.loading")
                  : receiverActorName || receiverActorId || ""
              }
              showChangeButton={true}
              changeHref="/product-transfers/standard/create/general-info"
            />

            <DetailRow
              label={t("productTransfer:form.step1.receiverStore")}
              value={
                isLoadingData
                  ? t("common:messages.loading")
                  : receiverStoreName || receiverStoreId || ""
              }
              showChangeButton={true}
              changeHref="/product-transfers/standard/create/general-info"
            />

            <DetailRow
              label={t("productTransfer:form.step1.transferDate")}
              value={transferDate ? dayjs(transferDate).format("LL") : ""}
              showChangeButton={true}
              changeHref="/product-transfers/standard/create/general-info"
              noBorder={true}
            />
          </div>

          {/* Section Produits */}
          <div className="">
            <Separator className="my-6" />
            <div className="flex items-center justify-between mb-4">
              <Heading as="h3" size="body">
                {t("productTransfer:form.step5.productsTitle")} (
                {products.length})
              </Heading>
              <Link
                href="/product-transfers/standard/create/products"
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

          {/* Informations du chauffeur si applicable */}
          {hasDriver && driverInfo && (
            <div className="">
              <Separator className="my-6" />
              <div className="flex items-center justify-between mb-4">
                <Heading as="h3" size="body">
                  {t("productTransfer:form.step5.driverInfo")}
                </Heading>
                <Link
                  href="/product-transfers/standard/create/driver"
                  className="text-blue-600 hover:text-blue-700 p-0 h-auto font-normal text-sm"
                >
                  {t("common:actions.edit")}
                </Link>
              </div>
              <div className="space-y-4">
                <DetailRow
                  label={t("productTransfer:form.step1.driverFullName")}
                  value={driverInfo.fullName}
                  noBorder={false}
                />
                <DetailRow
                  label={t(
                    "productTransfer:form.step1.driverVehicleRegistration"
                  )}
                  value={driverInfo.vehicleRegistration}
                  noBorder={false}
                />
                <DetailRow
                  label={t(
                    "productTransfer:form.step1.driverDrivingLicenseNumber"
                  )}
                  value={driverInfo.drivingLicenseNumber}
                  noBorder={false}
                />
                <DetailRow
                  label={t("productTransfer:form.step1.driverRouteSheetCode")}
                  value={driverInfo.routeSheetCode}
                  noBorder={true}
                />
              </div>
            </div>
          )}

          {/* Documents */}
          <div className="">
            <Separator className="my-6" />
            <div className="flex items-center justify-between mb-4">
              <Heading as="h3" size="body">
                {t("productTransfer:form.step5.documents")}
              </Heading>
              <Link
                href="/product-transfers/standard/create/documents"
                className="text-blue-600 hover:text-blue-700 p-0 h-auto font-normal text-sm"
              >
                {t("common:actions.edit")}
              </Link>
            </div>
            {routeSheetDocuments && routeSheetDocuments.length > 0 ? (
              <div className="space-y-2">
                {routeSheetDocuments.map((doc, index) => (
                  <DocumentPreview key={index} document={doc} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                {t("productTransfer:form.step5.noDocuments")}
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
                {t("productTransfer:form.step5.validation.confirmCheckbox")}
              </label>
            </div>

            {!isConfirmed && (
              <p className="text-sm text-red-600 mt-2">
                {t("productTransfer:form.step5.validation.confirmRequired")}
              </p>
            )}
          </div>
        </Form>
      </BaseCard>
    </StandardFormLayout>
  );
}
