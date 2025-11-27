"use client";

import { Icon } from "@/components/icon";
import { BaseCard } from "@/components/modules/base-card";
import { DetailRow } from "@/components/modules/detail-row";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Form } from "@/components/ui/form";
import { db } from "@/core/infrastructure/database/db";
import { useCalendarStore } from "@/features/calendar/infrastructure/store/calendarStore";
import { usePickupAddFormStore } from "@/features/calendar/infrastructure/store/pickupAddFormStore";
import { usePickupAddFormNavigation } from "@/features/calendar/presentation/hooks/usePickupAddFormNavigation";
import {
  createStep2Schema,
  type Step2Data,
} from "@/features/calendar/presentation/schemas/pickup-validation-schemas";
import { HierarchyDisplay } from "@/features/location/presentation/components";
import { useDayjsLocale } from "@/hooks/useDayjsLocale";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { PickupFormLayout } from "../PickupFormLayout";

export function PickupAddStep2() {
  const { t } = useTranslation(["calendar", "common"]);
  const dayjs = useDayjsLocale();

  const { createCalendar, updateCalendar } = useCalendarStore();

  const {
    formData,
    updateStep2Data,
    setStepValidation,
    setCurrentStep,
    saveProgress,
    resetForm,
    isSubmitting,
    setSubmitting,
    entityId,
    editOffline,
  } = usePickupAddFormStore();

  // Utiliser le hook de navigation
  const { handleFinish } = usePickupAddFormNavigation();

  // State pour stocker les noms OPA et convention
  const [opaName, setOpaName] = useState<string>("");
  const [conventionName, setConventionName] = useState<string>("");
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Form setup
  const form = useForm<Step2Data>({
    resolver: zodResolver(createStep2Schema(t)),
    defaultValues: {
      confirmed: false,
    },
    mode: "onChange",
    criteriaMode: "firstError",
    shouldFocusError: true,
  });

  const { isValid } = form.formState;
  const isConfirmed = form.watch("confirmed");

  // Extraire les données du Step 1
  const { opaId, conventionId, startDate, endDate, locationCode, location, eventTime } =
    formData.step1;

  React.useEffect(() => {
    setCurrentStep(2);
    // Forcer la confirmation à false à chaque fois qu'on arrive sur cette étape
    form.setValue("confirmed", false);
  }, [setCurrentStep, form]);

  // Charger les noms OPA et convention depuis IndexedDB
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoadingData(true);

        // ✅ Charger le nom de l'OPA
        if (opaId) {
          const opa = await db.actors
            .where("serverId")
            .equals(opaId)
            .or("localId")
            .equals(opaId)
            .first();

          if (opa) {
            setOpaName(`${opa.familyName} ${opa.givenName}`.trim());
          }
        }

        // ✅ Charger la convention directement depuis db.conventions
        if (conventionId) {
          const convention = await db.conventions
            .where("serverId")
            .equals(conventionId)
            .or("localId")
            .equals(conventionId)
            .first();

          if (convention) {
            setConventionName(`${convention.code} - ${convention.signatureDate}`);
          }
        }
      } catch {
        // Silently fail - data loading is not critical
      } finally {
        setIsLoadingData(false);
      }
    };

    loadData();
  }, [opaId, conventionId]);

  // Observer les changements de données
  useEffect(() => {
    const subscription = form.watch((data) => {
      updateStep2Data(data as Step2Data);
      saveProgress();
    });
    return () => subscription.unsubscribe();
  }, [form, updateStep2Data, saveProgress]);

  // Observer la validation
  useEffect(() => {
    setStepValidation("step2", isValid);
  }, [isValid, setStepValidation]);

  const handleSubmit = useCallback(async () => {
    if (!isConfirmed) return;

    try {
      setSubmitting(true);

      // Préparer les données à soumettre
      const calendarData = {
        type: "ENLEVEMENT" as const,
        opaId,
        conventionId,
        startDate,
        endDate,
        locationCode,
        location,
        eventTime: eventTime || undefined,
      };

      // Détecter le mode : édition (online ou offline) ou création
      if (entityId) {
        // Mode édition
        await updateCalendar(entityId, calendarData, editOffline);
      } else {
        // Mode création
        await createCalendar(calendarData);
      }

      // Réinitialiser le formulaire après succès
      resetForm();

      // Utiliser handleFinish pour la redirection (gère automatiquement editOffline)
      handleFinish();
    } catch {
      // Le store gère déjà l'affichage de l'erreur
    } finally {
      setSubmitting(false);
    }
  }, [
    isConfirmed,
    setSubmitting,
    editOffline,
    entityId,
    opaId,
    conventionId,
    startDate,
    endDate,
    locationCode,
    location,
    eventTime,
    createCalendar,
    updateCalendar,
    resetForm,
    handleFinish,
  ]);

  // URL de redirection vers l'étape 1 (toutes les données sont dans step1)
  const changeHref = "/calendars/pickup/create/informations";

  // Header content
  const headerContent = (
    <div className="flex items-center space-x-3">
      <h1 className="text-xl font-medium text-gray-900">
        {t("calendar:forms.pickupAdd.step2.pickupInformation")}
      </h1>
    </div>
  );

  // Footer buttons (uniquement le bouton de soumission, pas de "Previous")
  const footerButtons = [
    <Button
      key="submit"
      type="button"
      onClick={handleSubmit}
      disabled={!isConfirmed || isSubmitting}
    >
      {isSubmitting ? (
        <>
          <Icon name="Loader2" className="animate-spin" />
          {t("common:messages.saving")}
        </>
      ) : (
        <>
          {entityId
            ? t("calendar:actions.saveChanges")
            : t("common:actions.save")}
          <Icon name="Check" />
        </>
      )}
    </Button>,
  ];

  return (
    <PickupFormLayout title={t("calendar:forms.pickupAdd.step2.title")}>
      <BaseCard title={headerContent} footer={footerButtons} className="w-full">
        <Form {...form}>
          <div className="space-y-4">
            <DetailRow
              label={t("calendar:forms.pickupAdd.step1.opa")}
              value={
                isLoadingData ? t("common:messages.loading") : opaName || "-"
              }
              showChangeButton={true}
              changeHref={changeHref}
            />

            <DetailRow
              label={t("calendar:forms.pickupAdd.step1.convention")}
              value={
                isLoadingData ? t("common:messages.loading") : conventionName || "-"
              }
              showChangeButton={true}
              changeHref={changeHref}
            />

            <DetailRow
              label={t("calendar:forms.pickupAdd.step1.startDate")}
              value={startDate ? dayjs(startDate).format("LL") : "-"}
              showChangeButton={true}
              changeHref={changeHref}
            />

            <DetailRow
              label={t("calendar:forms.pickupAdd.step1.endDate")}
              value={endDate ? dayjs(endDate).format("LL") : "-"}
              showChangeButton={true}
              changeHref={changeHref}
            />

            <DetailRow
              label={t("calendar:forms.pickupAdd.step1.eventTime")}
              value={eventTime || "-"}
              showChangeButton={true}
              changeHref={changeHref}
            />

            <DetailRow
              label={t("calendar:forms.pickupAdd.step1.locationCode")}
              value={
                locationCode ? <HierarchyDisplay code={locationCode} /> : "-"
              }
              showChangeButton={true}
              changeHref={changeHref}
            />

            <DetailRow
              label={t("calendar:forms.pickupAdd.step1.location")}
              value={location || "-"}
              showChangeButton={true}
              changeHref={changeHref}
              noBorder={true}
            />

            {/* Confirmation */}
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
                  {t("calendar:forms.pickupAdd.step2.confirmMessage")}
                </label>
              </div>

              {!isConfirmed && (
                <p className="text-sm text-red-600 mt-2">
                  {t("calendar:forms.pickupAdd.step2.confirmRequired")}
                </p>
              )}
            </div>
          </div>
        </Form>
      </BaseCard>
    </PickupFormLayout>
  );
}
