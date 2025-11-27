"use client";

import { DocumentPreview } from "@/components/documents";
import { BaseCard } from "@/components/modules/base-card";
import { DetailRow } from "@/components/modules/detail-row";
import { Heading } from "@/components/modules/heading";
import { SyncErrorAlert } from "@/components/modules/sync-error-alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Form } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { HierarchyDisplay } from "@/features/location/presentation/components";
import { blobToBase64 } from "@/lib/blobToBase64";
import { formatPhoneDisplay } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import React, { useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import type { ActorWithSync } from "../../../domain/actor.types";
import { useActorStore } from "../../../infrastructure/store/actorStore";
import { useBuyerFormStore } from "../../../infrastructure/store/buyerFormStore";
import { useBuyerFormNavigation } from "../../hooks/useBuyerFormNavigation";
import {
  createStep3SummarySchema,
  type Step3SummaryData,
} from "../../schemas/buyer-validation-schemas";
import BuyerFormLayout from "./BuyerFormLayout";

export default function BuyerEditStep3() {
  const { t } = useTranslation(["actor", "common"]);
  const searchParams = useSearchParams();
  const entityId = searchParams.get("entityId");
  const editOffline = searchParams.has("editOffline");

  const {
    formData,
    updateStep3Data,
    setStepValidation,
    setCurrentStep,
    saveProgress,
    resetForm,
  } = useBuyerFormStore();

  const { createActor, updateActor, isLoading } = useActorStore();
  const { handleFinish } = useBuyerFormNavigation();

  // Créer le schéma de validation
  const validationSchema = createStep3SummarySchema(t);

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

  React.useEffect(() => {
    setCurrentStep(3);
    // Forcer la confirmation à false à chaque fois qu'on arrive sur cette étape
    form.setValue("confirmed", false);
  }, [setCurrentStep, form]);

  // Observer les changements de données
  useEffect(() => {
    const subscription = form.watch((data) => {
      updateStep3Data(data as Step3SummaryData);
      saveProgress(); // Auto-save
    });
    return () => subscription.unsubscribe();
  }, [form, updateStep3Data, saveProgress]);

  // Observer la validation
  useEffect(() => {
    setStepValidation(3, isValid);
  }, [isValid, setStepValidation]);

  const handleSubmit = useCallback(async () => {
    if (!isConfirmed) return;

    try {
      // Préparer les documents
      const allDocuments = [
        ...(formData.step2?.buyerDocuments || []),
        ...(formData.step2?.landProofDocuments || []),
        ...(formData.step2?.complementaryDocuments || []),
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
            documentType: (doc.optionValues && doc.optionValues[1]) || "",
          };
        })
      );

      // Préparer les métadonnées buyer
      const metadata: {
        gender?: string;
        companyName?: string;
        cniNumber?: string;
        professionalCardNumber?: string;
      } = {};

      if (formData.step1?.gender) {
        metadata.gender = formData.step1.gender;
      }
      if (formData.step1?.companyName) {
        metadata.companyName = formData.step1.companyName;
      }
      if (formData.step1?.cniNumber) {
        metadata.cniNumber = formData.step1.cniNumber;
      }
      if (formData.step1?.professionalCardNumber) {
        metadata.professionalCardNumber = formData.step1.professionalCardNumber;
      }

      // Préparer les données de l'acteur selon le type ActorWithSync
      // Le statut sera défini automatiquement par le backend selon le rôle de l'utilisateur
      const actorData = {
        actorType: "BUYER" as const,
        familyName: formData.step1?.familyName || "",
        givenName: formData.step1?.givenName || "",
        email: formData.step1?.email || "",
        phone: formData.step1?.phone,
        locationCode: formData.step1?.locationCode || "",
        onccId: formData.step1?.onccId,
        identifiantId: formData.step1?.identifiantId,
        // status est omis volontairement - sera géré par le backend
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
        documents,
      };

      // Créer ou mettre à jour l'acteur
      if (editOffline && entityId) {
        // Mode édition offline : mettre à jour le payload existant
        await updateActor(
          entityId,
          actorData as unknown as Partial<ActorWithSync>,
          true
        );
      } else {
        // Mode création : créer un nouvel acteur
        await createActor(actorData as unknown as Omit<ActorWithSync, "id">);
      }

      // Réinitialiser le formulaire après succès
      resetForm();

      // Finaliser avec redirection
      handleFinish();
    } catch (error) {
      console.error("Erreur lors de la soumission:", error);
    }
  }, [
    isConfirmed,
    formData,
    createActor,
    updateActor,
    resetForm,
    handleFinish,
    editOffline,
    entityId,
  ]);

  // Boutons du footer
  const footerButtons = [
    <Button
      key="submit"
      type="button"
      onClick={handleSubmit}
      disabled={!isConfirmed || isLoading}
      className="flex items-center space-x-2"
    >
      <span>{editOffline ? t("buyer.editBuyer") : t("buyer.createBuyer")}</span>
    </Button>,
  ];

  // Header avec titre
  const headerContent = (
    <div className="flex items-center space-x-3">
      <h1 className="text-xl font-medium text-gray-900">
        {t("summary.title")}
      </h1>
    </div>
  );

  return (
    <BuyerFormLayout className="!max-w-4xl">
      <BaseCard
        title={headerContent}
        footer={footerButtons}
        className="w-full"
        classNameFooter="!justify-between"
      >
        {/* Alerte d'erreur de synchronisation */}
        {editOffline && entityId && (
          <SyncErrorAlert entityId={entityId} entityType="actor" />
        )}

        <Form {...form}>
          {/* Informations acheteur */}
          <div className="space-y-4">
            <DetailRow
              label={t("buyer.fields.familyName")}
              value={formData.step1?.familyName || ""}
              showChangeButton={true}
              changeHref="/actors/buyers/create"
            />
            <DetailRow
              label={t("buyer.fields.givenName")}
              value={formData.step1?.givenName || ""}
              showChangeButton={true}
              changeHref="/actors/buyers/create"
            />
            <DetailRow
              label={t("buyer.fields.gender")}
              value={
                formData.step1?.gender === "M"
                  ? t("options.genders.M")
                  : formData.step1?.gender === "F"
                  ? t("options.genders.F")
                  : ""
              }
              showChangeButton={true}
              changeHref="/actors/buyers/create"
            />
            <DetailRow
              label={t("buyer.fields.companyName")}
              value={formData.step1?.companyName || ""}
              showChangeButton={true}
              changeHref="/actors/buyers/create"
            />
            <DetailRow
              label={t("buyer.fields.email")}
              value={formData.step1?.email || ""}
              showChangeButton={true}
              changeHref="/actors/buyers/create"
            />
            <DetailRow
              label={t("buyer.fields.phone")}
              value={
                formData.step1?.phone
                  ? formatPhoneDisplay(formData.step1.phone)
                  : ""
              }
              showChangeButton={true}
              changeHref="/actors/buyers/create"
            />
            <DetailRow
              label={t("buyer.fields.locationCode")}
              value={
                <HierarchyDisplay code={formData.step1?.locationCode || ""} />
              }
              showChangeButton={true}
              changeHref="/actors/buyers/create"
            />
            <DetailRow
              label={t("buyer.fields.cniNumber")}
              value={formData.step1?.cniNumber || ""}
              showChangeButton={true}
              changeHref="/actors/buyers/create"
            />
            <DetailRow
              label={t("buyer.fields.onccId")}
              value={formData.step1?.onccId || ""}
              showChangeButton={true}
              changeHref="/actors/buyers/create"
            />
            <DetailRow
              label={t("buyer.fields.identifiantId")}
              value={formData.step1?.identifiantId || ""}
              showChangeButton={true}
              changeHref="/actors/buyers/create"
              noBorder={true}
            />

            {/* Pièces jointes */}
            <div className="">
              <Separator className="my-6" />
              <div className="flex items-center justify-between mb-4">
                <Heading as="h3" size="body">
                  {t("summary.attachmentsTitle")}
                </Heading>
                <Link
                  href="/actors/buyers/create/documents"
                  className="text-blue-600 hover:text-blue-700 p-0 h-auto font-normal text-sm"
                >
                  {t("summary.addAttachment")}
                </Link>
              </div>
              {(() => {
                const allDocuments = [
                  ...(formData.step2?.buyerDocuments || []),
                  ...(formData.step2?.landProofDocuments || []),
                  ...(formData.step2?.complementaryDocuments || []),
                ];

                return allDocuments.length > 0 ? (
                  <div className="space-y-2">
                    {allDocuments.map((doc, index) => (
                      <DocumentPreview key={index} document={doc} />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    {t("summary.noAttachments")}
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
                {t("summary.confirmCheckbox")}
              </label>
            </div>

            {!isConfirmed && (
              <p className="text-sm text-red-600 mt-2">
                {t("summary.confirmRequired")}
              </p>
            )}
          </div>
        </Form>
      </BaseCard>
    </BuyerFormLayout>
  );
}
