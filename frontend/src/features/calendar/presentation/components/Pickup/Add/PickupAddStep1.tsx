"use client";

import { FormDatePicker, FormInput, FormTimePicker } from "@/components/forms";
import FormInputAutocompletion from "@/components/forms/form-input-autocompletion";
import { Icon } from "@/components/icon";
import { BaseCard } from "@/components/modules/base-card";
import { LoadingFallback } from "@/components/modules/loading-fallback";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { USER_ROLES_CONSTANTS } from "@/core/domain/generated/user-roles.types";
import { db } from "@/core/infrastructure/database/db";
import { useAuth } from "@/features/auth";
import { LocationSelectorForm } from "@/features/location/presentation/components/forms/LocationSelectorForm";
import { useLocale } from "@/hooks/useLocale";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { usePickupAddFormStore } from "../../../../infrastructure/store/pickupAddFormStore";
import { useGetCalendarById } from "../../../hooks/useGetCalendarById";
import { usePickupAddFormNavigation } from "../../../hooks/usePickupAddFormNavigation";
import {
  createStep1Schema,
  type Step1Data,
} from "../../../schemas/pickup-validation-schemas";
import { PickupFormLayout } from "../PickupFormLayout";

export function PickupAddStep1() {
  const { t } = useTranslation(["calendar", "common"]);
  const { currentLocale } = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const {
    formData,
    updateStep1Data,
    setCurrentStep,
    setStepValidation,
    saveProgress,
    entityId: storeEntityId,
    editOffline: storeEditOffline,
    initializeForm,
  } = usePickupAddFormStore();

  const { navigateToNext, handleCancel } = usePickupAddFormNavigation();
  const [isNavigating, setIsNavigating] = useState(false);

  // Réinitialiser isNavigating quand le composant est monté (après PinGuard par exemple)
  useEffect(() => {
    setIsNavigating(false);
  }, []);

  // Détection du mode édition depuis les query params
  const entityIdFromParams = searchParams.get("entityId");
  const entityId = entityIdFromParams || storeEntityId;
  const editOffline = storeEditOffline;

  // Hook pour charger les données du calendrier existant (uniquement en mode édition online)
  const {
    calendar: existingCalendar,
    isLoading: isLoadingCalendar,
    error: calendarError,
  } = useGetCalendarById(entityId && !editOffline ? entityId : "");

  // States pour les options
  const [opaOptions, setOpaOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [conventionOptions, setConventionOptions] = useState<
    Array<{ value: string; label: string; isActive?: boolean }>
  >([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Form setup
  const form = useForm<Step1Data>({
    resolver: zodResolver(createStep1Schema(t)),
    defaultValues: formData.step1,
    mode: "onChange",
    criteriaMode: "firstError",
    shouldFocusError: true,
  });

  const { isValid } = form.formState;

  // Surveiller la date de début pour mettre à jour les contraintes de la date de fin
  const watchedStartDate = form.watch("startDate");
  // Surveiller l'OPA sélectionné pour charger ses conventions
  const watchedOpaId = form.watch("opaId");

  // Ref pour stocker la valeur précédente de startDate (détection de changement réel)
  const previousStartDateRef = useRef<string>("");

  // Fonction utilitaire pour parser une date string en fuseau local
  const parseLocalDate = (dateString: string): Date => {
    const [year, month, day] = dateString.split("-").map(Number);
    return new Date(year, month - 1, day); // month-1 car les mois sont 0-indexés
  };

  // Calculer la date minimum pour la date de fin
  const getMinDateForEnd = (): Date => {
    if (watchedStartDate) {
      const startDate = parseLocalDate(watchedStartDate);
      return new Date(startDate.getTime() + 24 * 60 * 60 * 1000); // Jour suivant
    }
    return new Date(); // Par défaut, aujourd'hui
  };

  // Calculer la date maximum pour la date de fin (1 an après la date de début)
  const getMaxDateForEnd = (): Date => {
    if (watchedStartDate) {
      const startDate = parseLocalDate(watchedStartDate);
      // Ajouter 365 jours à la date de début
      return new Date(startDate.getTime() + 365 * 24 * 60 * 60 * 1000);
    }
    return new Date(2030, 11, 31); // Par défaut, date maximum générale
  };

  // Réinitialiser la date de fin quand la date de début change
  useEffect(() => {
    // Si startDate a changé par rapport à la valeur précédente
    if (watchedStartDate && watchedStartDate !== previousStartDateRef.current) {
      // Si ce n'est pas le premier montage (previousStartDateRef.current !== "")
      if (previousStartDateRef.current !== "") {
        // Reset la date de fin
        form.setValue("endDate", "", {
          shouldValidate: true,
          shouldDirty: false,
        });
        form.trigger("endDate");
      }

      // Mettre à jour la référence avec la nouvelle valeur
      previousStartDateRef.current = watchedStartDate;
    }

    // Si startDate est vide (reset du formulaire), reset aussi la référence
    if (!watchedStartDate) {
      previousStartDateRef.current = "";
    }
  }, [watchedStartDate, form]);

  // Initialiser l'étape courante et le mode édition
  useEffect(() => {
    setCurrentStep(1);
    if (entityIdFromParams) {
      initializeForm(entityIdFromParams, editOffline);
    }
  }, [setCurrentStep, entityIdFromParams, editOffline, initializeForm]);

  // Charger les données du calendrier existant en mode online
  useEffect(() => {
    if (existingCalendar && !editOffline) {
      const mappedData: Step1Data = {
        opaId: existingCalendar.opaId || "",
        conventionId: existingCalendar.conventionId || "",
        startDate: existingCalendar.startDate || "",
        endDate: existingCalendar.endDate || "",
        locationCode: existingCalendar.locationCode || "",
        location: existingCalendar.location || "",
        eventTime: existingCalendar.eventTime || "",
      };

      // Pré-remplir le formulaire
      form.reset(mappedData);
      // Mettre à jour le store
      updateStep1Data(mappedData);
    }
  }, [existingCalendar, editOffline, form, updateStep1Data]);

  // Charger les données offline si en mode editOffline
  useEffect(() => {
    const loadOfflineData = async () => {
      if (!entityId || !editOffline) return;

      try {
        const pendingOperation = await db.pendingOperations
          .where("entityId")
          .equals(entityId)
          .first();

        if (pendingOperation && pendingOperation.payload) {
          const payload = pendingOperation.payload as Record<string, unknown>;

          // Pré-remplir le formulaire avec les données du payload
          const offlineData: Step1Data = {
            opaId: (payload.opaId as string) || "",
            conventionId: (payload.conventionId as string) || "",
            startDate: (payload.startDate as string) || "",
            endDate: (payload.endDate as string) || "",
            locationCode: (payload.locationCode as string) || "",
            location: (payload.location as string) || "",
            eventTime: (payload.eventTime as string) || "",
          };

          form.reset(offlineData);
          updateStep1Data(offlineData);
        }
      } catch {
        // Silently fail - offline data loading is not critical
      }
    };

    loadOfflineData();
  }, [entityId, editOffline, form, updateStep1Data]);

  // Auto-save
  useEffect(() => {
    const subscription = form.watch((data) => {
      updateStep1Data(data as Step1Data);
      saveProgress();
    });
    return () => subscription.unsubscribe();
  }, [form, updateStep1Data, saveProgress]);

  // Observer la validation
  useEffect(() => {
    setStepValidation("step1", isValid);
  }, [isValid, setStepValidation]);

  // Charger la campagne en cours et les OPAs
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoadingData(true);

        // ⭐ MODE OFFLINE - Utiliser IndexedDB (priorité au local)
        let opaActors = await db.actors
          .where("actorType")
          .equals("PRODUCERS")
          .and((actor) => actor.status === "active")
          .toArray();

        // ⭐ Si l'utilisateur est un actor_manager de type PRODUCERS, filtrer uniquement son OPA
        if (
          user?.role === USER_ROLES_CONSTANTS.ACTOR_MANAGER &&
          user?.actor?.actorType === "PRODUCERS" &&
          user?.actor?.id
        ) {
          opaActors = opaActors.filter(
            (actor) =>
              actor.serverId === user.actor?.id ||
              actor.localId === user.actor?.id
          );
        }

        const opaOpts = opaActors.map((actor) => ({
          value: actor.serverId || actor.localId || "",
          label: `${actor.familyName} ${actor.givenName}`.trim(),
        }));

        setOpaOptions(opaOpts);
      } catch {
        setOpaOptions([]);
      } finally {
        setIsLoadingData(false);
      }
    };

    loadData();
  }, [user]);

  // ✅ Charger les conventions depuis IndexedDB quand l'OPA change
  useEffect(() => {
    const loadConventions = async () => {
      if (!watchedOpaId) {
        setConventionOptions([]);
        return;
      }

      try {
        // ✅ Récupérer les conventions de cet OPA depuis db.conventions
        const conventions = await db.conventions
          .where("producerServerId")
          .equals(watchedOpaId)
          .or("producerLocalId")
          .equals(watchedOpaId)
          .toArray();

        if (!conventions || conventions.length === 0) {
          setConventionOptions([]);
          return;
        }

        // Filtrer et mapper uniquement les conventions actives
        const conventionOpts = conventions
          .filter((convention) => convention.status === "active")
          .map((convention) => ({
            value: convention.serverId || convention.localId || "",
            label: `${convention.code} - ${convention.signatureDate}`,
            isActive: true,
          }));

        setConventionOptions(conventionOpts);
      } catch (error) {
        console.error("Erreur lors du chargement des conventions:", error);
        setConventionOptions([]);
      }
    };

    loadConventions();
  }, [watchedOpaId]);

  const handleNext = useCallback(async () => {
    const isFormValid = await form.trigger();
    if (isFormValid && !isNavigating) {
      setIsNavigating(true);
      navigateToNext();
    }
  }, [form, navigateToNext, isNavigating]);

  const handleBack = useCallback(() => {
    if (editOffline) {
      router.push("/outbox");
    } else {
      router.push("/quick-menu");
    }
  }, [router, editOffline]);

  // Footer buttons
  const footerButtons = (
    <div className="flex gap-2 justify-end">
      <Button
        onClick={handleNext}
        disabled={!isValid || isNavigating || isLoadingData}
      >
        {isLoadingData
          ? t("common:messages.loading")
          : t("common:actions.next")}
      </Button>
    </div>
  );

  // Afficher un loader pendant le chargement du calendrier en mode édition online
  if (entityId && !editOffline && isLoadingCalendar) {
    return <LoadingFallback message={t("common:messages.loading")} />;
  }

  // Afficher une erreur si le calendrier n'a pas pu être chargé
  if (entityId && !editOffline && calendarError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <p className="text-red-600">{calendarError}</p>
        <Button onClick={() => router.push("/calendars")}>
          {t("calendar:view.backToList")}
        </Button>
      </div>
    );
  }

  // Header content
  const headerContent = (
    <div className="flex items-center space-x-3">
      <h1 className="text-xl font-medium text-gray-900">
        {t("calendar:forms.pickupAdd.step1.sectionTitle")}
      </h1>
    </div>
  );

  return (
    <PickupFormLayout
      onHandleCancel={handleCancel}
      className="lg:flex items-start lg:space-x-4"
    >
      {/* Bouton Retour AVANT le BaseCard */}
      <div className="py-3">
        <Button variant="link" onClick={handleBack}>
          <Icon name="ArrowLeft" />
          <span>{t("common:actions.back")}</span>
        </Button>
      </div>

      <BaseCard title={headerContent} footer={footerButtons} className="w-full">
        <Form {...form}>
          <form className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              {/* OPA */}
              <div className="lg:w-1/2">
                <FormInputAutocompletion
                  form={form}
                  name="opaId"
                  label={t("calendar:forms.pickupAdd.step1.opa")}
                  placeholder=""
                  options={opaOptions}
                  disabled={isLoadingData}
                  required
                />
              </div>

              {/* Convention */}
              <div className="lg:w-1/2">
                <FormInputAutocompletion
                  form={form}
                  name="conventionId"
                  label={t("calendar:forms.pickupAdd.step1.convention")}
                  placeholder=""
                  options={conventionOptions}
                  disabled={!watchedOpaId || conventionOptions.length === 0}
                  required
                />
              </div>

              {/* Date d'enlèvement */}
              <div className="lg:w-1/2">
                <FormDatePicker
                  form={form}
                  name="startDate"
                  label={t("calendar:forms.pickupAdd.step1.startDate")}
                  placeholder=""
                  minDate={new Date(Date.now() + 24 * 60 * 60 * 1000)} // Demain minimum
                  maxDate={new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)} // Maximum 1 an dans le futur
                  disabledDates={{
                    before: new Date(Date.now() + 24 * 60 * 60 * 1000), // Demain (strictement supérieur à aujourd'hui)
                    after: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Maximum 1 an dans le futur
                  }}
                  locale={currentLocale}
                  required
                />
              </div>

              {/* Date de fin */}
              <div className="lg:w-1/2">
                <FormDatePicker
                  form={form}
                  name="endDate"
                  label={t("calendar:forms.pickupAdd.step1.endDate")}
                  placeholder=""
                  minDate={getMinDateForEnd()}
                  maxDate={getMaxDateForEnd()}
                  disabledDates={{
                    before: getMinDateForEnd(),
                    after: getMaxDateForEnd(),
                  }}
                  locale={currentLocale}
                  required
                />
              </div>

              {/* Heure */}
              <div className="lg:w-1/2">
                <FormTimePicker
                  form={form}
                  name="eventTime"
                  label={t("calendar:forms.pickupAdd.step1.eventTime")}
                  placeholder=""
                  locale={currentLocale}
                  minHour={6}
                  maxHour={18}
                  required
                />
              </div>

              <Separator className="my-6" />

              {/* Localisation */}
              <div className="lg:w-1/2">
                <LocationSelectorForm
                  form={form}
                  name="locationCode"
                  label={t("calendar:forms.pickupAdd.step1.locationCode")}
                  onlyInProductionBasin
                  required
                  isEditMode={!!formData.step1.locationCode}
                />
              </div>

              {/* Lieu */}
              <div className="lg:w-1/2">
                <FormInput
                  form={form}
                  name="location"
                  label={t("calendar:forms.pickupAdd.step1.location")}
                  placeholder=""
                  required
                />
              </div>
            </div>
          </form>
        </Form>
      </BaseCard>
    </PickupFormLayout>
  );
}
