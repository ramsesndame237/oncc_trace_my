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
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useGroupageAddFormStore } from "../../../../infrastructure/store/groupageAddFormStore";
import { useGroupageAddFormNavigation } from "../../../hooks/useGroupageAddFormNavigation";
import {
  step1Schema,
  type Step1Data,
} from "../../../schemas/groupage-validation-schemas";
import { GroupageFormLayout } from "./GroupageFormLayout";

export function GroupageAddStep1() {
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
  } = useGroupageAddFormStore();

  const { navigateToNext } = useGroupageAddFormNavigation();
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
  const [storeOptions, setStoreOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [isLoadingActors, setIsLoadingActors] = useState(true);

  // ⭐ Stocker les acteurs complets pour accéder à leurs magasins et producteurs
  const [receiverActors, setReceiverActors] = useState<
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
      producers?: Array<{
        id: string;
        familyName: string;
        givenName: string;
        onccId: string;
        membershipDate?: string;
        status?: string;
      }>;
    }>
  >([]);

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

          // Pré-remplir le formulaire avec les données du payload
          form.reset({
            senderActorId: (payload.senderActorId as string) || "",
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

  // Charger les acteurs (OPA uniquement - les Producteurs seront filtrés selon l'OPA sélectionnée)
  useEffect(() => {
    const loadActors = async () => {
      try {
        setIsLoadingActors(true);

        // ⭐ MODE OFFLINE - Utiliser IndexedDB

        // Charger OPA depuis IndexedDB avec leurs magasins et producteurs
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

        // ⭐ Mapper les acteurs pour garantir que le status des stores est défini
        const mappedOpaActors = opaActors.map((actor) => ({
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

        // ⭐ Stocker les acteurs complets (avec leurs magasins et producteurs)
        setReceiverActors(mappedOpaActors);

        const opaOpts = opaActors.map((actor) => ({
          value: actor.serverId || actor.localId || "",
          label: `${actor.familyName} ${actor.givenName}`.trim(),
        }));

        setReceiverActorOptions(opaOpts);

        // ⭐ Vider les options de sender (seront remplies après sélection du receiver)
        setSenderActorOptions([]);
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

  // Observer le changement du receiverActorId pour récupérer les magasins de l'OPA
  const receiverActorId = form.watch("receiverActorId");

  // ⭐ Charger les magasins et producteurs quand l'OPA est sélectionnée
  useEffect(() => {
    const loadStoresAndProducers = async () => {
      if (!receiverActorId) {
        setStoreOptions([]);
        setSenderActorOptions([]);
        // Réinitialiser la valeur du magasin destinataire et du sender
        form.setValue("receiverStoreId", "");
        form.setValue("senderActorId", "");
        return;
      }

      // ⚠️ Ne pas traiter si les acteurs sont encore en cours de chargement
      // Cela évite de vider receiverStoreId lors du retour depuis le récapitulatif
      if (isLoadingActors) {
        return;
      }

      try {
        // Trouver l'OPA sélectionnée dans la liste des acteurs chargés
        const selectedOpa = receiverActors.find(
          (actor) => actor.id === receiverActorId
        );

        if (selectedOpa) {
          console.log("selectedOpa", selectedOpa);
          // ⭐ Filtrer uniquement les magasins actifs
          if (selectedOpa.stores) {
            const activeStores = selectedOpa.stores.filter(
              (store) => store.status === "active"
            );

            const storeOpts = activeStores.map((store) => ({
              value: store.id,
              label: `${store.name}${store.code ? ` (${store.code})` : ""}`,
            }));

            setStoreOptions(storeOpts);

            // Réinitialiser la valeur du magasin destinataire si elle n'est plus valide
            const currentStoreId = form.getValues("receiverStoreId");
            if (
              currentStoreId &&
              !storeOpts.find((opt) => opt.value === currentStoreId)
            ) {
              form.setValue("receiverStoreId", "");
            }
          } else {
            setStoreOptions([]);
            form.setValue("receiverStoreId", "");
          }

          // ✅ Charger les producteurs depuis la table producerOpaRelations
          const producerRelations = await db.producerOpaRelations
            .where("opaServerId")
            .equals(receiverActorId)
            .or("opaLocalId")
            .equals(receiverActorId)
            .toArray();

          if (producerRelations && producerRelations.length > 0) {
            // Récupérer les détails des producteurs depuis db.actors
            const producerIds = producerRelations.map(
              (rel) => rel.producerServerId || rel.producerLocalId || ""
            );

            const producers = await db.actors
              .where("serverId")
              .anyOf(producerIds)
              .or("localId")
              .anyOf(producerIds)
              .toArray();

            const producerOpts = producers
              .filter((producer) => producer.status === "active")
              .map((producer) => ({
                value: producer.serverId || producer.localId || "",
                label: `${producer.familyName} ${producer.givenName}`.trim(),
              }));

            setSenderActorOptions(producerOpts);

            // Réinitialiser le sender si il n'est plus valide pour cette OPA
            const currentSenderId = form.getValues("senderActorId");
            if (
              currentSenderId &&
              !producerOpts.find((opt) => opt.value === currentSenderId)
            ) {
              form.setValue("senderActorId", "");
            }
          } else {
            setSenderActorOptions([]);
            form.setValue("senderActorId", "");
          }
        } else {
          setStoreOptions([]);
          setSenderActorOptions([]);
          form.setValue("receiverStoreId", "");
          form.setValue("senderActorId", "");
        }
      } catch {
        // Silently fail - store/producer loading is not critical
        setStoreOptions([]);
        setSenderActorOptions([]);
        form.setValue("receiverStoreId", "");
        form.setValue("senderActorId", "");
      } finally {
        setIsLoadingActors(false);
      }
    };
    loadStoresAndProducers();
  }, [receiverActorId, receiverActors, form, isLoadingActors]);

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
    <GroupageFormLayout>
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
              {/* Destinataire (OPA) - À sélectionner en premier */}
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

              {/* Magasin destinataire - Visible uniquement si une OPA est sélectionnée */}
              <div className="lg:w-1/2">
                <FormInputAutocompletion
                  form={form}
                  name="receiverStoreId"
                  label={t("productTransfer:form.step1.receiverStore")}
                  placeholder=""
                  emptyMessage={t("common:messages.noResults")}
                  options={storeOptions}
                  required
                  disabled={!receiverActorId || storeOptions.length === 0}
                />
              </div>

              <Separator />

              {/* Expéditeur (Producteur membre de l'OPA sélectionnée) */}
              <div className="lg:w-1/2">
                <FormInputAutocompletion
                  form={form}
                  name="senderActorId"
                  label={t("productTransfer:form.step1.senderActor")}
                  placeholder=""
                  emptyMessage={t("common:messages.noResults")}
                  options={senderActorOptions}
                  required
                  disabled={!receiverActorId || senderActorOptions.length === 0}
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
    </GroupageFormLayout>
  );
}
