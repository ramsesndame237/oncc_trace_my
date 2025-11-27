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
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { dayjs } from "@/lib/dayjs";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";
import {
  TRANSACTION_LOCATION_TYPES,
  TransactionLocationType,
} from "../../../../domain/Transaction";
import { TransactionServiceProvider } from "../../../../infrastructure/di/transactionServiceProvider";
import { useGetTransactionById } from "../../../hooks/useGetTransactionById";
import { SaleFormLayout } from "../SaleFormLayout";

// Type pour les données du formulaire d'édition
interface SaleEditFormData {
  locationType: "MARKET" | "CONVENTION" | "OUTSIDE_MARKET" | null;
  sellerId: string;
  buyerId: string;
  principalExporterId: string;
  calendarId: string;
  conventionId: string;
  transactionDate: string;
}

const TRANSACTION_LOCATION_TYPES_ENUM = [...TRANSACTION_LOCATION_TYPES] as [
  TransactionLocationType,
  ...TransactionLocationType[]
];

export function SaleTransactionEditForm() {
  const { t } = useTranslation(["transaction", "common"]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const transactionId = searchParams.get("entityId");
  const isOnline = useOnlineStatus();

  const { transaction, isLoading, error } = useGetTransactionById(
    transactionId || "",
    isOnline
  );

  // Gestion des états de chargement et d'erreur AVANT d'initialiser le formulaire
  if (!transactionId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">
          {t("transaction:view.invalidId")}
        </p>
      </div>
    );
  }

  if (isLoading || !transaction) {
    return <LoadingFallback message={t("common:messages.loading")} />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-destructive mb-4">
            {t("transaction:view.notFoundDescription")}
          </p>
          <Button onClick={() => router.push("/transactions")}>
            {t("transaction:view.backToList")}
          </Button>
        </div>
      </div>
    );
  }

  if (transaction.transactionType !== "SALE") {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-destructive mb-4">
            {t("transaction:edit.wrongTypeError")}
          </p>
          <Button
            onClick={() =>
              router.push(`/transactions/view?entityId=${transactionId}`)
            }
          >
            {t("common:actions.back")}
          </Button>
        </div>
      </div>
    );
  }

  if (transaction.status !== "pending") {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-destructive mb-4">
            {t("transaction:edit.onlyPendingError")}
          </p>
          <Button
            onClick={() =>
              router.push(`/transactions/view?entityId=${transactionId}`)
            }
          >
            {t("common:actions.back")}
          </Button>
        </div>
      </div>
    );
  }

  // Rendre le formulaire seulement quand la transaction est chargée
  return (
    <SaleTransactionEditFormContent
      transaction={transaction}
      transactionId={transactionId}
    />
  );
}

// Composant interne avec le formulaire - reçoit la transaction déjà chargée
function SaleTransactionEditFormContent({
  transaction,
  transactionId,
}: {
  transaction: NonNullable<ReturnType<typeof useGetTransactionById>["transaction"]>;
  transactionId: string;
}) {
  const { t } = useTranslation(["transaction", "common"]);
  const { currentLocale } = useLocale();
  const router = useRouter();
  const { user } = useAuth();

  const [isSaving, setIsSaving] = useState(false);

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
  const [mandatorOptions, setMandatorOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Flag pour le chargement initial (empêche de réinitialiser les valeurs)
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Créer le schéma de validation avec useMemo pour éviter les re-renders
  const validationSchema = useMemo(
    () =>
      z.object({
        locationType: z
          .enum(TRANSACTION_LOCATION_TYPES_ENUM)
          .nullable()
          .refine((val) => val !== null, {
            message: t("transaction:saleAdd.validation.locationTypeRequired"),
          }),
        sellerId: z
          .string()
          .min(1, t("transaction:saleAdd.validation.sellerRequired")),
        buyerId: z
          .string()
          .min(1, t("transaction:saleAdd.validation.buyerRequired")),
        principalExporterId: z.string(),
        calendarId: z.string(),
        conventionId: z.string(),
        transactionDate: z
          .string()
          .min(1, t("transaction:saleAdd.validation.transactionDateRequired")),
      }),
    [t]
  );

  // Default values avec les données de la transaction (transaction est garanti non-null ici)
  const defaultFormValues = useMemo<SaleEditFormData>(
    () => ({
      locationType: transaction.locationType,
      sellerId: transaction.sellerId ?? "",
      buyerId: transaction.buyerId ?? "",
      principalExporterId: transaction.principalExporterId ?? "",
      calendarId: transaction.calendarId ?? "",
      conventionId: transaction.conventionId ?? "",
      transactionDate: transaction.transactionDate
        ? transaction.transactionDate.split("T")[0]
        : "",
    }),
    [transaction]
  );

  // Form setup
  const form = useForm<SaleEditFormData>({
    resolver: zodResolver(validationSchema),
    defaultValues: defaultFormValues,
    values: defaultFormValues,
    mode: "onChange",
    criteriaMode: "firstError",
    shouldFocusError: true,
  });

  const { isValid } = form.formState;

  // Watch les changements
  const watchedLocationType = form.watch("locationType");
  const watchedBuyerId = form.watch("buyerId");
  const watchedSellerId = form.watch("sellerId");
  const watchedConventionId = form.watch("conventionId");

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

        const options = allActors.map((actor) => ({
          value: actor.serverId || actor.localId || "",
          label: `${actor.familyName} ${actor.givenName}`.trim(),
          actorType: actor.actorType,
        }));

        setAllActorsOptions(options);
      } catch {
        setAllActorsOptions([]);
      } finally {
        setIsLoadingData(false);
      }
    };

    loadData();
  }, []);

  // Préparer les options pour locationType
  useEffect(() => {
    let filteredTypes = [...TRANSACTION_LOCATION_TYPES];

    if (
      user?.role === USER_ROLES_CONSTANTS.ACTOR_MANAGER &&
      user?.actor?.actorType === "PRODUCERS"
    ) {
      filteredTypes = filteredTypes.filter((type) => type !== "OUTSIDE_MARKET");
    }

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

  // Déclencher la validation après le chargement des acteurs pour mettre à jour isValid
  useEffect(() => {
    if (!isLoadingData && isInitialLoad) {
      // Déclencher la validation après le chargement pour mettre à jour isValid
      setTimeout(() => {
        form.trigger();
        setIsInitialLoad(false);
      }, 200);
    }
  }, [form, isLoadingData, isInitialLoad]);

  // Filtrer les options de vendeur et acheteur selon le type de localisation
  useEffect(() => {
    if (!watchedLocationType) {
      setSellerOptions([]);
      setBuyerOptions([]);
      return;
    }

    if (watchedLocationType === "MARKET") {
      let opaOptions = allActorsOptions.filter(
        (actor) => actor.actorType === "PRODUCERS"
      );

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
      let opaOptions = allActorsOptions.filter(
        (actor) => actor.actorType === "PRODUCERS"
      );

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
      let sellerActors = allActorsOptions.filter(
        (actor) =>
          (actor.actorType === "BUYER" || actor.actorType === "EXPORTER") &&
          actor.value !== watchedBuyerId
      );

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
          actor.value !== watchedSellerId
      );

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
          const exporterIds = mandateRelations.map(
            (rel) => rel.exporterServerId || rel.exporterLocalId || ""
          );

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
          // ✅ Requête directe sur db.calendars avec nouveaux champs séparés
          const calendarsFromDb = await db.calendars
            .where("producerServerId")
            .equals(watchedSellerId)
            .or("producerLocalId")
            .equals(watchedSellerId)
            .and((cal) => cal.type === calendarType && cal.status === "active")
            .toArray();

          allCalendars = calendarsFromDb.map((calendar) => ({
            id: calendar.serverId || calendar.localId!,
            location: calendar.location,
            startDate: calendar.startDate,
            eventTime: calendar.eventTime,
          }));
        } else if (watchedLocationType === "CONVENTION" && watchedConventionId) {
          // ✅ Requête directe sur db.calendars avec nouveaux champs séparés
          const calendarsFromDb = await db.calendars
            .where("conventionServerId")
            .equals(watchedConventionId)
            .or("conventionLocalId")
            .equals(watchedConventionId)
            .and((cal) => cal.type === calendarType && cal.status === "active")
            .toArray();

          allCalendars = calendarsFromDb.map((calendar) => ({
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

  const handleSubmit = useCallback(
    async (data: SaleEditFormData) => {
      if (!transactionId) {
        toast.error(t("transaction:view.invalidId"));
        return;
      }

      setIsSaving(true);
      try {
        const updateTransactionUseCase =
          TransactionServiceProvider.getUpdateTransactionUseCase();

        await updateTransactionUseCase.execute(transactionId, {
          locationType: data.locationType || undefined,
          sellerId: data.sellerId,
          transactionDate: data.transactionDate,
          buyerId: data.buyerId,
          principalExporterId: data.principalExporterId || null,
          calendarId: data.calendarId || null,
          conventionId: data.conventionId || null,
        });

        toast.success(t("transaction:edit.messages.updateSuccess"));

        router.push(`/transactions/view?entityId=${transactionId}`);
      } catch (err) {
        console.error("Error updating transaction:", err);
        toast.error(
          err instanceof Error
            ? err.message
            : t("transaction:edit.messages.updateError")
        );
      } finally {
        setIsSaving(false);
      }
    },
    [transactionId, router, t]
  );

  const handleCancel = useCallback(() => {
    router.push(`/transactions/view?entityId=${transactionId}`);
  }, [transactionId, router]);

  const isSaveButtonEnabled = isValid && !isSaving && !isLoadingData;

  // Footer buttons
  const footerButtons = (
    <div className="flex gap-2 justify-end">
      <Button
        onClick={form.handleSubmit(handleSubmit)}
        disabled={!isSaveButtonEnabled}
      >
        {isSaving ? t("common:messages.processing") : t("common:actions.save")}
      </Button>
    </div>
  );

  // Afficher le loading si les données des acteurs sont en cours de chargement
  if (isLoadingData) {
    return <LoadingFallback message={t("common:messages.loading")} />;
  }

  // Header content
  const headerContent = (
    <div className="flex items-center space-x-3">
      <h1 className="text-xl font-medium text-gray-900">
        {t("transaction:edit.salePageTitle")}
      </h1>
    </div>
  );

  return (
    <SaleFormLayout
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

              {/* Exportateur principal */}
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

              {/* Calendrier (si MARKET) */}
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

              {/* Convention et Calendrier (si CONVENTION) */}
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
