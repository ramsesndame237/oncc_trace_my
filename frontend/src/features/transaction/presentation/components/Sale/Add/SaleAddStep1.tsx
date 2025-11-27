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
import { useSaleAddFormStore } from "../../../../infrastructure/store/saleAddFormStore";
import { useSaleAddFormNavigation } from "../../../hooks/useSaleAddFormNavigation";
import {
  createStep1GeneralInfoSchema,
  type Step1GeneralInfoData,
} from "../../../schemas/sale-validation-schemas";
import { SaleFormLayout } from "../SaleFormLayout";

export function SaleAddStep1() {
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
  } = useSaleAddFormStore();

  const { navigateToNext } = useSaleAddFormNavigation();
  const [isNavigating, setIsNavigating] = useState(false);

  // Réinitialiser isNavigating et forcer currentStep à 1 quand le composant est monté
  useEffect(() => {
    setIsNavigating(false);
    // Forcer currentStep à 1 car nous sommes sur la page de l'étape 1
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
  // Options de base (tous les acteurs)
  const [allActorsOptions, setAllActorsOptions] = useState<
    Array<{ value: string; label: string; actorType: string }>
  >([]);
  // Options filtrées selon le locationType
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

  // Flag pour éviter la réinitialisation des valeurs lors du premier chargement
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  // Stocker la valeur précédente du locationType pour détecter les vrais changements
  const [previousLocationType, setPreviousLocationType] = useState<
    string | null
  >(null);
  // Stocker la valeur précédente du sellerId pour détecter les vrais changements
  const [previousSellerId, setPreviousSellerId] = useState<string | null>(null);

  const defaultStep1Values = useMemo<Partial<Step1GeneralInfoData>>(
    () => ({
      locationType: formData.step1.locationType ?? undefined,
      sellerId: formData.step1.sellerId ?? "",
      buyerId: formData.step1.buyerId ?? "",
      principalExporterId: formData.step1.principalExporterId ?? "",
      calendarId: formData.step1.calendarId ?? "",
      conventionId: formData.step1.conventionId ?? "",
      transactionDate: formData.step1.transactionDate ?? "",
    }),
    [formData.step1]
  );

  // Form setup
  const form = useForm<Step1GeneralInfoData>({
    resolver: zodResolver(createStep1GeneralInfoSchema(t)),
    defaultValues: defaultStep1Values,
    mode: "onChange",
    criteriaMode: "firstError",
    shouldFocusError: true,
  });

  const { isValid } = form.formState;

  // Watch locationType pour afficher/masquer les champs conditionnels
  const watchedLocationType = form.watch("locationType");
  // Watch buyerId pour filtrer les exportateurs mandants
  const watchedBuyerId = form.watch("buyerId");
  // Watch sellerId pour les conditions de disabled
  const watchedSellerId = form.watch("sellerId");
  // Watch conventionId pour filtrer les calendriers
  const watchedConventionId = form.watch("conventionId");

  // State pour les options d'exportateurs mandants filtrés
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

          // Pré-remplir le formulaire avec les données du payload
          const offlineData: Step1GeneralInfoData = {
            locationType:
              (payload.locationType as Step1GeneralInfoData["locationType"]) ||
              null,
            sellerId: (payload.sellerId as string) || "",
            buyerId: (payload.buyerId as string) || "",
            principalExporterId: (payload.principalExporterId as string) || "",
            calendarId: (payload.calendarId as string) || "",
            conventionId: (payload.conventionId as string) || "",
            transactionDate: (payload.transactionDate as string) || "",
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
      updateStep1Data(data as Step1GeneralInfoData);
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
    let filteredTypes = [...TRANSACTION_LOCATION_TYPES];

    // ⭐ Si l'utilisateur est un actor_manager de type PRODUCERS, retirer OUTSIDE_MARKET
    if (
      user?.role === USER_ROLES_CONSTANTS.ACTOR_MANAGER &&
      user?.actor?.actorType === "PRODUCERS"
    ) {
      filteredTypes = filteredTypes.filter((type) => type !== "OUTSIDE_MARKET");
    }

    // ⭐ Si l'utilisateur est un actor_manager de type BUYER, EXPORTER ou TRANSFORMER,
    // retirer MARKET et CONVENTION
    if (
      user?.role === USER_ROLES_CONSTANTS.ACTOR_MANAGER &&
      ["BUYER", "EXPORTER", "TRANSFORMER"].includes(
        user?.actor?.actorType || ""
      )
    ) {
      filteredTypes = filteredTypes.filter(
        (type) => type !== "MARKET" && type !== "CONVENTION"
      );
    }

    const options = filteredTypes.map((type) => ({
      value: type,
      label: t(`transaction:locationTypes.${type}`),
    }));
    setLocationTypeOptions(options);
  }, [t, user]);

  // Réinitialiser tous les champs quand le type de localisation change
  useEffect(() => {
    // Ne pas réinitialiser lors du chargement initial
    if (isInitialLoad || !watchedLocationType) return;

    // Si c'est la première fois qu'on définit previousLocationType, ne pas réinitialiser
    if (previousLocationType === null) {
      setPreviousLocationType(watchedLocationType);
      return;
    }

    // Ne réinitialiser que si la valeur a vraiment changé
    if (previousLocationType === watchedLocationType) return;

    // Mettre à jour la valeur précédente
    setPreviousLocationType(watchedLocationType);

    // Réinitialiser tous les champs sauf locationType
    form.setValue("sellerId", "");
    form.setValue("buyerId", "");
    form.setValue("principalExporterId", "");
    form.setValue("calendarId", "");
    form.setValue("conventionId", "");
    form.setValue("transactionDate", "");

    // Réinitialiser les options conditionnelles
    setMandatorOptions([]);
    setConventionOptions([]);
    setCalendarOptions([]);

    // Effacer les produits de l'étape 2 car le contexte a changé
    clearProducts();
  }, [
    watchedLocationType,
    form,
    isInitialLoad,
    previousLocationType,
    clearProducts,
  ]);

  // Effacer les produits quand le vendeur change
  useEffect(() => {
    // Ne pas réinitialiser lors du chargement initial
    if (isInitialLoad) return;

    // Si c'est la première fois qu'on définit previousSellerId, ne pas effacer
    if (previousSellerId === null) {
      setPreviousSellerId(watchedSellerId || null);
      return;
    }

    // Ne réinitialiser que si la valeur a vraiment changé
    if (previousSellerId === (watchedSellerId || null)) return;

    // Mettre à jour la valeur précédente
    setPreviousSellerId(watchedSellerId || null);

    // Effacer les produits de l'étape 2 car le vendeur a changé
    clearProducts();
  }, [watchedSellerId, isInitialLoad, previousSellerId, clearProducts]);

  // Filtrer les exportateurs mandants selon l'acheteur sélectionné
  useEffect(() => {
    const loadMandators = async () => {
      if (!watchedBuyerId) {
        setMandatorOptions([]);
        // Ne pas réinitialiser lors du chargement initial
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

          // Ne pas réinitialiser lors du chargement initial
          if (!isInitialLoad) {
            // Réinitialiser si l'exportateur sélectionné n'est plus valide
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

  // Charger les conventions (depuis l'OPA ET l'acheteur sélectionnés)
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

          // Réinitialiser si la convention sélectionnée n'est plus valide
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

  // Charger les calendriers (marchés ou enlèvements selon le type)
  useEffect(() => {
    const loadCalendars = async () => {
      // Pour MARKET: besoin de sellerId (OPA)
      // Pour CONVENTION: besoin de conventionId
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
          // ✅ Pour MARKET: Charger les calendriers de marché de l'OPA sélectionné depuis db.calendars
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

        // Réinitialiser si le calendrier sélectionné n'est plus valide
        if (!isInitialLoad) {
          const currentCalendarId = form.getValues("calendarId");
          if (currentCalendarId) {
            const isValid = allCalendars.some(
              (c) => c.id === currentCalendarId
            );
            if (!isValid) {
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

        // ⭐ MODE OFFLINE - Utiliser IndexedDB
        const allActors = await db.actors
          .where("status")
          .equals("active")
          .and((actor) => actor.actorType !== "PRODUCER")
          .toArray();

        const allActorsOptions = allActors.map((actor) => ({
          value: actor.serverId || actor.localId || "",
          label: `${actor.familyName} ${actor.givenName}`.trim(),
          actorType: actor.actorType,
        }));

        // Tous les acteurs sauf producteurs
        setAllActorsOptions(allActorsOptions);
      } catch {
        setAllActorsOptions([]);
      } finally {
        setIsLoadingData(false);
        // Désactiver le flag après un court délai pour laisser le temps aux autres useEffects de s'exécuter
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
      // Si pas de locationType sélectionné, vider les options
      setSellerOptions([]);
      setBuyerOptions([]);
      return;
    }

    console.log("watchedLocationType", watchedLocationType);

    if (watchedLocationType === "MARKET") {
      // Pour MARCHE: vendeur = OPA uniquement, acheteur = autres acteurs (BUYER, EXPORTER, TRANSFORMER)
      let opaOptions = allActorsOptions.filter(
        (actor) => actor.actorType === "PRODUCERS"
      );

      // ⭐ Si l'utilisateur est un actor_manager de type PRODUCERS, filtrer uniquement son OPA
      if (
        user?.role === USER_ROLES_CONSTANTS.ACTOR_MANAGER &&
        user?.actor?.actorType === "PRODUCERS" &&
        user?.actor?.id
      ) {
        opaOptions = opaOptions.filter(
          (actor) => actor.value === user.actor?.id
        );
      }

      setSellerOptions(opaOptions);
      setBuyerOptions(
        allActorsOptions.filter((actor) => actor.actorType !== "PRODUCERS")
      );
    } else if (watchedLocationType === "CONVENTION") {
      // Pour CONVENTION: vendeur = OPA uniquement, acheteur = EXPORTER ou BUYER uniquement
      let opaOptions = allActorsOptions.filter(
        (actor) => actor.actorType === "PRODUCERS"
      );

      // ⭐ Si l'utilisateur est un actor_manager de type PRODUCERS, filtrer uniquement son OPA
      if (
        user?.role === USER_ROLES_CONSTANTS.ACTOR_MANAGER &&
        user?.actor?.actorType === "PRODUCERS" &&
        user?.actor?.id
      ) {
        opaOptions = opaOptions.filter(
          (actor) => actor.value === user.actor?.id
        );
      }

      setSellerOptions(opaOptions);
      setBuyerOptions(
        allActorsOptions.filter(
          (actor) =>
            actor.actorType === "EXPORTER" || actor.actorType === "BUYER"
        )
      );
    } else if (watchedLocationType === "OUTSIDE_MARKET") {
      // Pour HORS_MARCHE ou autres types:
      // Vendeur = BUYER ou EXPORTER
      // Acheteur = BUYER, EXPORTER ou TRANSFORMER
      // Un acteur ne peut pas être à la fois vendeur et acheteur
      let sellerActors = allActorsOptions.filter(
        (actor) =>
          (actor.actorType === "BUYER" || actor.actorType === "EXPORTER") &&
          actor.value !== watchedBuyerId // Exclure l'acheteur déjà sélectionné
      );

      // ⭐ Si l'utilisateur est un actor_manager de type BUYER, EXPORTER ou TRANSFORMER,
      // ne garder que son propre acteur comme vendeur
      if (
        user?.role === USER_ROLES_CONSTANTS.ACTOR_MANAGER &&
        ["BUYER", "EXPORTER", "TRANSFORMER"].includes(
          user?.actor?.actorType || ""
        ) &&
        user?.actor?.id
      ) {
        sellerActors = sellerActors.filter(
          (actor) => actor.value === user.actor?.id
        );
      }

      setSellerOptions(sellerActors);

      let buyerActors = allActorsOptions.filter(
        (actor) =>
          (actor.actorType === "BUYER" ||
            actor.actorType === "EXPORTER" ||
            actor.actorType === "TRANSFORMER") &&
          actor.value !== watchedSellerId // Exclure le vendeur déjà sélectionné
      );

      // ⭐ Si l'utilisateur est un actor_manager de type BUYER, EXPORTER ou TRANSFORMER,
      // exclure son propre acteur de la liste des acheteurs
      if (
        user?.role === USER_ROLES_CONSTANTS.ACTOR_MANAGER &&
        ["BUYER", "EXPORTER", "TRANSFORMER"].includes(
          user?.actor?.actorType || ""
        ) &&
        user?.actor?.id
      ) {
        buyerActors = buyerActors.filter(
          (actor) => actor.value !== user.actor?.id
        );
      }

      setBuyerOptions(buyerActors);
    }
  }, [
    watchedLocationType,
    allActorsOptions,
    watchedSellerId,
    watchedBuyerId,
    user,
  ]);

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

  // Afficher un loader pendant le chargement des données
  if (isLoadingData) {
    return <LoadingFallback message={t("common:messages.loading")} />;
  }

  // Header content
  const headerContent = (
    <div className="flex items-center space-x-3">
      <h1 className="text-xl font-medium text-gray-900">
        {t("transaction:saleAdd.steps.generalInfo")}
      </h1>
    </div>
  );

  return (
    <SaleFormLayout className="lg:flex items-start lg:space-x-4">
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
              {/* Type de localisation */}
              <div className="lg:w-1/2">
                <FormSelect
                  form={form}
                  name="locationType"
                  label={t("transaction:saleAdd.fields.locationType")}
                  placeholder=""
                  options={locationTypeOptions}
                  required
                />
              </div>

              <Separator className="my-6" />

              {/* Vendeur */}
              <div className="lg:w-1/2">
                <FormInputAutocompletion
                  form={form}
                  name="sellerId"
                  label={t("transaction:saleAdd.fields.seller")}
                  placeholder=""
                  options={sellerOptions}
                  required
                  disabled={!watchedLocationType}
                />
              </div>

              {/* Acheteur */}
              <div className="lg:w-1/2">
                <FormInputAutocompletion
                  form={form}
                  name="buyerId"
                  label={t("transaction:saleAdd.fields.buyer")}
                  placeholder=""
                  options={buyerOptions}
                  required
                  disabled={!watchedLocationType}
                />
              </div>

              {/* Exportateur principal (conditionnel - seulement si acheteur sélectionné et a des mandants) */}
              {watchedBuyerId && mandatorOptions.length > 0 && (
                <div className="lg:w-1/2">
                  <FormInputAutocompletion
                    form={form}
                    name="principalExporterId"
                    label={t("transaction:saleAdd.fields.principalExporter")}
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
                    label={t("transaction:saleAdd.fields.calendar")}
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
                      label={t("transaction:saleAdd.fields.convention")}
                      placeholder=""
                      options={conventionOptions}
                      required
                      disabled={!watchedSellerId || !watchedBuyerId}
                    />
                  </div>

                  {/* Calendrier (marché/enlèvement) pour CONVENTION */}
                  <div className="lg:w-1/2">
                    <FormInputAutocompletion
                      form={form}
                      name="calendarId"
                      label={t("transaction:saleAdd.fields.calendar")}
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
                  label={t("transaction:saleAdd.fields.transactionDate")}
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
    </SaleFormLayout>
  );
}
