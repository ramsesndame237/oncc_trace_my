"use client";

import { FormDatePicker, FormInput, FormTimePicker } from "@/components/forms";
import FormInputAutocompletion from "@/components/forms/form-input-autocompletion";
import { Icon } from "@/components/icon";
import { BaseCard } from "@/components/modules/base-card";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { db } from "@/core/infrastructure/database/db";
import { LocationSelectorForm } from "@/features/location/presentation/components/forms/LocationSelectorForm";
import { useLocale } from "@/hooks/useLocale";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useCalendarStore } from "../../../../infrastructure/store/calendarStore";
import { useGetCalendarById } from "../../../hooks/useGetCalendarById";
import {
  createPickupEditSchema,
  type PickupEditData,
} from "../../../schemas/pickup-validation-schemas";
import { PickupFormLayout } from "../PickupFormLayout";

export function PickupEditForm() {
  const { t } = useTranslation(["calendar", "common"]);
  const { currentLocale } = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const calendarId = searchParams.get("entityId");
  const editOffline = searchParams.has("editOffline");
  const isOnline = useOnlineStatus();

  const { updateCalendar } = useCalendarStore();
  // Ne charger depuis l'API que si on n'est PAS en mode editOffline
  const { calendar, isLoading, error } = useGetCalendarById(
    calendarId && !editOffline ? calendarId : ""
  );

  const [isSaving, setIsSaving] = useState(false);

  // States pour les options
  const [opaOptions, setOpaOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [conventionOptions, setConventionOptions] = useState<
    Array<{ value: string; label: string; isActive?: boolean }>
  >([]);

  // Fonction utilitaire pour parser une date string en fuseau local
  const parseLocalDate = (dateString: string): Date => {
    const [year, month, day] = dateString.split("-").map(Number);
    return new Date(year, month - 1, day); // month-1 car les mois sont 0-indexés
  };

  // Form setup
  const form = useForm<PickupEditData>({
    resolver: zodResolver(createPickupEditSchema(t)),
    defaultValues: {
      opaId: "",
      conventionId: "",
      startDate: "",
      endDate: "",
      eventTime: "",
      locationCode: "",
      location: "",
    },
    mode: "onChange",
    criteriaMode: "firstError",
    shouldFocusError: true,
  });

  const { isValid } = form.formState;

  // Surveiller la date de début pour mettre à jour les contraintes de la date de fin
  const watchedStartDate = form.watch("startDate");
  // Surveiller l'OPA sélectionné pour charger ses conventions
  const watchedOpaId = form.watch("opaId");

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

  // Mettre à jour les valeurs du formulaire quand les données sont chargées (mode online)
  useEffect(() => {
    if (calendar && !editOffline) {
      form.reset({
        opaId: calendar.opaId || "",
        conventionId: calendar.conventionId || "",
        startDate: calendar.startDate || "",
        endDate: calendar.endDate || "",
        eventTime: calendar.eventTime || "",
        locationCode: calendar.locationCode || "",
        location: calendar.location || "",
      });
    }
  }, [calendar, editOffline, form]);

  // Charger les données offline si en mode editOffline
  useEffect(() => {
    const loadOfflineData = async () => {
      if (!calendarId || !editOffline) return;

      try {
        const pendingOperation = await db.pendingOperations
          .where("entityId")
          .equals(calendarId)
          .first();

        if (pendingOperation && pendingOperation.payload) {
          const payload = pendingOperation.payload as Record<string, unknown>;

          // Pré-remplir le formulaire avec les données du payload
          const offlineData: PickupEditData = {
            opaId: (payload.opaId as string) || "",
            conventionId: (payload.conventionId as string) || "",
            startDate: (payload.startDate as string) || "",
            endDate: (payload.endDate as string) || "",
            locationCode: (payload.locationCode as string) || "",
            location: (payload.location as string) || "",
            eventTime: (payload.eventTime as string) || "",
          };

          form.reset(offlineData);
        }
      } catch {
        // Silently fail - offline data loading is not critical
      }
    };

    loadOfflineData();
  }, [calendarId, editOffline, form]);

  // Réinitialiser la date de fin quand la date de début change
  useEffect(() => {
    if (watchedStartDate && watchedStartDate !== calendar?.startDate) {
      // Reset la date de fin uniquement si la date de début a changé
      form.setValue("endDate", "", { shouldValidate: true, shouldDirty: true });
      form.trigger("endDate");
    }
  }, [watchedStartDate, form, calendar?.startDate]);

  // Charger les OPAs
  useEffect(() => {
    const loadData = async () => {
      try {
        // ⭐ MODE OFFLINE - Utiliser IndexedDB
        const opaActors = await db.actors
          .where("actorType")
          .equals("PRODUCERS")
          .toArray();

        const opaOpts = opaActors.map((actor) => ({
          value: actor.serverId || actor.localId || "",
          label: `${actor.familyName} ${actor.givenName}`.trim(),
        }));

        setOpaOptions(opaOpts);
      } catch {
        setOpaOptions([]);
      }
    };

    loadData();
  }, [isOnline]);

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

        // Mapper les conventions et indiquer lesquelles sont actives
        const conventionOpts = conventions
          .filter((convention) => convention.status === "active")
          .map((convention) => ({
            value: convention.serverId || convention.localId || "",
            label: `${convention.code} - ${convention.signatureDate}`,
            isActive: convention.status === "active",
          }));

        setConventionOptions(conventionOpts);
      } catch (error) {
        console.error("Erreur lors du chargement des conventions:", error);
        setConventionOptions([]);
      }
    };

    loadConventions();
  }, [watchedOpaId]);

  // Gérer la soumission du formulaire
  const handleSubmit = useCallback(
    async (data: PickupEditData) => {
      if (!calendarId) return;

      try {
        setIsSaving(true);

        // Préparer les données à soumettre
        const calendarData = {
          type: "ENLEVEMENT" as const,
          opaId: data.opaId,
          conventionId: data.conventionId,
          startDate: data.startDate,
          endDate: data.endDate,
          locationCode: data.locationCode,
          location: data.location,
          eventTime: data.eventTime || undefined,
        };

        // Appeler le store pour mettre à jour
        await updateCalendar(calendarId, calendarData, editOffline);

        toast.success(
          editOffline
            ? t("calendar:form.messages.updateSuccessOffline")
            : t("calendar:form.messages.updateSuccess")
        );

        // Redirection selon le mode
        if (editOffline) {
          router.push("/outbox");
        } else {
          router.push(`/calendars/view?entityId=${calendarId}`);
        }
      } catch (err) {
        // Le store gère déjà l'affichage de l'erreur
        console.error("Erreur lors de la mise à jour du calendrier:", err);
      } finally {
        setIsSaving(false);
      }
    },
    [calendarId, updateCalendar, editOffline, router, t]
  );

  const handleCancel = useCallback(() => {
    if (editOffline) {
      router.push("/outbox");
    } else {
      router.push(`/calendars/view?entityId=${calendarId}`);
    }
  }, [router, calendarId, editOffline]);

  // Afficher un loader pendant le chargement
  if (isLoading) {
    return (
      <PickupFormLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <p>{t("common:messages.loading")}</p>
        </div>
      </PickupFormLayout>
    );
  }

  // Afficher une erreur si le calendrier n'a pas pu être chargé
  if (error || !calendar) {
    return (
      <PickupFormLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <p className="text-red-600">{error || t("calendar:view.notFound")}</p>
          <Button onClick={() => router.push("/calendars")}>
            {t("calendar:view.backToList")}
          </Button>
        </div>
      </PickupFormLayout>
    );
  }

  // Header content
  const headerContent = (
    <div className="flex items-center space-x-3">
      <h1 className="text-xl font-medium text-gray-900">
        {t("calendar:forms.pickupEdit.title")}
      </h1>
    </div>
  );

  // Footer buttons
  const footerButtons = (
    <div className="flex gap-2 justify-end">
      <Button
        onClick={form.handleSubmit(handleSubmit)}
        disabled={!isValid || isSaving}
      >
        {isSaving ? (
          <>{t("common:messages.saving")}</>
        ) : (
          <>{t("common:actions.save")}</>
        )}
      </Button>
    </div>
  );

  return (
    <PickupFormLayout
      className="lg:flex items-start lg:space-x-4"
      onHandleCancel={handleCancel}
    >
      {/* Bouton Retour */}
      <div className="py-3">
        <Button variant="link" onClick={handleCancel}>
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
                  disabled={true}
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
                  disabled={true}
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
                    before: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    after: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
                  }}
                  locale={currentLocale}
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
                />
              </div>

              {/* Heure (optionnel) */}
              <div className="lg:w-1/2">
                <FormTimePicker
                  form={form}
                  name="eventTime"
                  label={t("calendar:forms.pickupAdd.step1.eventTime")}
                  placeholder=""
                  locale={currentLocale}
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
                  disabled={true}
                  isEditMode={!!calendar.locationCode}
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
