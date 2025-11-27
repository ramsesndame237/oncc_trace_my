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
import { useSearchParams } from "next/navigation";
import React, { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useProducersFormStore } from "../../../infrastructure/store/producersFormStore";
import { useProducersFormNavigation } from "../../hooks/useProducersFormNavigation";
import {
  createStep1OPAInfoSchemaWithConditional,
  type Step1OPAInfoData,
} from "../../schemas/producers-validation-schemas";
import ProducersFormLayout from "./ProducersFormLayout";

export default function ProducersEditStep1() {
  const { t } = useTranslation(["actor", "common"]);
  const searchParams = useSearchParams();
  const entityId = searchParams.get("entityId");
  const editOffline = searchParams.has("editOffline");

  const { user } = useAuth();
  const { currentLocale } = useLocale();
  const {
    formData,
    updateStep1Data,
    setStepValidation,
    setCurrentStep,
    saveProgress,
  } = useProducersFormStore();

  const { navigateToNext, handleCancel } = useProducersFormNavigation();
  const [isNavigating, setIsNavigating] = useState(false);
  const [isLoadingOfflineData, setIsLoadingOfflineData] = useState(false);

  // Réinitialiser isNavigating quand le composant est monté (après PinGuard par exemple)
  useEffect(() => {
    setIsNavigating(false);
  }, []);

  // Form setup
  const form = useForm({
    resolver: zodResolver(createStep1OPAInfoSchemaWithConditional(t)),
    defaultValues: {
      familyName: formData.step1?.familyName || "",
      givenName: formData.step1?.givenName || "",
      locationCode: formData.step1?.locationCode || "",
      onccId: formData.step1?.onccId || "",
      identifiantId: formData.step1?.identifiantId || "",
      metadata: {
        headquartersAddress:
          formData.step1?.metadata?.headquartersAddress || "",
        creationDate: formData.step1?.metadata?.creationDate || "",
        cobgetReference: formData.step1?.metadata?.cobgetReference || "",
      },
      hasExistenceDeclaration: formData.step1?.hasExistenceDeclaration || false,
      existenceDeclarationDate: formData.step1?.existenceDeclarationDate || "",
      existenceDeclarationCode: formData.step1?.existenceDeclarationCode || "",
      existenceDeclarationYears:
        (String(formData.step1?.existenceDeclarationYears) as
          | "2"
          | "5"
          | undefined) || undefined,
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
            const step1Data: Step1OPAInfoData = {
              familyName: (payload.familyName as string) || "",
              givenName: (payload.givenName as string) || "",
              locationCode: (payload.locationCode as string) || "",
              onccId: (payload.onccId as string) || "",
              identifiantId: (payload.identifiantId as string) || "",
              metadata: {
                headquartersAddress:
                  (metadata.headquartersAddress as string) || "",
                creationDate: (metadata.creationDate as string) || "",
                cobgetReference: (metadata.cobgetReference as string) || "",
              },
              hasExistenceDeclaration: Boolean(
                payload.existenceDeclarationDate
              ),
              existenceDeclarationDate:
                (payload.existenceDeclarationDate as string) || "",
              existenceDeclarationCode:
                (payload.existenceDeclarationCode as string) || "",
              existenceDeclarationYears: payload.existenceDeclarationYears as
                | "2"
                | "5"
                | undefined,
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

  const hasExistenceDeclaration = form.watch("hasExistenceDeclaration");
  const { isValid } = form.formState;

  React.useEffect(() => {
    setCurrentStep(1);
  }, [setCurrentStep]);

  // Réinitialiser les champs de déclaration d'existence quand la checkbox est décochée
  React.useEffect(() => {
    if (!hasExistenceDeclaration) {
      form.setValue("existenceDeclarationDate", "");
      form.setValue("existenceDeclarationCode", "");
      form.setValue("existenceDeclarationYears", undefined);
    }
  }, [hasExistenceDeclaration, form]);

  // Observer les changements de données
  useEffect(() => {
    const subscription = form.watch((data) => {
      updateStep1Data(data as Step1OPAInfoData);
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
        {t("producers.sections.opaInfo")}
      </h1>
    </div>
  );

  return (
    <ProducersFormLayout className="lg:flex items-start lg:space-x-4">
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
          <form className="space-y-8" id="opa-step1-form">
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
                isEditMode={!!formData.step1.locationCode}
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

            <Separator />

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
          </form>
        </Form>
      </BaseCard>
    </ProducersFormLayout>
  );
}
