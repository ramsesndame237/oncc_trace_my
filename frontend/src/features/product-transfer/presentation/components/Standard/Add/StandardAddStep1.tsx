"use client";

import { FormDatePicker } from "@/components/forms";
import FormInputAutocompletion from "@/components/forms/form-input-autocompletion";
import { Icon } from "@/components/icon";
import { BaseCard } from "@/components/modules/base-card";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { USER_ROLES_CONSTANTS } from "@/core/domain/generated/user-roles.types";
import { db } from "@/core/infrastructure/database/db";
import { useAuth } from "@/features/auth";
import { useLocale } from "@/hooks/useLocale";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useStandardAddFormStore } from "../../../../infrastructure/store/standardAddFormStore";
import { useStandardAddFormNavigation } from "../../../hooks/useStandardAddFormNavigation";
import {
  step1Schema,
  type Step1Data,
} from "../../../schemas/standard-validation-schemas";
import { StandardFormLayout } from "./StandardFormLayout";

export function StandardAddStep1() {
  const { t } = useTranslation(["productTransfer", "common"]);
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
  } = useStandardAddFormStore();

  const { navigateToNext } = useStandardAddFormNavigation();
  const [isNavigating, setIsNavigating] = useState(false);

  // Réinitialiser isNavigating quand le composant est monté (après PinGuard par exemple)
  useEffect(() => {
    setIsNavigating(false);
  }, []);

  // States pour les options
  const [senderActorOptions, setSenderActorOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [receiverActorOptions, setReceiverActorOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [senderStoreOptions, setSenderStoreOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [receiverStoreOptions, setReceiverStoreOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [isLoadingActors, setIsLoadingActors] = useState(true);

  // Stocker les acteurs complets pour accéder à leurs magasins
  const [actors, setActors] = useState<
    Array<{
      id: string;
      familyName: string;
      givenName: string;
      stores?: Array<{
        id: string;
        name: string;
        code: string | null;
        status: "active" | "inactive";
      }>;
    }>
  >([]);

  // Références pour tracker les changements d'acteurs
  const previousSenderActorId = useRef<string | null>(null);
  const previousReceiverActorId = useRef<string | null>(null);

  // Form setup
  const form = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
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

          form.reset({
            senderActorId: (payload.senderActorId as string) || "",
            senderStoreId: (payload.senderStoreId as string) || "",
            receiverActorId: (payload.receiverActorId as string) || "",
            receiverStoreId: (payload.receiverStoreId as string) || "",
            transferDate: (payload.transferDate as string) || "",
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

  // Charger les acteurs (tous sauf producteurs)
  useEffect(() => {
    const loadActors = async () => {
      try {
        setIsLoadingActors(true);

        // MODE OFFLINE - Utiliser IndexedDB
        let allActors = await db.actors
          .where("actorType")
          .anyOf(["PRODUCERS", "BUYER", "EXPORTER", "TRANSFORMER"])
          .and((actor) => actor.status === "active")
          .toArray();

        // ⭐ Si l'utilisateur est un actor_manager de type PRODUCERS, filtrer les OPA
        // Ne garder que son propre OPA, mais garder tous les autres types d'acteurs
        if (
          user?.role === USER_ROLES_CONSTANTS.ACTOR_MANAGER &&
          user?.actor?.actorType === "PRODUCERS" &&
          user?.actor?.id
        ) {
          allActors = allActors.filter((actor) => {
            // Si c'est un OPA (PRODUCERS), ne garder que celui de l'utilisateur
            if (actor.actorType === "PRODUCERS") {
              return (
                actor.serverId === user.actor?.id ||
                actor.localId === user.actor?.id
              );
            }
            // Garder tous les autres types (BUYER, EXPORTER, TRANSFORMER)
            return true;
          });
        }

        // Mapper les acteurs pour garantir que le status des stores est défini
        const mappedActors = allActors.map((actor) => ({
          id: actor.serverId || actor.localId || "",
          familyName: actor.familyName,
          givenName: actor.givenName,
          stores: actor.stores?.map((store) => ({
            id: store.id,
            name: store.name,
            code: store.code,
            status: store.status || ("active" as const),
          })),
        }));

        setActors(mappedActors);

        // ⭐ Si l'utilisateur est un actor_manager de type BUYER, EXPORTER ou TRANSFORMER,
        // ne garder que son propre acteur pour la liste des senders
        // et enlever les OPAs de la liste des receivers
        let senderActors = allActors;
        let receiverActors = allActors;
        if (
          user?.role === USER_ROLES_CONSTANTS.ACTOR_MANAGER &&
          ["BUYER", "EXPORTER", "TRANSFORMER"].includes(user?.actor?.actorType || "") &&
          user?.actor?.id
        ) {
          senderActors = allActors.filter(
            (actor) =>
              actor.serverId === user.actor?.id ||
              actor.localId === user.actor?.id
          );
          // Enlever les OPAs (PRODUCERS) de la liste des receivers
          receiverActors = allActors.filter((actor) => actor.actorType !== "PRODUCERS");
        }

        const senderActorOpts = senderActors.map((actor) => ({
          value: actor.serverId || actor.localId || "",
          label: `${actor.familyName} ${actor.givenName}`.trim(),
        }));

        const receiverActorOpts = receiverActors.map((actor) => ({
          value: actor.serverId || actor.localId || "",
          label: `${actor.familyName} ${actor.givenName}`.trim(),
        }));

        setSenderActorOptions(senderActorOpts);
        setReceiverActorOptions(receiverActorOpts);
      } catch {
        // Silently fail - actor loading is not critical
        setSenderActorOptions([]);
        setReceiverActorOptions([]);
      } finally {
        setIsLoadingActors(false);
      }
    };

    loadActors();
  }, [user]);

  // Observer le changement du senderActorId pour récupérer les magasins
  const senderActorId = form.watch("senderActorId");

  useEffect(() => {
    // Ne rien faire si les acteurs ne sont pas encore chargés
    if (actors.length === 0) {
      return;
    }

    // Détecter si c'est un vrai changement d'acteur (pas le chargement initial)
    const hasActorChanged =
      previousSenderActorId.current !== null &&
      previousSenderActorId.current !== senderActorId;

    if (!senderActorId) {
      setSenderStoreOptions([]);
      // Réinitialiser la valeur du magasin expéditeur
      const currentStoreId = form.getValues("senderStoreId");
      if (currentStoreId) {
        form.setValue("senderStoreId", "", { shouldValidate: true });
      }
      previousSenderActorId.current = null;
      return;
    }

    const selectedActor = actors.find((actor) => actor.id === senderActorId);

    if (selectedActor && selectedActor.stores) {
      const activeStores = selectedActor.stores.filter(
        (store) => store.status === "active"
      );

      const storeOpts = activeStores.map((store) => ({
        value: store.id,
        label: `${store.name}${store.code ? ` (${store.code})` : ""}`,
      }));

      setSenderStoreOptions(storeOpts);

      // Si l'acteur a changé, réinitialiser le magasin
      if (hasActorChanged) {
        form.setValue("senderStoreId", "", { shouldValidate: true });
      } else {
        // Sinon, vérifier si la valeur actuelle est toujours valide
        const currentStoreId = form.getValues("senderStoreId");
        if (
          currentStoreId &&
          !storeOpts.find((opt) => opt.value === currentStoreId)
        ) {
          form.setValue("senderStoreId", "", { shouldValidate: true });
        }
      }
    } else {
      setSenderStoreOptions([]);
      // Réinitialiser la valeur du magasin expéditeur
      const currentStoreId = form.getValues("senderStoreId");
      if (currentStoreId) {
        form.setValue("senderStoreId", "", { shouldValidate: true });
      }
    }

    // Mettre à jour la référence
    previousSenderActorId.current = senderActorId;
  }, [senderActorId, actors, form]);

  // Observer le changement du receiverActorId pour récupérer les magasins
  const receiverActorId = form.watch("receiverActorId");
  const senderStoreId = form.watch("senderStoreId");

  useEffect(() => {
    // Ne rien faire si les acteurs ne sont pas encore chargés
    if (actors.length === 0) {
      return;
    }

    // Détecter si c'est un vrai changement d'acteur (pas le chargement initial)
    const hasActorChanged =
      previousReceiverActorId.current !== null &&
      previousReceiverActorId.current !== receiverActorId;

    if (!receiverActorId) {
      setReceiverStoreOptions([]);
      // Réinitialiser la valeur du magasin destinataire
      const currentStoreId = form.getValues("receiverStoreId");
      if (currentStoreId) {
        form.setValue("receiverStoreId", "", { shouldValidate: true });
      }
      previousReceiverActorId.current = null;
      return;
    }

    const selectedActor = actors.find((actor) => actor.id === receiverActorId);

    if (selectedActor && selectedActor.stores) {
      const activeStores = selectedActor.stores.filter(
        (store) => store.status === "active"
      );

      // Si c'est le même acteur que l'expéditeur, filtrer le magasin expéditeur
      const filteredStores =
        senderActorId === receiverActorId
          ? activeStores.filter((store) => store.id !== senderStoreId)
          : activeStores;

      const storeOpts = filteredStores.map((store) => ({
        value: store.id,
        label: `${store.name}${store.code ? ` (${store.code})` : ""}`,
      }));

      setReceiverStoreOptions(storeOpts);

      // Si l'acteur a changé, réinitialiser le magasin
      if (hasActorChanged) {
        form.setValue("receiverStoreId", "", { shouldValidate: true });
      } else {
        // Sinon, vérifier si la valeur actuelle est toujours valide
        const currentStoreId = form.getValues("receiverStoreId");
        if (
          currentStoreId &&
          !storeOpts.find((opt) => opt.value === currentStoreId)
        ) {
          form.setValue("receiverStoreId", "", { shouldValidate: true });
        }
      }
    } else {
      setReceiverStoreOptions([]);
      // Réinitialiser la valeur du magasin destinataire
      const currentStoreId = form.getValues("receiverStoreId");
      if (currentStoreId) {
        form.setValue("receiverStoreId", "", { shouldValidate: true });
      }
    }

    // Mettre à jour la référence
    previousReceiverActorId.current = receiverActorId;
  }, [receiverActorId, actors, senderActorId, senderStoreId, form]);

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

  const isLoading = isLoadingActors;

  // Footer buttons
  const footerButtons = (
    <div className="flex gap-2 justify-end">
      <Button
        onClick={handleNext}
        disabled={!isValid || isNavigating || isLoading}
      >
        {isLoading ? t("common:messages.loading") : t("common:actions.next")}
      </Button>
    </div>
  );

  // Header content
  const headerContent = (
    <div className="flex items-center space-x-3">
      <h1 className="text-xl font-medium text-gray-900">
        {t("productTransfer:form.step1.cardTitle")}
      </h1>
    </div>
  );

  return (
    <StandardFormLayout>
      <div className="lg:flex items-start lg:space-x-4">
        {/* Bouton Retour AVANT le BaseCard */}
        <div className="py-3">
          <Button variant="link" onClick={handleBack}>
            <Icon name="ArrowLeft" />
            <span>{t("common:actions.back")}</span>
          </Button>
        </div>

        <BaseCard
          title={headerContent}
          footer={footerButtons}
          className="w-full"
        >
          <Form {...form}>
            <form className="space-y-6">
              {/* Expéditeur (tous sauf producteurs) */}
              <div className="lg:w-1/2">
                <FormInputAutocompletion
                  form={form}
                  name="senderActorId"
                  label={t("productTransfer:form.step1.senderActor")}
                  placeholder=""
                  emptyMessage={t("common:messages.noResults")}
                  options={senderActorOptions}
                  required
                  disabled={isLoadingActors}
                />
              </div>

              {/* Magasin expéditeur */}
              <div className="lg:w-1/2">
                <FormInputAutocompletion
                  form={form}
                  name="senderStoreId"
                  label={t("productTransfer:fields.senderStore")}
                  placeholder=""
                  emptyMessage={t("common:messages.noResults")}
                  options={senderStoreOptions}
                  required
                  disabled={senderStoreOptions.length === 0}
                />
              </div>

              <Separator />

              {/* Destinataire (tous sauf producteurs) */}
              <div className="lg:w-1/2">
                <FormInputAutocompletion
                  form={form}
                  name="receiverActorId"
                  label={t("productTransfer:form.step1.receiverActor")}
                  placeholder=""
                  emptyMessage={t("common:messages.noResults")}
                  options={receiverActorOptions}
                  required
                  disabled={isLoadingActors}
                />
              </div>

              {/* Magasin destinataire */}
              <div className="lg:w-1/2">
                <FormInputAutocompletion
                  form={form}
                  name="receiverStoreId"
                  label={t("productTransfer:form.step1.receiverStore")}
                  placeholder=""
                  emptyMessage={t("common:messages.noResults")}
                  options={receiverStoreOptions}
                  required
                  disabled={receiverStoreOptions.length === 0}
                />
              </div>

              <Separator />

              {/* Date de transfert */}
              <div className="lg:w-1/2">
                <FormDatePicker
                  form={form}
                  name="transferDate"
                  label={t("productTransfer:form.step1.transferDate")}
                  placeholder=""
                  typeCalendar="v2"
                  locale={currentLocale}
                  required
                />
              </div>
            </form>
          </Form>
        </BaseCard>
      </div>
    </StandardFormLayout>
  );
}
