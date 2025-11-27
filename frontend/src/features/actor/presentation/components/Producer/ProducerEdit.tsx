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
import { LocationSelectorForm } from "@/features/location/presentation/components/forms/LocationSelectorForm";
import { useLocale } from "@/hooks/useLocale";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useActorStore } from "../../../infrastructure/store/actorStore";
import { useActorOptions } from "../../hooks/useActorOptions";
import {
  createStep1ProducerInfoSchema,
  type Step1ProducerInfoData,
} from "../../schemas/producer-validation-schemas";
import ProducerFormLayout from "./ProducerFormLayout";

interface MetadataRecord {
  metaKey: string;
  metaValue: string;
}

export default function ProducerEdit() {
  const { t } = useTranslation(["actor", "common"]);
  const { currentLocale } = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const entityId = searchParams.get("entityId");
  const editOffline = searchParams.has("editOffline");

  const { fetchActorById, updateActor } = useActorStore();
  const { genders } = useActorOptions();

  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingOfflineData, setIsLoadingOfflineData] = useState(false);

  // Créer le schéma de validation
  const validationSchema = createStep1ProducerInfoSchema(t);

  // Form setup
  const form = useForm({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      familyName: "",
      givenName: "",
      email: "",
      phone: "",
      locationCode: "",
      onccId: "",
      identifiantId: "",
      gender: "M" as const,
      birthDate: "",
      birthPlace: "",
      cniNumber: "",
      sustainabilityProgram: false,
    },
    mode: "onChange",
    criteriaMode: "firstError",
    shouldFocusError: true,
  });

  const { isValid } = form.formState;

  // Charger les données de l'acteur (online ou offline)
  useEffect(() => {
    const loadActorData = async () => {
      if (!entityId) {
        router.push("/actors/producer");
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
              email: (payload.email as string) || "",
              phone: (payload.phone as string) || "",
              locationCode: (payload.locationCode as string) || "",
              onccId: (payload.onccId as string) || "",
              identifiantId: (payload.identifiantId as string) || "",
              gender: (metadata.gender as "M" | "F") || "M",
              birthDate: metadata.birthDate || "",
              birthPlace: metadata.birthPlace || "",
              cniNumber: metadata.cniNumber || "",
              sustainabilityProgram: metadata.sustainabilityProgram === "true",
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

          const gender =
            metadata.find((r: MetadataRecord) => r.metaKey === "gender")
              ?.metaValue || "M";
          const birthDate =
            metadata.find((r: MetadataRecord) => r.metaKey === "birthDate")
              ?.metaValue || "";
          const birthPlace =
            metadata.find((r: MetadataRecord) => r.metaKey === "birthPlace")
              ?.metaValue || "";
          const cniNumber =
            metadata.find((r: MetadataRecord) => r.metaKey === "cniNumber")
              ?.metaValue || "";
          const sustainabilityProgram =
            metadata.find(
              (r: MetadataRecord) => r.metaKey === "sustainabilityProgram"
            )?.metaValue === "true";

          // Pré-remplir le formulaire
          form.reset({
            familyName: actor.familyName || "",
            givenName: actor.givenName || "",
            email: actor.email || "",
            phone: actor.phone || "",
            locationCode: actor.locationCode || "",
            onccId: actor.onccId || "",
            identifiantId: actor.identifiantId || "",
            gender: gender as "M" | "F",
            birthDate,
            birthPlace,
            cniNumber,
            sustainabilityProgram,
          });
        }
      } catch (error) {
        console.error(t("producer.errorLoadingActor"), error);
      }
    };

    loadActorData();
  }, [entityId, editOffline, fetchActorById, form, router, t]);

  const handleSubmit = useCallback(
    async (data: Step1ProducerInfoData) => {
      if (!entityId || isSaving) return;

      setIsSaving(true);
      try {
        // Préparer les métadonnées en envoyant toutes les clés, même vides (pour suppression)
        const metadata: Record<string, string | null> = {
          gender: data.gender || null,
          birthDate: data.birthDate || null,
          birthPlace: data.birthPlace || null,
          sustainabilityProgram: data.sustainabilityProgram?.toString() || null,
          cniNumber: data.cniNumber || null,
        };

        // Préparer les données de mise à jour
        const updateData = {
          actorType: "PRODUCER" as const,
          familyName: data.familyName,
          givenName: data.givenName,
          email: data.email,
          phone: data.phone,
          locationCode: data.locationCode,
          onccId: data.onccId,
          identifiantId: data.identifiantId,
          metadata,
        };

        await updateActor(entityId, updateData, editOffline);

        // Rediriger vers la page de détails
        if (editOffline) {
          router.replace(
            `/actors/producer/view?entityId=${entityId}&editOffline`
          );
        } else {
          router.replace(`/actors/producer/view?entityId=${entityId}`);
        }
      } catch (error) {
        console.error(t("producer.errorUpdatingActor"), error);
      } finally {
        setIsSaving(false);
      }
    },
    [entityId, updateActor, router, isSaving, t, editOffline]
  );

  const handleCancel = useCallback(() => {
    router.push(`/actors/producer/view?entityId=${entityId}`);
  }, [entityId, router]);

  // Boutons du footer
  const footerButtons = [
    <Button
      key="submit"
      type="submit"
      form="producer-edit-form"
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
        {t("producer.editProducerTitle")}
      </h1>
    </div>
  );

  return (
    <ProducerFormLayout
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
            id="producer-edit-form"
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-8"
          >
            {/* Nom de famille */}
            <div className="lg:w-1/2">
              <FormInput
                form={form}
                name="familyName"
                label={t("form.familyName")}
                required
              />
            </div>

            {/* Prénom */}
            <div className="lg:w-1/2">
              <FormInput
                form={form}
                name="givenName"
                label={t("form.givenName")}
                required
              />
            </div>

            {/* Genre */}
            <div className="lg:w-1/2">
              <FormSelect
                form={form}
                name="gender"
                label={t("form.gender")}
                options={genders}
                required
              />
            </div>

            {/* Date de naissance */}
            <div className="lg:w-1/2">
              <FormDatePicker
                form={form}
                name="birthDate"
                label={t("form.birthDate")}
                required
                placeholder=""
                typeCalendar="v2"
                locale={currentLocale}
              />
            </div>

            {/* Lieu de naissance */}
            <div className="lg:w-1/2">
              <FormInput
                form={form}
                name="birthPlace"
                label={t("form.birthPlace")}
                required
              />
            </div>

            <Separator />

            {/* Localisation */}
            <div className="lg:w-1/2">
              <LocationSelectorForm
                form={form}
                name="locationCode"
                label={t("form.locationCode")}
                required
                onlyInProductionBasin
                isEditMode={!!form.watch("locationCode")}
              />
            </div>

            <Separator />

            {/* Email */}
            <div className="lg:w-1/2">
              <FormInput
                form={form}
                name="email"
                label={t("common:fields.email")}
                type="email"
                required
              />
            </div>

            {/* Téléphone */}
            <div className="lg:w-1/2">
              <FormPhoneInput
                form={form}
                name="phone"
                label={t("common:fields.phone")}
              />
            </div>

            {/* Numéro CNI */}
            <div className="lg:w-1/2">
              <FormInput
                form={form}
                name="cniNumber"
                label={t("form.cniNumber")}
              />
            </div>

            {/* Code ONCC */}
            <div className="lg:w-1/2">
              <FormInput form={form} name="onccId" label={t("form.onccId")} />
            </div>

            {/* Code d'identification unique */}
            <div className="lg:w-1/2">
              <FormInput
                form={form}
                name="identifiantId"
                label={t("form.identifiantId")}
              />
            </div>

            {/* Programme de durabilité */}
            <div className="">
              <FormCheckbox
                form={form}
                name="sustainabilityProgram"
                label={t("form.sustainabilityProgram")}
              />
            </div>
          </form>
        </Form>
      </BaseCard>
    </ProducerFormLayout>
  );
}
