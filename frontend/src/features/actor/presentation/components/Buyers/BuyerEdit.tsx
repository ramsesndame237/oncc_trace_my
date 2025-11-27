"use client";

import { FormInput, FormPhoneInput, FormSelect } from "@/components/forms";
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
  createBuyerEditSchema,
  type BuyerEditData,
} from "../../schemas/buyer-validation-schemas";
import BuyerFormLayout from "./BuyerFormLayout";

interface MetadataRecord {
  metaKey: string;
  metaValue: string;
}

export default function BuyerEdit() {
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
  const validationSchema = createBuyerEditSchema(t);

  // Form setup
  const form = useForm<BuyerEditData>({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      familyName: "",
      givenName: "",
      gender: "",
      companyName: "",
      email: "",
      phone: "",
      locationCode: "",
      onccId: "",
      identifiantId: "",
      cniNumber: "",
      professionalCardNumber: "",
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
        router.push("/actors/buyers");
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
              gender: metadata.gender || "",
              companyName: metadata.companyName || "",
              email: (payload.email as string) || "",
              phone: (payload.phone as string) || "",
              locationCode: (payload.locationCode as string) || "",
              onccId: (payload.onccId as string) || "",
              identifiantId: (payload.identifiantId as string) || "",
              cniNumber: metadata.cniNumber || "",
              professionalCardNumber: metadata.professionalCardNumber || "",
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
              ?.metaValue || "";
          const companyName =
            metadata.find((r: MetadataRecord) => r.metaKey === "companyName")
              ?.metaValue || "";
          const cniNumber =
            metadata.find((r: MetadataRecord) => r.metaKey === "cniNumber")
              ?.metaValue || "";
          const professionalCardNumber =
            metadata.find(
              (r: MetadataRecord) => r.metaKey === "professionalCardNumber"
            )?.metaValue || "";

          // Pré-remplir le formulaire
          form.reset({
            familyName: actor.familyName || "",
            givenName: actor.givenName || "",
            gender,
            companyName,
            email: actor.email || "",
            phone: actor.phone || "",
            locationCode: actor.locationCode || "",
            onccId: actor.onccId || "",
            identifiantId: actor.identifiantId || "",
            cniNumber,
            professionalCardNumber,
          });
        }
      } catch (error) {
        console.error(t("buyer.errorLoadingActor"), error);
      }
    };

    loadActorData();
  }, [entityId, editOffline, fetchActorById, form, router, t]);

  const handleSubmit = useCallback(
    async (data: BuyerEditData) => {
      if (!entityId || isSaving) return;

      setIsSaving(true);
      try {
        // Préparer les métadonnées avec null pour les champs vides
        const metadata: Record<string, string | null> = {
          gender: data.gender || null,
          companyName: data.companyName || null,
          cniNumber: data.cniNumber || null,
          professionalCardNumber: data.professionalCardNumber || null,
        };

        // Préparer les données pour la mise à jour
        const updateData = {
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

        // Rediriger vers la page de visualisation
        if (editOffline) {
          router.push("/outbox");
        } else {
          router.push(`/actors/buyers/view?entityId=${entityId}`);
        }
      } catch (error) {
        console.error(t("buyer.errorUpdatingActor"), error);
      } finally {
        setIsSaving(false);
      }
    },
    [entityId, router, updateActor, isSaving, editOffline, t]
  );

  const handleCancel = useCallback(() => {
    if (!entityId) return;

    if (editOffline) {
      router.push("/outbox");
    } else {
      router.push(`/actors/buyers/view?entityId=${entityId}`);
    }
  }, [entityId, router, editOffline]);

  // Vérifier si le bouton enregistrer doit être activé
  const isSaveButtonEnabled = isValid && !isSaving;

  // Boutons du footer
  const footerButtons = [
    <Button
      key="submit"
      type="submit"
      form="buyer-edit-form"
      disabled={!isSaveButtonEnabled}
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
        {t("buyer.editBuyer")}
      </h1>
    </div>
  );

  if (!entityId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">{t("buyer.invalidId")}</p>
      </div>
    );
  }

  return (
    <BuyerFormLayout
      className="lg:flex items-start lg:space-x-4"
      title={t("buyer.editBuyerTitle")}
      onHandleCancel={handleCancel}
    >
      <div className="py-3">
        <Button variant="link" onClick={handleCancel}>
          <Icon name="ArrowLeft" />
          <span>{t("form.back")}</span>
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
            id="buyer-edit-form"
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-8"
          >
            {/* Nom */}
            <div className="lg:w-1/2">
              <FormInput
                form={form}
                name="familyName"
                label={t("buyer.fields.familyName")}
                required
              />
            </div>

            {/* Prénom */}
            <div className="lg:w-1/2">
              <FormInput
                form={form}
                name="givenName"
                label={t("buyer.fields.givenName")}
                required
              />
            </div>

            {/* Genre */}
            <div className="lg:w-1/2">
              <FormSelect
                form={form}
                name="gender"
                label={t("buyer.fields.gender")}
                options={genders}
                required
              />
            </div>

            {/* Raison sociale */}
            <div className="lg:w-1/2">
              <FormInput
                form={form}
                name="companyName"
                label={t("buyer.fields.companyName")}
                required
              />
            </div>

            <Separator />

            {/* Email */}
            <div className="lg:w-1/2">
              <FormInput
                form={form}
                name="email"
                label={t("buyer.fields.email")}
                type="email"
                required
              />
            </div>

            {/* Téléphone */}
            <div className="lg:w-1/2">
              <FormPhoneInput
                form={form}
                name="phone"
                label={t("buyer.fields.phone")}
                locale={currentLocale}
              />
            </div>

            <Separator />

            {/* Localisation */}
            <div className="lg:w-1/2">
              <LocationSelectorForm
                form={form}
                name="locationCode"
                label={t("buyer.fields.locationCode")}
                required
                onlyInProductionBasin
                isEditMode={!!form.watch("locationCode")}
              />
            </div>

            <Separator />

            {/* Numéro CNI */}
            <div className="lg:w-1/2">
              <FormInput
                form={form}
                name="cniNumber"
                label={t("buyer.fields.cniNumber")}
              />
            </div>

            {/* Numéro de carte professionnelle */}
            <div className="lg:w-1/2">
              <FormInput
                form={form}
                name="professionalCardNumber"
                label={t("buyer.fields.professionalCardNumber")}
              />
            </div>

            <Separator />

            {/* Code ONCC */}
            <div className="lg:w-1/2">
              <FormInput
                form={form}
                name="onccId"
                label={t("buyer.fields.onccId")}
              />
            </div>

            {/* Identifiant unique */}
            <div className="lg:w-1/2">
              <FormInput
                form={form}
                name="identifiantId"
                label={t("buyer.fields.identifiantId")}
              />
            </div>
          </form>
        </Form>
      </BaseCard>
    </BuyerFormLayout>
  );
}
