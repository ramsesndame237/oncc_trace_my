"use client";

import {
  FormCheckbox,
  FormInput,
  FormPhoneInput,
  FormSelect,
} from "@/components/forms";
import FormDatePicker from "@/components/forms/form-date-picker";
import { Icon } from "@/components/icon";
import { BaseCard } from "@/components/modules/base-card";
import { SyncErrorAlert } from "@/components/modules/sync-error-alert";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { db } from "@/core/infrastructure/database/db";
import { useAuth } from "@/features/auth";
import { LocationSelectorForm } from "@/features/location/presentation/components/forms/LocationSelectorForm";
import { useLocale } from "@/hooks/useLocale";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useActorStore } from "../../../infrastructure/store/actorStore";
import {
  createOPAEditSchema,
  type OPAEditData,
} from "../../schemas/producers-validation-schemas";
import ProducersFormLayout from "./ProducersFormLayout";

interface MetadataRecord {
  metaKey: string;
  metaValue: string;
}

export default function ProducersEdit() {
  const { t } = useTranslation(["actor", "common"]);
  const { currentLocale } = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const entityId = searchParams.get("entityId");
  const editOffline = searchParams.has("editOffline");
  const { user } = useAuth();

  const { fetchActorById, updateActor } = useActorStore();

  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingOfflineData, setIsLoadingOfflineData] = useState(false);

  // Créer le schéma de validation
  const validationSchema = createOPAEditSchema(t);

  // Form setup
  const form = useForm<OPAEditData>({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      familyName: "",
      givenName: "",
      onccId: "",
      identifiantId: "",
      locationCode: "",
      metadata: {
        headquartersAddress: "",
        creationDate: "",
        cobgetReference: "",
      },
      hasExistenceDeclaration: false,
      existenceDeclarationDate: "",
      existenceDeclarationCode: "",
      existenceDeclarationYears: undefined as "2" | "5" | undefined,
      managerInfo: {
        nom: "",
        prenom: "",
        phone: "",
        email: "",
      },
    },
    mode: "onChange",
    criteriaMode: "firstError",
    shouldFocusError: true,
  });

  const { isValid } = form.formState;

  // Watcher pour hasExistenceDeclaration
  const hasExistenceDeclaration = form.watch("hasExistenceDeclaration");

  // Charger les données de l'acteur (online ou offline)
  useEffect(() => {
    const loadActorData = async () => {
      if (!entityId) {
        router.push("/actors/producers");
        return;
      }

      // Si en mode editOffline, charger depuis pendingOperations
      if (editOffline) {
        setIsLoadingOfflineData(true);
        try {
          const pendingOperation = await db.pendingOperations
            .where("entityId")
            .equals(entityId)
            .first();

          if (pendingOperation && pendingOperation.payload) {
            const payload = pendingOperation.payload as Record<string, unknown>;
            const metadata = (payload.metadata as Record<string, string>) || {};
            const managerInfo = payload.managerInfo as
              | Record<string, string>
              | undefined;

            // Pré-remplir le formulaire avec les données du payload
            form.reset({
              familyName: (payload.familyName as string) || "",
              givenName: (payload.givenName as string) || "",
              onccId: (payload.onccId as string) || "",
              identifiantId: (payload.identifiantId as string) || "",
              locationCode: (payload.locationCode as string) || "",
              metadata: {
                headquartersAddress: metadata.headquartersAddress || "",
                creationDate: metadata.creationDate || "",
                cobgetReference: metadata.cobgetReference || "",
              },
              hasExistenceDeclaration: !!metadata.existenceDeclarationDate,
              existenceDeclarationDate: metadata.existenceDeclarationDate || "",
              existenceDeclarationCode: metadata.existenceDeclarationCode || "",
              existenceDeclarationYears: (metadata.existenceDeclarationYears ||
                undefined) as "2" | "5" | undefined,
              managerInfo: managerInfo
                ? {
                    nom: managerInfo.nom || "",
                    prenom: managerInfo.prenom || "",
                    phone: managerInfo.phone || "",
                    email: managerInfo.email || "",
                  }
                : undefined,
            });
          }
        } catch (error) {
          console.error(
            "Erreur lors du chargement des données offline:",
            error
          );
        } finally {
          setIsLoadingOfflineData(false);
        }
        return;
      }

      // Mode online : charger depuis l'API
      try {
        const actor = await fetchActorById(entityId);

        if (actor) {
          // Récupérer les métadonnées
          const metadata = Array.isArray(actor.metadata)
            ? actor.metadata
            : actor.metadata
            ? Object.entries(actor.metadata).map(([key, value]) => ({
                metaKey: key,
                metaValue: value,
              }))
            : [];

          const headquartersAddress =
            metadata.find(
              (r: MetadataRecord) => r.metaKey === "headquartersAddress"
            )?.metaValue || "";
          const creationDate =
            metadata.find((r: MetadataRecord) => r.metaKey === "creationDate")
              ?.metaValue || "";
          const cobgetReference =
            metadata.find(
              (r: MetadataRecord) => r.metaKey === "cobgetReference"
            )?.metaValue || "";

          // Récupérer les informations du manager depuis managerInfo
          const managerInfo = actor.managerInfo;

          // Pré-remplir le formulaire
          form.reset({
            familyName: actor.familyName || "",
            givenName: actor.givenName || "",
            onccId: actor.onccId || "",
            identifiantId: actor.identifiantId || "",
            locationCode: actor.locationCode || "",
            metadata: {
              headquartersAddress,
              creationDate,
              cobgetReference,
            },
            hasExistenceDeclaration: !!actor.existenceDeclarationDate,
            existenceDeclarationDate: actor.existenceDeclarationDate || "",
            existenceDeclarationCode: actor.existenceDeclarationCode || "",
            existenceDeclarationYears:
              (String(actor.existenceDeclarationYears) as
                | "2"
                | "5"
                | undefined) || undefined,
            managerInfo: managerInfo
              ? {
                  nom: managerInfo.nom || "",
                  prenom: managerInfo.prenom || "",
                  phone: managerInfo.phone || "",
                  email: managerInfo.email || "",
                }
              : undefined,
          });
        }
      } catch (error) {
        console.error(t("producers.errorLoadingActor"), error);
      }
    };

    loadActorData();
  }, [entityId, editOffline, fetchActorById, form, router, t]);

  const handleSubmit = useCallback(
    async (data: OPAEditData) => {
      if (!entityId || isSaving) return;

      setIsSaving(true);
      try {
        // Préparer les métadonnées en envoyant toutes les clés, même vides (pour suppression)
        const metadata: Record<string, string | null> = {
          headquartersAddress: data.metadata?.headquartersAddress || null,
          creationDate: data.metadata?.creationDate || null,
          cobgetReference: data.metadata?.cobgetReference || null,
        };

        // Préparer les données de mise à jour
        const updateData = {
          actorType: "PRODUCERS" as const,
          familyName: data.familyName,
          givenName: data.givenName,
          locationCode: data.locationCode,
          onccId: data.onccId,
          identifiantId: data.identifiantId,
          metadata,
          managerInfo: data.managerInfo,
          // Ajouter les champs de déclaration d'existence directement (pas dans metadata)
          // Si hasExistenceDeclaration est false, envoyer null pour vider les champs
          existenceDeclarationDate: data.hasExistenceDeclaration
            ? data.existenceDeclarationDate || null
            : null,
          existenceDeclarationCode: data.hasExistenceDeclaration
            ? data.existenceDeclarationCode || null
            : null,
          existenceDeclarationYears: data.hasExistenceDeclaration
            ? data.existenceDeclarationYears
              ? parseInt(data.existenceDeclarationYears)
              : null
            : null,
        };

        await updateActor(entityId, updateData, editOffline);

        // Rediriger vers la page de détails
        if (editOffline) {
          router.replace(
            `/actors/producers/view?entityId=${entityId}&editOffline`
          );
        } else {
          router.replace(`/actors/producers/view?entityId=${entityId}`);
        }
      } catch (error) {
        console.error(t("producers.errorUpdatingActor"), error);
      } finally {
        setIsSaving(false);
      }
    },
    [entityId, updateActor, router, isSaving, t, editOffline]
  );

  const handleCancel = useCallback(() => {
    router.push(`/actors/producers/view?entityId=${entityId}`);
  }, [entityId, router]);

  // Boutons du footer
  const footerButtons = [
    <Button
      key="submit"
      type="submit"
      form="opa-edit-form"
      disabled={!isValid || isSaving}
      className="flex items-center space-x-2"
    >
      <>
        <span>
          {isSaving ? t("common:messages.saving") : t("common:actions.edit")}
        </span>
      </>
    </Button>,
  ];

  // Header avec titre
  const headerContent = (
    <div className="flex items-center space-x-3">
      <h1 className="text-xl font-medium text-gray-900">
        {t("producers.editOPA")}
      </h1>
    </div>
  );

  return (
    <ProducersFormLayout
      className="lg:flex items-start lg:space-x-4"
      onHandleCancel={handleCancel}
    >
      <div className="py-3">
        <Button variant="link" onClick={handleCancel}>
          <Icon name="ArrowLeft" />
          <span>{t("common:actions.back")}</span>
        </Button>
      </div>
      <BaseCard
        title={headerContent}
        footer={footerButtons}
        className="w-full flex-1"
      >
        {/* Alerte d'erreur de synchronisation */}
        {editOffline && entityId && (
          <SyncErrorAlert entityId={entityId} entityType="actor" />
        )}

        {isLoadingOfflineData && (
          <div className="p-4 text-center text-muted-foreground">
            {t("form.loadingData")}
          </div>
        )}

        <Form {...form}>
          <form
            id="opa-edit-form"
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-8"
          >
            {/* Nom */}
            <div className="lg:w-1/2">
              <FormInput
                form={form}
                name="familyName"
                label={t("producers.fields.familyName")}
                required
              />
            </div>

            {/* Raison sociale */}
            <div className="lg:w-1/2">
              <FormInput
                form={form}
                name="givenName"
                label={t("producers.fields.givenName")}
                required
              />
            </div>

            {/* Siège social */}
            <div className="lg:w-1/2">
              <FormInput
                form={form}
                name="metadata.headquartersAddress"
                label={t("producers.fields.headquartersAddress")}
              />
            </div>

            {/* Date de création */}
            <div className="lg:w-1/2">
              <FormDatePicker
                form={form}
                name="metadata.creationDate"
                label={t("producers.fields.creationDate")}
                placeholder=""
                typeCalendar="v2"
                locale={currentLocale}
              />
            </div>

            <Separator />

            {/* Localisation */}
            <div className="lg:w-1/2">
              <LocationSelectorForm
                form={form}
                name="locationCode"
                label={t("producers.fields.locationCode")}
                required
                onlyInProductionBasin
                productionBasinId={user?.productionBasin?.id}
                isEditMode={!!form.watch("locationCode")}
              />
            </div>

            <Separator />

            {/* Code ONCC */}
            <div className="lg:w-1/2">
              <FormInput
                form={form}
                name="onccId"
                label={t("producers.fields.onccId")}
              />
            </div>

            {/* Identifiant unique */}
            <div className="lg:w-1/2">
              <FormInput
                form={form}
                name="identifiantId"
                label={t("producers.fields.identifiantId")}
              />
            </div>

            {/* Référence COBGET */}
            <div className="lg:w-1/2">
              <FormInput
                form={form}
                name="metadata.cobgetReference"
                label={t("producers.fields.cobgetReference")}
              />
            </div>

            <Separator />

            {/* Déclaration d'existence */}
            <div className="space-y-4">
              <FormCheckbox
                form={form}
                name="hasExistenceDeclaration"
                label={t("producers.fields.hasExistenceDeclaration")}
              />

              {hasExistenceDeclaration && (
                <div className="space-y-8 pl-6">
                  {/* Date de déclaration */}
                  <div className="lg:w-1/2">
                    <FormDatePicker
                      form={form}
                      name="existenceDeclarationDate"
                      label={t("producers.fields.existenceDeclarationDate")}
                      required
                      placeholder=""
                      typeCalendar="v2"
                      locale={currentLocale}
                    />
                  </div>

                  {/* Code de déclaration */}
                  <div className="lg:w-1/2">
                    <FormInput
                      form={form}
                      name="existenceDeclarationCode"
                      label={t("producers.fields.existenceDeclarationCode")}
                      required
                    />
                  </div>

                  {/* Nombre d'années */}
                  <div className="lg:w-1/2">
                    <FormSelect
                      form={form}
                      name="existenceDeclarationYears"
                      label={t("producers.fields.existenceDeclarationYears")}
                      options={[
                        { label: `2 ${t("common:units.years")}`, value: "2" },
                        { label: `5 ${t("common:units.years")}`, value: "5" },
                      ]}
                      required
                    />
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Section Gestionnaire */}
            <div className="space-y-2">
              <h2 className="text-lg font-medium text-gray-900">
                {t("producers.sections.manager")}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t("producers.descriptions.managerInfo")}
              </p>
            </div>

            {/* Nom du gérant */}
            <div className="lg:w-1/2">
              <FormInput
                form={form}
                name="managerInfo.nom"
                label={t("producers.fields.managerLastName")}
                required
              />
            </div>

            {/* Prénom du gérant */}
            <div className="lg:w-1/2">
              <FormInput
                form={form}
                name="managerInfo.prenom"
                label={t("producers.fields.managerFirstName")}
                required
              />
            </div>

            {/* Email du gérant */}
            <div className="lg:w-1/2">
              <FormInput
                form={form}
                name="managerInfo.email"
                label={t("producers.fields.managerEmail")}
                type="email"
                required
              />
            </div>

            {/* Téléphone du gérant */}
            <div className="lg:w-1/2">
              <FormPhoneInput
                form={form}
                name="managerInfo.phone"
                label={t("producers.fields.managerPhone")}
              />
            </div>
          </form>
        </Form>
      </BaseCard>
    </ProducersFormLayout>
  );
}
