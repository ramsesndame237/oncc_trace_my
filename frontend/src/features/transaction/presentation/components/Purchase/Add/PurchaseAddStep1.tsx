"use client";

import {
  FormDatePicker,
  FormInputAutocompletion,
  FormSelect,
} from "@/components/forms";
import { Icon } from "@/components/icon";
import { BaseCard } from "@/components/modules/base-card";
import { LoadingFallback } from "@/components/modules/loading-fallback";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { USER_ROLES_CONSTANTS } from "@/core/domain/generated/user-roles.types";
import { db } from "@/core/infrastructure/database/db";
import { useAuth } from "@/features/auth";
import { useLocale } from "@/hooks/useLocale";
import { dayjs } from "@/lib/dayjs";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { TRANSACTION_LOCATION_TYPES } from "../../../../domain/Transaction";
import { usePurchaseAddFormStore } from "../../../../infrastructure/store/purchaseAddFormStore";
import { usePurchaseAddFormNavigation } from "../../../hooks/usePurchaseAddFormNavigation";
import {
  createPurchaseStep1GeneralInfoSchema,
  type PurchaseStep1GeneralInfoData,
} from "../../../schemas/purchase-validation-schemas";
import { PurchaseFormLayout } from "../PurchaseFormLayout";

export function PurchaseAddStep1() {
  const { t } = useTranslation(["transaction", "common"]);
  const { currentLocale } = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const {
    formData,
    updateStep1Data,
    setStepValidation,
    saveProgress,
    clearProducts,
    currentStep,
    setCurrentStep,
    entityId: storeEntityId,
    editOffline: storeEditOffline,
  } = usePurchaseAddFormStore();

  const { navigateToNext } = usePurchaseAddFormNavigation();
  const [isNavigating, setIsNavigating] = useState(false);

  // Réinitialiser isNavigating et forcer currentStep à 1 quand le composant est monté
  useEffect(() => {
    setIsNavigating(false);
    if (currentStep !== 1) {
      setCurrentStep(1);
    }
  }, [currentStep, setCurrentStep]);

  // Détection du mode édition depuis les query params
  const entityIdFromParams = searchParams.get("entityId");
  const entityId = entityIdFromParams || storeEntityId;
  const editOffline = storeEditOffline;

  // States pour les options
  const [locationTypeOptions, setLocationTypeOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [allActorsOptions, setAllActorsOptions] = useState<
    Array<{ value: string; label: string; actorType: string }>
  >([]);
  const [sellerOptions, setSellerOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [buyerOptions, setBuyerOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [calendarOptions, setCalendarOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [conventionOptions, setConventionOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [previousLocationType, setPreviousLocationType] = useState<
    string | null
  >(null);
  const [previousBuyerId, setPreviousBuyerId] = useState<string | null>(null);

  const defaultStep1Values = useMemo<Partial<PurchaseStep1GeneralInfoData>>(
    () => ({
      locationType: formData.step1.locationType ?? undefined,
      buyerId: formData.step1.buyerId ?? "",
      sellerId: formData.step1.sellerId ?? "",
      principalExporterId: formData.step1.principalExporterId ?? "",
      calendarId: formData.step1.calendarId ?? "",
      conventionId: formData.step1.conventionId ?? "",
      transactionDate: formData.step1.transactionDate ?? "",
    }),
    [formData.step1]
  );

  const form = useForm<PurchaseStep1GeneralInfoData>({
    resolver: zodResolver(createPurchaseStep1GeneralInfoSchema(t)),
    defaultValues: defaultStep1Values,
    mode: "onChange",
    criteriaMode: "firstError",
    shouldFocusError: true,
  });

  const { isValid } = form.formState;

  const watchedLocationType = form.watch("locationType");
  const watchedBuyerId = form.watch("buyerId");
  const watchedSellerId = form.watch("sellerId");
  const watchedConventionId = form.watch("conventionId");

  const [mandatorOptions, setMandatorOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);

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

          const offlineData: PurchaseStep1GeneralInfoData = {
            locationType:
              (payload.locationType as PurchaseStep1GeneralInfoData["locationType"]) ||
              null,
            buyerId: (payload.buyerId as string) || "",
            sellerId: (payload.sellerId as string) || "",
            principalExporterId: (payload.principalExporterId as string) || "",
            calendarId: (payload.calendarId as string) || "",
            conventionId: (payload.conventionId as string) || "",
            transactionDate: (payload.transactionDate as string) || "",
          };

          form.reset(offlineData);
          updateStep1Data(offlineData);
        }
      } catch {
        // Silently fail
      }
    };

    loadOfflineData();
  }, [entityId, editOffline, form, updateStep1Data]);

  // Auto-save
  useEffect(() => {
    const subscription = form.watch((data) => {
      updateStep1Data(data as PurchaseStep1GeneralInfoData);
      saveProgress();
    });
    return () => subscription.unsubscribe();
  }, [form, updateStep1Data, saveProgress]);

  // Observer la validation
  useEffect(() => {
    setStepValidation("step1", isValid);
  }, [isValid, setStepValidation]);

  // Préparer les options pour locationType
  useEffect(() => {
    const options = TRANSACTION_LOCATION_TYPES.map((type) => ({
      value: type,
      label: t(`transaction:locationTypes.${type}`),
    }));
    setLocationTypeOptions(options);
  }, [t]);

  // Réinitialiser tous les champs quand le type de localisation change
  useEffect(() => {
    if (isInitialLoad || !watchedLocationType) return;

    if (previousLocationType === null) {
      setPreviousLocationType(watchedLocationType);
      return;
    }

    if (previousLocationType === watchedLocationType) return;

    setPreviousLocationType(watchedLocationType);

    form.setValue("buyerId", "");
    form.setValue("sellerId", "");
    form.setValue("principalExporterId", "");
    form.setValue("calendarId", "");
    form.setValue("conventionId", "");
    form.setValue("transactionDate", "");

    setMandatorOptions([]);
    setConventionOptions([]);
    setCalendarOptions([]);

    clearProducts();
  }, [watchedLocationType, form, isInitialLoad, previousLocationType, clearProducts]);

  // Effacer les produits quand l'acheteur change
  useEffect(() => {
    if (isInitialLoad) return;

    if (previousBuyerId === null) {
      setPreviousBuyerId(watchedBuyerId || null);
      return;
    }

    if (previousBuyerId === (watchedBuyerId || null)) return;

    setPreviousBuyerId(watchedBuyerId || null);

    clearProducts();
  }, [watchedBuyerId, isInitialLoad, previousBuyerId, clearProducts]);

  // Filtrer les exportateurs mandants selon l'acheteur sélectionné
  useEffect(() => {
    const loadMandators = async () => {
      if (!watchedBuyerId) {
        setMandatorOptions([]);
        if (!isInitialLoad) {
          form.setValue("principalExporterId", "");
        }
        return;
      }

      try {
        // ✅ Charger les exportateurs (mandataires) depuis la table exporterMandates
        const mandateRelations = await db.exporterMandates
          .where("buyerServerId")
          .equals(watchedBuyerId)
          .or("buyerLocalId")
          .equals(watchedBuyerId)
          .toArray();

        if (mandateRelations && mandateRelations.length > 0) {
          // Récupérer les IDs des exportateurs
          const exporterIds = mandateRelations.map(
            (rel) => rel.exporterServerId || rel.exporterLocalId || ""
          );

          // Récupérer les détails des exportateurs depuis db.actors
          const exporters = await db.actors
            .where("serverId")
            .anyOf(exporterIds)
            .or("localId")
            .anyOf(exporterIds)
            .toArray();

          const options = exporters
            .filter((exporter) => exporter.status === "active")
            .map((exporter) => ({
              value: exporter.serverId || exporter.localId || "",
              label: `${exporter.familyName} ${exporter.givenName}`.trim(),
            }));

          setMandatorOptions(options);

          if (!isInitialLoad) {
            const currentExporterId = form.getValues("principalExporterId");
            if (currentExporterId) {
              const isValid = options.some(
                (opt) => opt.value === currentExporterId
              );
              if (!isValid) {
                form.setValue("principalExporterId", "");
              }
            }
          }
        } else {
          setMandatorOptions([]);
        }
      } catch {
        setMandatorOptions([]);
      }
    };

    loadMandators();
  }, [watchedBuyerId, form, isInitialLoad]);

  // Charger les conventions
  useEffect(() => {
    const loadConventions = async () => {
      if (
        watchedLocationType !== "CONVENTION" ||
        !watchedSellerId ||
        !watchedBuyerId
      ) {
        setConventionOptions([]);
        if (!isInitialLoad && watchedLocationType === "CONVENTION") {
          form.setValue("conventionId", "");
          form.setValue("calendarId", "");
        }
        return;
      }

      try {
        // ✅ Charger les conventions depuis IndexedDB (table séparée db.conventions)
        // Filtrer par OPA (producerServerId/LocalId) ET acheteur (buyerExporterServerId/LocalId)
        const conventions = await db.conventions
          .where("producerServerId")
          .equals(watchedSellerId)
          .or("producerLocalId")
          .equals(watchedSellerId)
          .and((convention) =>
            convention.status === "active" &&
            (convention.buyerExporterServerId === watchedBuyerId ||
             convention.buyerExporterLocalId === watchedBuyerId)
          )
          .toArray();

        if (conventions && conventions.length > 0) {
          const options = conventions.map((convention) => {
            const formattedDate = dayjs(convention.signatureDate)
              .locale(currentLocale)
              .format("LL");

            return {
              value: convention.serverId || convention.localId || "",
              label: `${convention.code} - ${formattedDate}`,
            };
          });
          setConventionOptions(options);

          if (!isInitialLoad) {
            const currentConventionId = form.getValues("conventionId");
            if (currentConventionId) {
              const isValid = options.some(
                (opt) => opt.value === currentConventionId
              );
              if (!isValid) {
                form.setValue("conventionId", "");
                form.setValue("calendarId", "");
              }
            }
          }
        } else {
          setConventionOptions([]);
        }
      } catch {
        setConventionOptions([]);
      }
    };

    loadConventions();
  }, [
    watchedLocationType,
    watchedSellerId,
    watchedBuyerId,
    currentLocale,
    t,
    form,
    isInitialLoad,
  ]);

  // Charger les calendriers
  useEffect(() => {
    const loadCalendars = async () => {
      if (watchedLocationType === "MARKET" && !watchedSellerId) {
        setCalendarOptions([]);
        if (!isInitialLoad) {
          form.setValue("calendarId", "");
        }
        return;
      }

      if (watchedLocationType === "CONVENTION" && !watchedConventionId) {
        setCalendarOptions([]);
        if (!isInitialLoad) {
          form.setValue("calendarId", "");
        }
        return;
      }

      if (
        watchedLocationType !== "MARKET" &&
        watchedLocationType !== "CONVENTION"
      ) {
        setCalendarOptions([]);
        return;
      }

      try {
        const calendarType =
          watchedLocationType === "MARKET" ? "MARCHE" : "ENLEVEMENT";

        let allCalendars: Array<{
          id: string;
          location: string | null;
          startDate: string;
          eventTime: string | null;
        }> = [];

        if (watchedLocationType === "MARKET" && watchedSellerId) {
          // ✅ Pour MARKET: Charger les calendriers de marché du vendeur depuis db.calendars
          const calendarsFromDB = await db.calendars
            .where("producerServerId")
            .equals(watchedSellerId)
            .or("producerLocalId")
            .equals(watchedSellerId)
            .and((calendar) =>
              calendar.type === calendarType &&
              calendar.status === "active"
            )
            .toArray();

          allCalendars = calendarsFromDB.map((calendar) => ({
            id: calendar.serverId || calendar.localId!,
            location: calendar.location,
            startDate: calendar.startDate,
            eventTime: calendar.eventTime,
          }));
        } else if (watchedLocationType === "CONVENTION" && watchedConventionId) {
          // ✅ Pour CONVENTION: Charger les calendriers d'enlèvement liés à la convention depuis db.calendars
          const calendarsFromDB = await db.calendars
            .where("conventionServerId")
            .equals(watchedConventionId)
            .or("conventionLocalId")
            .equals(watchedConventionId)
            .and((calendar) =>
              calendar.type === calendarType &&
              calendar.status === "active"
            )
            .toArray();

          allCalendars = calendarsFromDB.map((calendar) => ({
            id: calendar.serverId || calendar.localId!,
            location: calendar.location,
            startDate: calendar.startDate,
            eventTime: calendar.eventTime,
          }));
        }

        const options = allCalendars.map((calendar) => {
          const formattedDate = dayjs(calendar.startDate)
            .locale(currentLocale)
            .format("LL");

          const formattedTime = calendar.eventTime
            ? dayjs(`2000-01-01 ${calendar.eventTime}`)
                .locale(currentLocale)
                .format("LT")
            : "";

          return {
            value: calendar.id,
            label: `${calendar.location || ""} - ${formattedDate}${
              formattedTime ? ` ${formattedTime}` : ""
            }`,
          };
        });
        setCalendarOptions(options);

        if (!isInitialLoad) {
          const currentCalendarId = form.getValues("calendarId");
          if (currentCalendarId) {
            const isValidCalendar = allCalendars.some(
              (c) => c.id === currentCalendarId
            );
            if (!isValidCalendar) {
              form.setValue("calendarId", "");
            }
          }
        }
      } catch {
        setCalendarOptions([]);
      }
    };

    loadCalendars();
  }, [
    watchedLocationType,
    watchedSellerId,
    watchedConventionId,
    currentLocale,
    form,
    isInitialLoad,
  ]);

  // Charger les données (tous les acteurs)
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoadingData(true);

        const allActors = await db.actors
          .where("status")
          .equals("active")
          .and((actor) => actor.actorType !== "PRODUCER")
          .toArray();

        const allActorsOpts = allActors.map((actor) => ({
          value: actor.serverId || actor.localId || "",
          label: `${actor.familyName} ${actor.givenName}`.trim(),
          actorType: actor.actorType,
        }));

        setAllActorsOptions(allActorsOpts);
      } catch {
        setAllActorsOptions([]);
      } finally {
        setIsLoadingData(false);
        setTimeout(() => {
          setIsInitialLoad(false);
        }, 100);
      }
    };

    loadData();
  }, []);

  // Filtrer les options de vendeur et acheteur selon le type de localisation
  useEffect(() => {
    if (!watchedLocationType) {
      setSellerOptions([]);
      setBuyerOptions([]);
      return;
    }

    // ⭐ Vérifier si l'utilisateur est un actor_manager de type BUYER, EXPORTER ou TRANSFORMER
    const isActorManagerBET =
      user?.role === USER_ROLES_CONSTANTS.ACTOR_MANAGER &&
      ["BUYER", "EXPORTER", "TRANSFORMER"].includes(user?.actor?.actorType || "") &&
      user?.actor?.id;

    if (watchedLocationType === "MARKET") {
      // Pour MARCHE: vendeur = OPA uniquement, acheteur = autres acteurs
      setSellerOptions(
        allActorsOptions.filter((actor) => actor.actorType === "PRODUCERS")
      );
      let buyerActors = allActorsOptions.filter((actor) => actor.actorType !== "PRODUCERS");

      // ⭐ Si actor_manager de type BUYER/EXPORTER/TRANSFORMER, ne garder que son acteur
      if (isActorManagerBET) {
        buyerActors = buyerActors.filter((actor) => actor.value === user.actor?.id);
      }

      setBuyerOptions(buyerActors);
    } else if (watchedLocationType === "CONVENTION") {
      // Pour CONVENTION: vendeur = OPA, acheteur = EXPORTER ou BUYER
      setSellerOptions(
        allActorsOptions.filter((actor) => actor.actorType === "PRODUCERS")
      );
      let buyerActors = allActorsOptions.filter(
        (actor) =>
          actor.actorType === "EXPORTER" || actor.actorType === "BUYER"
      );

      // ⭐ Si actor_manager de type BUYER/EXPORTER/TRANSFORMER, ne garder que son acteur
      if (isActorManagerBET) {
        buyerActors = buyerActors.filter((actor) => actor.value === user.actor?.id);
      }

      setBuyerOptions(buyerActors);
    } else if (watchedLocationType === "OUTSIDE_MARKET") {
      // Pour HORS_MARCHE: vendeur/acheteur peuvent être BUYER, EXPORTER, TRANSFORMER
      const sellerActors = allActorsOptions.filter(
        (actor) =>
          (actor.actorType === "BUYER" || actor.actorType === "EXPORTER" || actor.actorType === "TRANSFORMER") &&
          actor.value !== watchedBuyerId
      );
      setSellerOptions(sellerActors);

      let buyerActors = allActorsOptions.filter(
        (actor) =>
          (actor.actorType === "BUYER" ||
            actor.actorType === "EXPORTER" ||
            actor.actorType === "TRANSFORMER") &&
          actor.value !== watchedSellerId
      );

      // ⭐ Si actor_manager de type BUYER/EXPORTER/TRANSFORMER, ne garder que son acteur
      if (isActorManagerBET) {
        buyerActors = buyerActors.filter((actor) => actor.value === user.actor?.id);
      }

      setBuyerOptions(buyerActors);
    }
  }, [watchedLocationType, allActorsOptions, watchedSellerId, watchedBuyerId, user]);

  const handleNext = useCallback(async () => {
    const isFormValid = await form.trigger();
    if (isFormValid && !isNavigating) {
      setIsNavigating(true);
      navigateToNext(1, editOffline, entityId);
    }
  }, [form, navigateToNext, isNavigating, editOffline, entityId]);

  const handleBack = useCallback(() => {
    if (editOffline) {
      router.push("/outbox");
    } else {
      router.push("/quick-menu");
    }
  }, [router, editOffline]);

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

  if (isLoadingData) {
    return <LoadingFallback message={t("common:messages.loading")} />;
  }

  const headerContent = (
    <div className="flex items-center space-x-3">
      <h1 className="text-xl font-medium text-gray-900">
        {t("transaction:purchaseAdd.steps.generalInfo")}
      </h1>
    </div>
  );

  return (
    <PurchaseFormLayout className="lg:flex items-start lg:space-x-4">
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
              {/* Type de localisation */}
              <div className="lg:w-1/2">
                <FormSelect
                  form={form}
                  name="locationType"
                  label={t("transaction:purchaseAdd.fields.locationType")}
                  placeholder=""
                  options={locationTypeOptions}
                  required
                />
              </div>

              <Separator className="my-6" />

              {/* ACHETEUR EN PREMIER pour les achats */}
              <div className="lg:w-1/2">
                <FormInputAutocompletion
                  form={form}
                  name="buyerId"
                  label={t("transaction:purchaseAdd.fields.buyer")}
                  placeholder=""
                  options={buyerOptions}
                  required
                  disabled={!watchedLocationType}
                />
              </div>

              {/* VENDEUR EN SECOND pour les achats */}
              <div className="lg:w-1/2">
                <FormInputAutocompletion
                  form={form}
                  name="sellerId"
                  label={t("transaction:purchaseAdd.fields.seller")}
                  placeholder=""
                  options={sellerOptions}
                  required
                  disabled={!watchedLocationType}
                />
              </div>

              {/* Exportateur principal */}
              {watchedBuyerId && mandatorOptions.length > 0 && (
                <div className="lg:w-1/2">
                  <FormInputAutocompletion
                    form={form}
                    name="principalExporterId"
                    label={t("transaction:purchaseAdd.fields.principalExporter")}
                    placeholder=""
                    options={mandatorOptions}
                    disabled={!watchedLocationType}
                  />
                </div>
              )}

              {(watchedLocationType === "MARKET" ||
                watchedLocationType === "CONVENTION") && (
                <Separator className="my-6" />
              )}

              {/* Calendrier (conditionnel - seulement si MARKET) */}
              {watchedLocationType === "MARKET" && (
                <div className="lg:w-1/2">
                  <FormInputAutocompletion
                    form={form}
                    name="calendarId"
                    label={t("transaction:purchaseAdd.fields.calendar")}
                    placeholder=""
                    options={calendarOptions}
                    required
                    disabled={!watchedSellerId}
                  />
                </div>
              )}

              {/* Convention (conditionnel - seulement si CONVENTION) */}
              {watchedLocationType === "CONVENTION" && (
                <>
                  <div className="lg:w-1/2">
                    <FormInputAutocompletion
                      form={form}
                      name="conventionId"
                      label={t("transaction:purchaseAdd.fields.convention")}
                      placeholder=""
                      options={conventionOptions}
                      required
                      disabled={!watchedSellerId || !watchedBuyerId}
                    />
                  </div>

                  <div className="lg:w-1/2">
                    <FormInputAutocompletion
                      form={form}
                      name="calendarId"
                      label={t("transaction:purchaseAdd.fields.calendar")}
                      placeholder=""
                      options={calendarOptions}
                      required
                      disabled={!watchedConventionId}
                    />
                  </div>
                </>
              )}

              <Separator className="my-6" />

              {/* Date de transaction */}
              <div className="lg:w-1/2">
                <FormDatePicker
                  form={form}
                  name="transactionDate"
                  label={t("transaction:purchaseAdd.fields.transactionDate")}
                  placeholder=""
                  minDate={new Date(2020, 0, 1)}
                  maxDate={new Date()}
                  locale={currentLocale}
                  disabled={!watchedLocationType}
                  required
                />
              </div>
            </div>
          </form>
        </Form>
      </BaseCard>
    </PurchaseFormLayout>
  );
}
