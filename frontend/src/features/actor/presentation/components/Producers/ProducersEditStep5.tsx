"use client";

import { DocumentPreview } from "@/components/documents";
import { Icon } from "@/components/icon";
import { BaseCard } from "@/components/modules/base-card";
import { DetailRow } from "@/components/modules/detail-row";
import { Heading } from "@/components/modules/heading";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Form } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { db, type OfflineActorData } from "@/core/infrastructure/database/db";
import { HierarchyDisplay } from "@/features/location/presentation/components";
import { blobToBase64 } from "@/lib/blobToBase64";
import { dayjs } from "@/lib/dayjs";
import { showError, showSuccess } from "@/lib/notifications/toast";
import { formatPhoneDisplay } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import type { ActorWithSync } from "../../../domain/actor.types";
import { useActorStore } from "../../../infrastructure/store/actorStore";
import { useProducersFormStore } from "../../../infrastructure/store/producersFormStore";
import { useProducersFormNavigation } from "../../hooks/useProducersFormNavigation";
import {
  createStep5SummarySchema,
  type Step5SummaryData,
} from "../../schemas/producers-validation-schemas";
import ProducersFormLayout from "./ProducersFormLayout";

export default function ProducersEditStep5() {
  const { t } = useTranslation(["actor", "common"]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const entityId = searchParams.get("entityId");
  const editOffline = searchParams.has("editOffline");

  const { formData, setCurrentStep, resetForm } = useProducersFormStore();
  const { createActor, updateActor } = useActorStore();
  const { handleCancel } = useProducersFormNavigation();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedProducers, setSelectedProducers] = useState<
    OfflineActorData[]
  >([]);
  const [isLoadingProducers, setIsLoadingProducers] = useState(true);

  // Form setup
  const form = useForm<Step5SummaryData>({
    resolver: zodResolver(createStep5SummarySchema(t)),
    defaultValues: {
      confirmed: false, // Toujours false pour forcer la confirmation
    },
    mode: "onChange",
  });

  const isConfirmed = form.watch("confirmed");

  useEffect(() => {
    setCurrentStep(5);
    // Forcer la confirmation à false à chaque fois qu'on arrive sur cette étape
    form.setValue("confirmed", false);
  }, [setCurrentStep, form]);

  // Charger les producteurs sélectionnés depuis IndexedDB
  useEffect(() => {
    const loadSelectedProducers = async () => {
      setIsLoadingProducers(true);
      try {
        const selectedIds = formData.step3.selectedProducerIds || [];
        if (selectedIds.length === 0) {
          setSelectedProducers([]);
          setIsLoadingProducers(false);
          return;
        }

        // Récupérer tous les producteurs depuis IndexedDB
        const allProducers = await db.actors
          .where("actorType")
          .equals("PRODUCER")
          .toArray();

        // Filtrer les producteurs sélectionnés
        const producers = allProducers.filter((producer) => {
          const producerId = producer.serverId || producer.localId;
          return producerId && selectedIds.includes(producerId);
        });

        setSelectedProducers(producers);
      } catch (error) {
        console.error("Erreur lors du chargement des producteurs:", error);
        setSelectedProducers([]);
      } finally {
        setIsLoadingProducers(false);
      }
    };

    loadSelectedProducers();
  }, [formData.step3.selectedProducerIds]);

  const handleSubmit = useCallback(async () => {
    if (!isConfirmed || isSubmitting) return;

    setIsSubmitting(true);

    try {
      // Préparer les documents
      const allDocuments = [
        ...(formData.step4.opaDocuments || []),
        ...(formData.step4.landProofDocuments || []),
        ...(formData.step4.complementaryDocuments || []),
      ];

      // ⭐ Conversion Blob → base64 au moment de l'upload
      const documents = await Promise.all(
        allDocuments.map(async (doc) => {
          // Si doc.data est un Blob, le convertir en base64
          // Sinon, c'est déjà une string base64 (document existant ou ancien format)
          const base64Data =
            doc.data instanceof Blob ? await blobToBase64(doc.data) : doc.data;

          return {
            base64Data,
            mimeType: doc.type,
            fileName: doc.name || "document",
            documentType: (doc.optionValues && doc.optionValues[1]) || "",
          };
        })
      );

      // Préparer les producteurs sélectionnés pour la création
      const producers =
        formData.step3.selectedProducerIds?.map((producerId) => ({
          producerId,
          membershipDate: undefined, // Optionnel - peut être ajouté plus tard
          status: "active" as const,
        })) || [];

      // Préparer les données pour la création de l'OPA
      const opaData = {
        actorType: "PRODUCERS" as const, // Backend attend "PRODUCERS" pour les OPA
        familyName: formData.step1.familyName,
        givenName: formData.step1.givenName,
        locationCode: formData.step1.locationCode,
        phone: formData.step2.phone || undefined, // Phone du manager (optionnel)
        email: formData.step2.email || undefined, // Email du manager (optionnel)
        onccId: formData.step1.onccId || undefined,
        identifiantId: formData.step1.identifiantId || undefined,
        metadata: formData.step1.metadata || {},
        existenceDeclarationDate: formData.step1.hasExistenceDeclaration
          ? formData.step1.existenceDeclarationDate
          : undefined,
        existenceDeclarationCode: formData.step1.hasExistenceDeclaration
          ? formData.step1.existenceDeclarationCode
          : undefined,
        existenceDeclarationYears: formData.step1.hasExistenceDeclaration
          ? Number(formData.step1.existenceDeclarationYears)
          : undefined,
        managerInfo: {
          nom: formData.step2.nom,
          prenom: formData.step2.prenom,
          phone: formData.step2.phone || undefined,
          email: formData.step2.email,
        },
        documents, // Documents convertis en base64
        producers, // Ajouter les producteurs sélectionnés
      };

      // Créer ou mettre à jour l'OPA
      if (editOffline && entityId) {
        // Mode édition offline : mettre à jour le payload existant
        await updateActor(
          entityId,
          opaData as unknown as Partial<ActorWithSync>,
          true
        );
        showSuccess(t("producers.messages.updatedSuccess"));
      } else {
        // Mode création : créer un nouvel OPA
        await createActor(opaData as unknown as Omit<ActorWithSync, "id">);
        showSuccess(t("producers.messages.createdSuccess"));
      }

      // Réinitialiser le formulaire
      resetForm();

      // Rediriger vers la liste des OPAs
      router.push("/actors/producers");
    } catch (error) {
      console.error("Erreur lors de la création de l'OPA:", error);
      showError(t("producers.messages.createdError"));
    } finally {
      setIsSubmitting(false);
    }
  }, [isConfirmed, isSubmitting, formData, createActor, updateActor, editOffline, entityId, resetForm, router, t]);

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
          ? t("producers.summary.creating")
          : t("producers.summary.submit")}
      </span>
    </Button>,
  ];

  // Header avec titre
  const headerContent = (
    <div className="flex items-center space-x-3">
      <h1 className="text-xl font-medium text-gray-900">
        {t("producers.summary.title")}
      </h1>
    </div>
  );

  return (
    <ProducersFormLayout className="!max-w-4xl" onHandleCancel={handleCancel}>
      <BaseCard
        title={headerContent}
        footer={footerButtons}
        className="w-full"
        classNameFooter="!justify-between"
      >
        <Form {...form}>
          {/* Section 1 : Informations OPA (step1) */}
          <div className="space-y-4">
            <DetailRow
              label={t("producers.fields.familyName")}
              value={formData.step1.familyName || ""}
              showChangeButton={true}
              changeHref="/actors/producers/create"
            />
            <DetailRow
              label={t("producers.fields.givenName")}
              value={formData.step1.givenName || ""}
              showChangeButton={true}
              changeHref="/actors/producers/create"
            />
            <DetailRow
              label={t("producers.fields.locationCode")}
              value={
                <HierarchyDisplay code={formData.step1.locationCode || ""} />
              }
              showChangeButton={true}
              changeHref="/actors/producers/create"
            />
            <DetailRow
              label={t("producers.fields.onccId")}
              value={formData.step1.onccId || "-"}
              showChangeButton={true}
              changeHref="/actors/producers/create"
            />
            <DetailRow
              label={t("producers.fields.identifiantId")}
              value={formData.step1.identifiantId || "-"}
              showChangeButton={true}
              changeHref="/actors/producers/create"
            />

            {/* Métadonnées */}
            {formData.step1.metadata?.headquartersAddress && (
              <DetailRow
                label={t("producers.fields.headquartersAddress")}
                value={formData.step1.metadata.headquartersAddress}
                showChangeButton={true}
                changeHref="/actors/producers/create"
              />
            )}

            <DetailRow
              label={t("producers.fields.creationDate")}
              value={
                formData.step1.metadata?.creationDate
                  ? dayjs(formData.step1.metadata.creationDate).format(
                      "DD/MM/YYYY"
                    )
                  : "-"
              }
              showChangeButton={true}
              changeHref="/actors/producers/create"
            />

            <DetailRow
              label={t("producers.fields.cobgetReference")}
              value={formData.step1.metadata?.cobgetReference || "-"}
              showChangeButton={true}
              changeHref="/actors/producers/create"
            />

            {/* Déclaration d'existence */}
            {formData.step1.hasExistenceDeclaration && (
              <>
                <DetailRow
                  label={t("producers.fields.existenceDeclarationDate")}
                  value={
                    formData.step1.existenceDeclarationDate
                      ? dayjs(formData.step1.existenceDeclarationDate).format(
                          "DD/MM/YYYY"
                        )
                      : ""
                  }
                  showChangeButton={true}
                  changeHref="/actors/producers/create"
                />
                <DetailRow
                  label={t("producers.fields.existenceDeclarationCode")}
                  value={formData.step1.existenceDeclarationCode || ""}
                  showChangeButton={true}
                  changeHref="/actors/producers/create"
                />
                <DetailRow
                  label={t("producers.fields.existenceDeclarationYears")}
                  value={
                    formData.step1.existenceDeclarationYears
                      ? `${formData.step1.existenceDeclarationYears} ${t(
                          "common:units.years"
                        )}`
                      : ""
                  }
                  showChangeButton={true}
                  changeHref="/actors/producers/create"
                />
              </>
            )}
          </div>

          {/* Separator */}
          <Separator className="my-6" />

          {/* Section 2 : Informations Manager (step2) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Heading as="h3" size="body">
                {t("producers.summary.managerInfo")}
              </Heading>
              <Link
                href="/actors/producers/create/step-2-manager"
                className="text-blue-600 hover:text-blue-700 p-0 h-auto font-normal text-sm"
              >
                {t("common:actions.change")}
              </Link>
            </div>

            <DetailRow
              label={t("producers.fields.managerLastName")}
              value={formData.step2.nom || ""}
            />
            <DetailRow
              label={t("producers.fields.managerFirstName")}
              value={formData.step2.prenom || ""}
            />
            <DetailRow
              label={t("common:fields.phone")}
              value={
                (formData.step2.phone &&
                  formatPhoneDisplay(formData.step2.phone)) ||
                ""
              }
            />
            <DetailRow
              label={t("common:fields.email")}
              value={formData.step2.email || ""}
              noBorder={true}
            />
          </div>

          {/* Separator */}
          <Separator className="my-6" />

          {/* Section 3 : Producteurs Membres (step3) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <Heading as="h3" size="body">
                {t("producers.summary.membersTitle", {
                  count: formData.step3.selectedProducerIds?.length || 0,
                })}
              </Heading>
              <Link
                href="/actors/producers/create/step-3-members"
                className="text-blue-600 hover:text-blue-700 p-0 h-auto font-normal text-sm"
              >
                {t("common:actions.change")}
              </Link>
            </div>

            {isLoadingProducers ? (
              <div className="text-center py-4">
                <Icon
                  name="Loader2"
                  className="h-8 w-8 text-gray-400 mx-auto mb-2 animate-spin"
                />
                <p className="text-sm text-muted-foreground">
                  {t("form.loadingData")}
                </p>
              </div>
            ) : selectedProducers.length === 0 ? (
              <p className="text-sm text-gray-500">
                {t("producers.summary.membersCount", { count: 0 })}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("producersTable.columns.fullName")}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("producersTable.columns.onccId")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedProducers.map((producer, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            <Icon
                              name="UserIcon"
                              className="h-4 w-4 text-gray-400 mr-2"
                            />
                            <span className="text-sm font-medium text-gray-900">
                              {producer.familyName} {producer.givenName}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-sm text-gray-500">
                            {producer.onccId || "-"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Separator */}
          <Separator className="my-6" />

          {/* Section 4 : Documents (step4) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <Heading as="h3" size="body">
                {t("producers.summary.documentsInfo")}
              </Heading>
              <Link
                href="/actors/producers/create/step-4-documents"
                className="text-blue-600 hover:text-blue-700 p-0 h-auto font-normal text-sm"
              >
                {t("summary.addAttachment")}
              </Link>
            </div>

            {(() => {
              const allDocuments = [
                ...(formData.step4.opaDocuments || []),
                ...(formData.step4.landProofDocuments || []),
                ...(formData.step4.complementaryDocuments || []),
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

          {/* Confirmation en bas */}
          <div className="mt-8 mb-6">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="confirmed"
                checked={form.watch("confirmed")}
                onCheckedChange={(checked) =>
                  form.setValue("confirmed", checked as boolean)
                }
                disabled={isSubmitting}
              />
              <label
                htmlFor="confirmed"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {t("producers.summary.confirmation")}
              </label>
            </div>

            {!isConfirmed && (
              <p className="text-sm text-red-600 mt-2">
                {t("producers.summary.confirmationRequired")}
              </p>
            )}
          </div>
        </Form>
      </BaseCard>
    </ProducersFormLayout>
  );
}
