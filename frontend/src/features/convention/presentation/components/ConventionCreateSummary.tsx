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
import type { ConventionWithSync } from "@/features/convention/domain/types";
import { useConventionFormStore } from "@/features/convention/infrastructure/store/conventionFormStore";
import { useConventionStore } from "@/features/convention/infrastructure/store/conventionStore";
import { useConventionFormNavigation } from "@/features/convention/presentation/hooks";
import {
  createStep4Schema,
  type Step4Data,
} from "@/features/convention/presentation/schemas/convention-validation-schemas";
import { useDayjsLocale } from "@/hooks/useDayjsLocale";
import { useIsMobile } from "@/hooks/use-mobile";
import { blobToBase64 } from "@/lib/blobToBase64";
import { zodResolver } from "@hookform/resolvers/zod";
import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { createProductColumns } from "./Columns";
import { ConventionFormLayout } from "./ConventionFormLayout";

export function ConventionCreateSummary() {
  const { t } = useTranslation(["convention", "common"]);
  const isMobile = useIsMobile();
  const dayjs = useDayjsLocale();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const searchParams = useSearchParams();

  const {
    formData,
    updateStep4Data,
    setStepValidation,
    setCurrentStep,
    saveProgress,
    resetForm,
    isSubmitting,
    setSubmitting,
    entityId,
    editOffline,
  } = useConventionFormStore();

  // Utiliser le store pour la création/mise à jour de convention
  const { createConvention, updateConvention } = useConventionStore();

  // Utiliser le hook de navigation
  const { handleFinish } = useConventionFormNavigation();

  // States pour stocker les noms des acteurs
  const [buyerExporterName, setBuyerExporterName] = useState<string>("");
  const [producerName, setProducerName] = useState<string>("");
  const [isLoadingActors, setIsLoadingActors] = useState(true);

  // Créer le schéma de validation
  const validationSchema = createStep4Schema(t);

  // Form setup
  const form = useForm({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      confirmed: false, // Toujours false pour forcer la confirmation à chaque visite
    },
    mode: "onChange",
    criteriaMode: "firstError",
    shouldFocusError: true,
  });

  const { isValid } = form.formState;
  const isConfirmed = form.watch("confirmed");

  // Extraire les données des différentes étapes
  const { buyerExporterId, producersId, signatureDate } = formData.step1;
  const { products } = formData.step2;
  const { conventionDocuments, complementDocuments } = formData.step3;

  React.useEffect(() => {
    setCurrentStep(4);
    // Forcer la confirmation à false à chaque fois qu'on arrive sur cette étape
    form.setValue("confirmed", false);
  }, [setCurrentStep, form]);

  // Charger les noms des acteurs depuis IndexedDB
  useEffect(() => {
    const loadActorNames = async () => {
      try {
        setIsLoadingActors(true);

        // Charger le nom de l'exportateur/acheteur
        if (buyerExporterId) {
          const buyerExporter = await db.actors
            .where("serverId")
            .equals(buyerExporterId)
            .or("localId")
            .equals(buyerExporterId)
            .first();

          if (buyerExporter) {
            setBuyerExporterName(
              `${buyerExporter.familyName} ${buyerExporter.givenName}`.trim()
            );
          }
        }

        // Charger le nom du producteur/OPA
        if (producersId) {
          const producer = await db.actors
            .where("serverId")
            .equals(producersId)
            .or("localId")
            .equals(producersId)
            .first();

          if (producer) {
            setProducerName(
              `${producer.familyName} ${producer.givenName}`.trim()
            );
          }
        }
      } catch {
        // Silently fail - actor names are not critical
      } finally {
        setIsLoadingActors(false);
      }
    };

    loadActorNames();
  }, [buyerExporterId, producersId]);

  // Observer les changements de données
  useEffect(() => {
    const subscription = form.watch((data) => {
      updateStep4Data(data as Step4Data);
      saveProgress(); // Auto-save
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
      createProductColumns({
        t,
        showActions: false, // Pas de bouton supprimer dans le summary
      }),
    [t]
  );

  const handleSubmit = useCallback(async () => {
    if (!isConfirmed) return;

    try {
      setSubmitting(true);

      // Combiner tous les documents
      const allDocuments = [
        ...(conventionDocuments || []),
        ...(complementDocuments || []),
      ];

      // ⭐ Conversion Blob → base64 au moment de l'upload
      const documents = await Promise.all(
        allDocuments.map(async (doc) => {
          // Si doc.data est un Blob, le convertir en base64
          // Sinon, c'est déjà une string base64 (document existant ou ancien format)
          const base64Data = doc.data instanceof Blob
            ? await blobToBase64(doc.data)
            : doc.data;

          return {
            base64Data,
            mimeType: doc.type,
            fileName: doc.name || "document",
            documentType:
              (doc.optionValues?.[1] as string) || "convention_document",
          };
        })
      );

      // Type pour les documents supplémentaires
      type ConventionDataWithDocuments = Partial<ConventionWithSync> & {
        documents?: Array<{
          base64Data: string;
          mimeType: string;
          fileName: string;
          documentType: string;
        }>;
      };

      // Préparer les données pour la création/mise à jour
      const conventionData: ConventionDataWithDocuments = {
        buyerExporterId,
        producersId,
        signatureDate,
        products: products as ConventionWithSync["products"],
        documents, // ← Documents transformés au format base64
      };

      // Si en mode editOffline, on met à jour l'opération pendante existante
      if (editOffline && entityId) {
        await updateConvention(
          entityId,
          conventionData as Partial<ConventionWithSync>,
          true
        ); // true = editOffline
      } else {
        // Mode normal : créer une nouvelle convention
        await createConvention(
          conventionData as Omit<ConventionWithSync, "id"> & {
            documents?: Array<{
              base64Data: string;
              mimeType: string;
              fileName: string;
              documentType: string;
            }>;
          }
        );
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
    buyerExporterId,
    producersId,
    signatureDate,
    products,
    conventionDocuments,
    complementDocuments,
    createConvention,
    updateConvention,
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
      <span>{t("convention:form.summary.confirm")}</span>
    </Button>,
  ];

  // Header avec titre
  const headerContent = (
    <div className="flex items-center space-x-3">
      <h1 className="text-xl font-medium text-gray-900">
        {t("convention:form.summary.cardTitle")}
      </h1>
    </div>
  );

  return (
    <ConventionFormLayout className="!max-w-4xl">
      <BaseCard
        title={headerContent}
        footer={footerButtons}
        className="w-full"
        classNameFooter="!justify-between"
      >
        <Form {...form}>
          {/* Informations de base */}
          <div className="space-y-4">
            <DetailRow
              label={t("convention:form.step1.buyerExporter")}
              value={
                isLoadingActors
                  ? t("common:messages.loading")
                  : buyerExporterName || buyerExporterId || ""
              }
              showChangeButton={true}
              changeHref="/conventions/create/basic-info"
            />
            <DetailRow
              label={t("convention:form.step1.opa")}
              value={
                isLoadingActors
                  ? t("common:messages.loading")
                  : producerName || producersId || ""
              }
              showChangeButton={true}
              changeHref="/conventions/create/basic-info"
            />
            <DetailRow
              label={t("convention:form.step1.signatureDate")}
              value={signatureDate ? dayjs(signatureDate).format("LL") : ""}
              showChangeButton={true}
              changeHref="/conventions/create/basic-info"
              noBorder={true}
            />

            {/* Section Produits */}
            <div className="">
              <Separator className="my-6" />
              <div className="flex items-center justify-between mb-4">
                <Heading as="h3" size="body">
                  {t("convention:form.summary.productsTitle")} (
                  {products.length})
                </Heading>
                <Link
                  href="/conventions/create/products"
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
                      "convention:form.step2.validation.atLeastOneProduct"
                    )}
                  />
                </>
              ) : (
                <p className="text-sm text-gray-500">
                  {t("convention:form.step2.validation.atLeastOneProduct")}
                </p>
              )}
            </div>

            {/* Pièces jointes */}
            <div className="">
              <Separator className="my-6" />
              <div className="flex items-center justify-between mb-4">
                <Heading as="h3" size="body">
                  {t("convention:form.summary.attachmentsTitle")}
                </Heading>
                <Link
                  href="/conventions/create/documents"
                  className="text-blue-600 hover:text-blue-700 p-0 h-auto font-normal text-sm"
                >
                  {t("convention:form.summary.addAttachment")}
                </Link>
              </div>
              {(() => {
                const allDocuments = [
                  ...(conventionDocuments || []),
                  ...(complementDocuments || []),
                ];
                return allDocuments.length > 0 ? (
                  <div className="space-y-2">
                    {allDocuments.map((doc, index) => (
                      <DocumentPreview key={index} document={doc} />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    {t("convention:form.summary.noAttachments")}
                  </p>
                );
              })()}
            </div>
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
                {t("convention:form.summary.validation.confirmCheckbox")}
              </label>
            </div>

            {!isConfirmed && (
              <p className="text-sm text-red-600 mt-2">
                {t("convention:form.summary.validation.confirmRequired")}
              </p>
            )}
          </div>
        </Form>
      </BaseCard>
    </ConventionFormLayout>
  );
}
