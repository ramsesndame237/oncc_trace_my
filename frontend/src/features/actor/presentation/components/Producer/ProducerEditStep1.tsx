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
import React, { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useProducerFormStore } from "../../../infrastructure/store/producerFormStore";
import { useActorOptions } from "../../hooks/useActorOptions";
import { useProducerFormNavigation } from "../../hooks/useProducerFormNavigation";
import {
  createStep1ProducerInfoSchema,
  type Step1ProducerInfoData,
} from "../../schemas/producer-validation-schemas";
import ProducerFormLayout from "./ProducerFormLayout";

export default function ProducerEditStep1() {
  const { t } = useTranslation(["actor", "common"]);
  const { currentLocale } = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const entityId = searchParams.get("entityId");
  const editOffline = searchParams.has("editOffline");

  const {
    formData,
    updateStep1Data,
    setStepValidation,
    setCurrentStep,
    saveProgress,
  } = useProducerFormStore();

  const { navigateToNext } = useProducerFormNavigation();
  const { genders } = useActorOptions();
  const [isNavigating, setIsNavigating] = useState(false);
  const [isLoadingOfflineData, setIsLoadingOfflineData] = useState(false);
  const { user } = useAuth();

  // Réinitialiser isNavigating quand le composant est monté (après PinGuard par exemple)
  useEffect(() => {
    setIsNavigating(false);
  }, []);

  // Form setup
  const form = useForm({
    resolver: zodResolver(createStep1ProducerInfoSchema(t)),
    defaultValues: {
      familyName: formData.step1?.familyName || "",
      givenName: formData.step1?.givenName || "",
      email: formData.step1?.email || "",
      phone: formData.step1?.phone || "",
      locationCode: formData.step1?.locationCode || "",
      onccId: formData.step1?.onccId || "",
      identifiantId: formData.step1?.identifiantId || "",
      gender: formData.step1?.gender || "M",
      birthDate: formData.step1?.birthDate || "",
      birthPlace: formData.step1?.birthPlace || "",
      cniNumber: formData.step1?.cniNumber || "",
      sustainabilityProgram: formData.step1?.sustainabilityProgram || false,
    },
    mode: "onChange",
    criteriaMode: "firstError",
    shouldFocusError: true,
  });

  // Charger les données depuis pendingOperations si en mode offline
  useEffect(() => {
    const loadOfflineData = async () => {
      if (entityId && editOffline) {
        setIsLoadingOfflineData(true);
        try {
          const pendingOperation = await db.pendingOperations
            .where("entityId")
            .equals(entityId)
            .first();

          if (pendingOperation && pendingOperation.payload) {
            const payload = pendingOperation.payload as Record<string, unknown>;
            const metadata =
              (payload.metadata as Record<string, unknown>) || {};

            // Pré-remplir le formulaire avec les données du payload
            const step1Data: Step1ProducerInfoData = {
              familyName: (payload.familyName as string) || "",
              givenName: (payload.givenName as string) || "",
              email: (payload.email as string) || "",
              phone: (payload.phone as string) || "",
              locationCode: (payload.locationCode as string) || "",
              onccId: (payload.onccId as string) || "",
              identifiantId: (payload.identifiantId as string) || "",
              gender: (payload.gender as string) === "F" ? "F" : "M",
              birthDate: (metadata.birthDate as string) || "",
              birthPlace: (metadata.birthPlace as string) || "",
              cniNumber: (metadata.cniNumber as string) || "",
              sustainabilityProgram:
                (metadata.sustainabilityProgram as string) === "false"
                  ? false
                  : true || false,
            };

            // Mettre à jour le store
            updateStep1Data(step1Data);

            // Réinitialiser le formulaire avec les nouvelles données
            form.reset(step1Data);
          }
        } catch (error) {
          console.error(
            "Erreur lors du chargement des données offline:",
            error
          );
        } finally {
          setIsLoadingOfflineData(false);
        }
      }
    };

    loadOfflineData();
  }, [entityId, editOffline, form, updateStep1Data]);

  const { isValid } = form.formState;

  React.useEffect(() => {
    setCurrentStep(1);
  }, [setCurrentStep]);

  // Observer les changements de données
  useEffect(() => {
    const subscription = form.watch((data) => {
      updateStep1Data(data as Step1ProducerInfoData);
      saveProgress(); // Auto-save
    });
    return () => subscription.unsubscribe();
  }, [form, updateStep1Data, saveProgress]);

  // Observer la validation
  useEffect(() => {
    setStepValidation(1, form.formState.isValid);
  }, [form, setStepValidation]);

  const handleNext = useCallback(async () => {
    const isValid = await form.trigger();
    if (isValid && !isNavigating) {
      setIsNavigating(true);
      navigateToNext(1, editOffline, entityId || undefined);
    }
  }, [form, navigateToNext, isNavigating, editOffline, entityId]);

  // Boutons du footer - uniquement le bouton Suivant pour la création
  const footerButtons = [
    <Button
      key="next"
      type="button"
      onClick={handleNext}
      disabled={!isValid || isNavigating}
      className="flex items-center space-x-2"
    >
      <span>{t("common:actions.next")}</span>
    </Button>,
  ];

  // Handler pour le bouton Retour
  const handleBack = () => {
    if (editOffline) {
      // En mode édition offline, retourner à l'outbox
      router.push("/outbox");
    } else {
      // En mode création normale, retourner à la page de choix
      router.push("/actors/producer/choice");
    }
  };

  // Header avec titre
  const headerContent = (
    <div className="flex items-center space-x-3">
      <h1 className="text-xl font-medium text-gray-900">
        {t("form.producerDetails")}
      </h1>
    </div>
  );

  return (
    <ProducerFormLayout className="lg:flex items-start lg:space-x-4">
      <div className="py-3">
        <Button variant="link" onClick={handleBack}>
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
          <form className="space-y-8" id="producer-step1-form">
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
                productionBasinId={user?.productionBasin?.id}
                isEditMode={!!formData.step1.locationCode}
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
              />
            </div>

            {/* Téléphone */}
            <div className="lg:w-1/2">
              <FormPhoneInput
                form={form}
                name="phone"
                label={t("common:fields.phone")}
                required
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

            {/* Code ONCC */}
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
