"use client";

import { FormDatePicker } from "@/components/forms";
import FormInputAutocompletion from "@/components/forms/form-input-autocompletion";
import { Icon } from "@/components/icon";
import { BaseCard } from "@/components/modules/base-card";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { USER_ROLES_CONSTANTS } from "@/core/domain/generated/user-roles.types";
import { db } from "@/core/infrastructure/database/db";
import { useAuth } from "@/features/auth";
import { useLocale } from "@/hooks/useLocale";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useConventionFormStore } from "../../infrastructure/store/conventionFormStore";
import { useConventionFormNavigation } from "../hooks";
import {
  createStep1Schema,
  type Step1Data,
} from "../schemas/convention-validation-schemas";
import { ConventionFormLayout } from "./ConventionFormLayout";

export function ConventionCreateStep1() {
  const { t } = useTranslation(["convention", "common"]);
  const { currentLocale } = useLocale();
  const router = useRouter();
  const { user } = useAuth();

  const {
    formData,
    updateStep1Data,
    setCurrentStep,
    setStepValidation,
    saveProgress,
    entityId,
    editOffline,
  } = useConventionFormStore();

  const { navigateToNext, handleCancel } = useConventionFormNavigation();
  const [isNavigating, setIsNavigating] = useState(false);

  // Réinitialiser isNavigating quand le composant est monté (après PinGuard par exemple)
  useEffect(() => {
    setIsNavigating(false);
  }, []);

  // States pour les options
  const [buyerExporterOptions, setBuyerExporterOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [opaOptions, setOpaOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [isLoadingActors, setIsLoadingActors] = useState(true);

  // Form setup
  const form = useForm<Step1Data>({
    resolver: zodResolver(createStep1Schema(t)),
    defaultValues: formData.step1,
    mode: "onChange",
    criteriaMode: "firstError",
    shouldFocusError: true,
  });

  const { isValid } = form.formState;

  // Initialiser l'étape courante
  useEffect(() => {
    setCurrentStep(1);
  }, [setCurrentStep]);

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
          form.reset({
            buyerExporterId: (payload.buyerExporterId as string) || "",
            producersId: (payload.producersId as string) || "",
            signatureDate: (payload.signatureDate as string) || "",
          });
        }
      } catch {
        // Silently fail - offline data loading is not critical
      }
    };

    loadOfflineData();
  }, [entityId, editOffline, form]);

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

  // Charger les exportateurs/acheteurs et OPA
  useEffect(() => {
    const loadActors = async () => {
      try {
        setIsLoadingActors(true);

        // Charger exportateurs et acheteurs depuis IndexedDB
        const buyerExporterActors = await db.actors
          .where("actorType")
          .anyOf(["EXPORTER", "BUYER"])
          .and((actor) => actor.status === "active")
          .toArray();

        const buyerExporterOpts = buyerExporterActors.map((actor) => ({
          value: actor.serverId || actor.localId || "",
          label: `${actor.familyName} ${actor.givenName}`.trim(),
        }));

        setBuyerExporterOptions(buyerExporterOpts);

        // Charger les OPA depuis IndexedDB
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
        setBuyerExporterOptions([]);
        setOpaOptions([]);
      } finally {
        setIsLoadingActors(false);
      }
    };

    loadActors();
  }, [user]);

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
        disabled={!isValid || isNavigating || isLoadingActors}
      >
        {isLoadingActors
          ? t("common:messages.loading")
          : t("common:actions.next")}
      </Button>
    </div>
  );

  // Header content
  const headerContent = (
    <div className="flex items-center space-x-3">
      <h1 className="text-xl font-medium text-gray-900">
        {t("convention:form.step1.cardTitle")}
      </h1>
    </div>
  );

  return (
    <ConventionFormLayout
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
            <div className="lg:w-1/2">
              <FormInputAutocompletion
                form={form}
                name="buyerExporterId"
                placeholder=""
                label={t("convention:form.step1.buyerExporter")}
                emptyMessage={t("common:messages.noResults")}
                options={buyerExporterOptions}
                required
                disabled={isLoadingActors}
              />
            </div>

            <div className="lg:w-1/2">
              {/* Sélection OPA */}
              <FormInputAutocompletion
                form={form}
                name="producersId"
                placeholder=""
                label={t("convention:form.step1.opa")}
                emptyMessage={t("common:messages.noResults")}
                options={opaOptions}
                required
                disabled={isLoadingActors}
              />
            </div>
            <div className="lg:w-1/2">
              <FormDatePicker
                form={form}
                name="signatureDate"
                label={t("convention:form.step1.signatureDate")}
                placeholder=""
                typeCalendar="v2"
                locale={currentLocale}
                required
              />
            </div>
          </form>
        </Form>
      </BaseCard>
    </ConventionFormLayout>
  );
}
