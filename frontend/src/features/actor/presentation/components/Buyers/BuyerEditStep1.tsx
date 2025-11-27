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
import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams } from "next/navigation";
import React, { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useBuyerFormStore } from "../../../infrastructure/store/buyerFormStore";
import { useBuyerFormNavigation } from "../../hooks/useBuyerFormNavigation";
import {
  createStep1BuyerInfoSchema,
  type Step1BuyerInfoData,
} from "../../schemas/buyer-validation-schemas";
import BuyerFormLayout from "./BuyerFormLayout";

export default function BuyerEditStep1() {
  const { t } = useTranslation(["actor", "common"]);
  const searchParams = useSearchParams();
  const entityId = searchParams.get("entityId");
  const editOffline = searchParams.has("editOffline");

  const {
    formData,
    updateStep1Data,
    setStepValidation,
    setCurrentStep,
    saveProgress,
  } = useBuyerFormStore();

  const { navigateToNext, handleCancel } = useBuyerFormNavigation();
  const [isNavigating, setIsNavigating] = useState(false);
  const [isLoadingOfflineData, setIsLoadingOfflineData] = useState(false);

  // Réinitialiser isNavigating quand le composant est monté (après PinGuard par exemple)
  useEffect(() => {
    setIsNavigating(false);
  }, []);

  // Form setup
  const form = useForm({
    resolver: zodResolver(createStep1BuyerInfoSchema(t)),
    defaultValues: {
      familyName: formData.step1?.familyName || "",
      givenName: formData.step1?.givenName || "",
      email: formData.step1?.email || "",
      phone: formData.step1?.phone || "",
      locationCode: formData.step1?.locationCode || "",
      onccId: formData.step1?.onccId || "",
      identifiantId: formData.step1?.identifiantId || "",
      gender: formData.step1?.gender || ("" as "M" | "F"),
      companyName: formData.step1?.companyName || "",
      cniNumber: formData.step1?.cniNumber || "",
      professionalCardNumber: formData.step1?.professionalCardNumber || "",
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
            const step1Data: Step1BuyerInfoData = {
              familyName: (payload.familyName as string) || "",
              givenName: (payload.givenName as string) || "",
              email: (payload.email as string) || "",
              phone: (payload.phone as string) || "",
              locationCode: (payload.locationCode as string) || "",
              onccId: (payload.onccId as string) || "",
              identifiantId: (payload.identifiantId as string) || "",
              gender: (metadata.gender as "M" | "F") || ("" as "M" | "F"),
              companyName: (metadata.companyName as string) || "",
              cniNumber: (metadata.cniNumber as string) || "",
              professionalCardNumber:
                (metadata.professionalCardNumber as string) || "",
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
      updateStep1Data(data as Step1BuyerInfoData);
      saveProgress(); // Auto-save
    });
    return () => subscription.unsubscribe();
  }, [form, updateStep1Data, saveProgress]);

  // Observer la validation
  useEffect(() => {
    setStepValidation(1, isValid);
  }, [isValid, setStepValidation]);

  const handleNext = useCallback(async () => {
    const isValid = await form.trigger();
    if (isValid && !isNavigating) {
      setIsNavigating(true);
      navigateToNext();
    }
  }, [form, isNavigating, navigateToNext]);

  // Boutons du footer
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

  // Header avec titre
  const headerContent = (
    <div className="flex items-center space-x-3">
      <h1 className="text-xl font-medium text-gray-900">
        {t("buyer.sections.buyerInfo")}
      </h1>
    </div>
  );

  // Options de genre
  const genderOptions = [
    { value: "M", label: t("options.genders.M") },
    { value: "F", label: t("options.genders.F") },
  ];

  return (
    <BuyerFormLayout className="lg:flex items-start lg:space-x-4">
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
          <form className="space-y-8" id="buyer-step1-form">
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
                options={genderOptions}
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
                isEditMode={!!formData.step1.locationCode}
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
