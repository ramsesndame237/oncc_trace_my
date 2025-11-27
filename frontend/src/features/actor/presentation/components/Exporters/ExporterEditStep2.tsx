"use client";

import { FormInput, FormPhoneInput } from "@/components/forms";
import { Icon } from "@/components/icon";
import { BaseCard } from "@/components/modules/base-card";
import { SyncErrorAlert } from "@/components/modules/sync-error-alert";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { db } from "@/core/infrastructure/database/db";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams } from "next/navigation";
import React, { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useExporterFormStore } from "../../../infrastructure/store/exporterFormStore";
import { useExporterFormNavigation } from "../../hooks/useExporterFormNavigation";
import {
  createStep2ManagerInfoSchema,
  type Step2ManagerInfoData,
} from "../../schemas/exporter-validation-schemas";
import ExportersFormLayout from "./ExportersFormLayout";

export default function ExporterEditStep2() {
  const { t } = useTranslation(["actor", "common"]);
  const searchParams = useSearchParams();
  const entityId = searchParams.get("entityId");
  const editOffline = searchParams.has("editOffline");

  const {
    formData,
    updateStep2Data,
    setStepValidation,
    setCurrentStep,
    saveProgress,
  } = useExporterFormStore();

  const { navigateToNext, navigateToPrevious } =
    useExporterFormNavigation();
  const [isNavigating, setIsNavigating] = useState(false);
  const [isLoadingOfflineData, setIsLoadingOfflineData] = useState(false);

  // Réinitialiser isNavigating quand le composant est monté (après PinGuard par exemple)
  useEffect(() => {
    setIsNavigating(false);
  }, []);

  // Form setup
  const form = useForm({
    resolver: zodResolver(createStep2ManagerInfoSchema(t)),
    defaultValues: {
      nom: formData.step2?.nom || "",
      prenom: formData.step2?.prenom || "",
      phone: formData.step2?.phone || "",
      email: formData.step2?.email || "",
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
            const managerInfo = (payload.managerInfo as Record<string, unknown>) || {};

            // Pré-remplir le formulaire avec les données du payload
            const step2Data: Step2ManagerInfoData = {
              nom: (managerInfo.nom as string) || "",
              prenom: (managerInfo.prenom as string) || "",
              phone: (managerInfo.phone as string) || "",
              email: (managerInfo.email as string) || "",
            };

            // Mettre à jour le store
            updateStep2Data(step2Data);

            // Réinitialiser le formulaire avec les nouvelles données
            form.reset(step2Data);
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
  }, [entityId, editOffline, form, updateStep2Data]);

  const { isValid } = form.formState;

  React.useEffect(() => {
    setCurrentStep(2);
  }, [setCurrentStep]);

  // Observer les changements de données
  useEffect(() => {
    const subscription = form.watch((data) => {
      updateStep2Data(data as Step2ManagerInfoData);
      saveProgress(); // Auto-save
    });
    return () => subscription.unsubscribe();
  }, [form, updateStep2Data, saveProgress]);

  // Observer la validation
  useEffect(() => {
    setStepValidation(2, isValid);
  }, [isValid, setStepValidation]);

  const handleNext = useCallback(async () => {
    const isValid = await form.trigger();
    if (isValid && !isNavigating) {
      setIsNavigating(true);
      navigateToNext();
    }
  }, [form, isNavigating, navigateToNext]);

  const handlePrevious = useCallback(() => {
    navigateToPrevious();
  }, [navigateToPrevious]);

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

  // Header avec titre et description
  const headerContent = (
    <div className="space-y-2">
      <h1 className="text-xl font-medium text-gray-900">
        {t("exporter.sections.manager")}
      </h1>
    </div>
  );

  return (
    <ExportersFormLayout className="lg:flex items-start lg:space-x-4">
      <div className="py-3">
        <Button variant="link" onClick={handlePrevious}>
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
          <form className="space-y-8" id="exporter-step2-form">
            {/* Nom du gérant */}
            <div className="lg:w-1/2">
              <FormInput
                form={form}
                name="nom"
                label={t("exporter.fields.managerLastName")}
                required
              />
            </div>

            {/* Prénom du gérant */}
            <div className="lg:w-1/2">
              <FormInput
                form={form}
                name="prenom"
                label={t("exporter.fields.managerFirstName")}
                required
              />
            </div>

            {/* Email du gérant */}
            <div className="lg:w-1/2">
              <FormInput
                form={form}
                name="email"
                label={t("exporter.fields.managerEmail")}
                type="email"
                required
              />
            </div>

            {/* Téléphone du gérant */}
            <div className="lg:w-1/2">
              <FormPhoneInput
                form={form}
                name="phone"
                label={t("exporter.fields.managerPhone")}
              />
            </div>
          </form>
        </Form>
      </BaseCard>
    </ExportersFormLayout>
  );
}
