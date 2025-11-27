"use client";

import { FormCheckbox, FormInput, FormSelect } from "@/components/forms";
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
  createExporterEditSchema,
  type ExporterEditData,
} from "../../schemas/exporter-validation-schemas";
import ExportersFormLayout from "./ExportersFormLayout";

interface MetadataRecord {
  metaKey: string;
  metaValue: string;
}

export default function ExporterEdit() {
  const { t } = useTranslation(["actor", "common"]);
  const { currentLocale } = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const entityId = searchParams.get("entityId");
  const editOffline = searchParams.has("editOffline");
  useAuth(); // Ensure user is authenticated

  const { fetchActorById, updateActor } = useActorStore();

  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingOfflineData, setIsLoadingOfflineData] = useState(false);

  // Créer le schéma de validation
  const validationSchema = createExporterEditSchema(t);

  // Form setup
  const form = useForm<ExporterEditData>({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      familyName: "",
      givenName: "",
      onccId: "",
      identifiantId: "",
      locationCode: "",
      metadata: {
        professionalNumber: "",
        rccmNumber: "",
        exporterCode: "",
      },
      hasExistenceDeclaration: false,
      existenceDeclarationDate: "",
      existenceDeclarationCode: "",
      existenceDeclarationYears: undefined as "2" | "5" | undefined,
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
        router.push("/actors/exporters");
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

            // Pré-remplir le formulaire avec les données du payload
            form.reset({
              familyName: (payload.familyName as string) || "",
              givenName: (payload.givenName as string) || "",
              onccId: (payload.onccId as string) || "",
              identifiantId: (payload.identifiantId as string) || "",
              locationCode: (payload.locationCode as string) || "",
              metadata: {
                professionalNumber: metadata.professionalNumber || "",
                rccmNumber: metadata.rccmNumber || "",
                exporterCode: metadata.exporterCode || "",
              },
              hasExistenceDeclaration: !!payload.existenceDeclarationDate,
              existenceDeclarationDate:
                (payload.existenceDeclarationDate as string) || "",
              existenceDeclarationCode:
                (payload.existenceDeclarationCode as string) || "",
              existenceDeclarationYears:
                (String(payload.existenceDeclarationYears) as
                  | "2"
                  | "5"
                  | undefined) || undefined,
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

          const professionalNumber =
            metadata.find(
              (r: MetadataRecord) => r.metaKey === "professionalNumber"
            )?.metaValue || "";
          const rccmNumber =
            metadata.find((r: MetadataRecord) => r.metaKey === "rccmNumber")
              ?.metaValue || "";
          const exporterCode =
            metadata.find((r: MetadataRecord) => r.metaKey === "exporterCode")
              ?.metaValue || "";

          // Pré-remplir le formulaire
          form.reset({
            familyName: actor.familyName || "",
            givenName: actor.givenName || "",
            onccId: actor.onccId || "",
            identifiantId: actor.identifiantId || "",
            locationCode: actor.locationCode || "",
            metadata: {
              professionalNumber,
              rccmNumber,
              exporterCode,
            },
            hasExistenceDeclaration: !!(
              actor.existenceDeclarationDate || actor.existenceDeclarationCode
            ),
            existenceDeclarationDate: actor.existenceDeclarationDate || "",
            existenceDeclarationCode: actor.existenceDeclarationCode || "",
            existenceDeclarationYears:
              (String(actor.existenceDeclarationYears) as
                | "2"
                | "5"
                | undefined) || undefined,
          });
        }
      } catch (error) {
        console.error(t("exporter.errorLoadingActor"), error);
      }
    };

    loadActorData();
  }, [entityId, editOffline, fetchActorById, form, router, t]);

  const handleSubmit = useCallback(
    async (data: ExporterEditData) => {
      if (!entityId || isSaving) return;

      setIsSaving(true);
      try {
        // Préparer les métadonnées en envoyant toutes les clés, même vides (pour suppression)
        const metadata: Record<string, string | null> = {
          professionalNumber: data.metadata?.professionalNumber || null,
          rccmNumber: data.metadata?.rccmNumber || null,
          exporterCode: data.metadata?.exporterCode || null,
        };

        // Préparer les données de mise à jour
        const updateData = {
          actorType: "EXPORTER" as const,
          familyName: data.familyName,
          givenName: data.givenName,
          locationCode: data.locationCode,
          onccId: data.onccId,
          identifiantId: data.identifiantId,
          metadata,
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
            `/actors/exporters/view?entityId=${entityId}&editOffline`
          );
        } else {
          router.replace(`/actors/exporters/view?entityId=${entityId}`);
        }
      } catch (error) {
        console.error(t("exporter.errorUpdatingActor"), error);
      } finally {
        setIsSaving(false);
      }
    },
    [entityId, updateActor, router, isSaving, t, editOffline]
  );

  const handleCancel = useCallback(() => {
    router.push(`/actors/exporters/view?entityId=${entityId}`);
  }, [entityId, router]);

  // Boutons du footer
  const footerButtons = [
    <Button
      key="submit"
      type="submit"
      form="exporter-edit-form"
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
        {t("exporter.editExporter")}
      </h1>
    </div>
  );

  return (
    <ExportersFormLayout
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
            id="exporter-edit-form"
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-8"
          >
            {/* Nom */}
            <div className="lg:w-1/2">
              <FormInput
                form={form}
                name="familyName"
                label={t("exporter.fields.familyName")}
                required
              />
            </div>

            {/* Raison sociale */}
            <div className="lg:w-1/2">
              <FormInput
                form={form}
                name="givenName"
                label={t("exporter.fields.givenName")}
                required
              />
            </div>

            <Separator />

            {/* Localisation */}
            <div className="lg:w-1/2">
              <LocationSelectorForm
                form={form}
                name="locationCode"
                label={t("exporter.fields.locationCode")}
                required
                onlyInProductionBasin
                isEditMode={!!form.watch("locationCode")}
              />
            </div>

            <Separator />

            {/* Code ONCC */}
            <div className="lg:w-1/2">
              <FormInput
                form={form}
                name="onccId"
                label={t("exporter.fields.onccId")}
              />
            </div>

            {/* Identifiant unique */}
            <div className="lg:w-1/2">
              <FormInput
                form={form}
                name="identifiantId"
                label={t("exporter.fields.identifiantId")}
              />
            </div>

            <Separator />

            {/* Numéro professionnel */}
            <div className="lg:w-1/2">
              <FormInput
                form={form}
                name="metadata.professionalNumber"
                label={t("exporter.fields.professionalNumber")}
              />
            </div>

            {/* Numéro RCCM */}
            <div className="lg:w-1/2">
              <FormInput
                form={form}
                name="metadata.rccmNumber"
                label={t("exporter.fields.rccmNumber")}
              />
            </div>

            {/* Code exportateur */}
            <div className="lg:w-1/2">
              <FormInput
                form={form}
                name="metadata.exporterCode"
                label={t("exporter.fields.exporterCode")}
              />
            </div>

            <Separator />

            {/* Déclaration d'existence */}
            <div className="space-y-4">
              <FormCheckbox
                form={form}
                name="hasExistenceDeclaration"
                label={t("exporter.fields.hasExistenceDeclaration")}
              />

              {hasExistenceDeclaration && (
                <div className="space-y-8 pl-6">
                  {/* Date de déclaration */}
                  <div className="lg:w-1/2">
                    <FormDatePicker
                      form={form}
                      name="existenceDeclarationDate"
                      label={t("exporter.fields.existenceDeclarationDate")}
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
                      label={t("exporter.fields.existenceDeclarationCode")}
                      required
                    />
                  </div>

                  {/* Nombre d'années */}
                  <div className="lg:w-1/2">
                    <FormSelect
                      form={form}
                      name="existenceDeclarationYears"
                      label={t("exporter.fields.existenceDeclarationYears")}
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
          </form>
        </Form>
      </BaseCard>
    </ExportersFormLayout>
  );
}
