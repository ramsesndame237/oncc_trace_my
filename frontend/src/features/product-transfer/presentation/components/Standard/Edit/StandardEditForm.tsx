"use client";

import { FormDatePicker } from "@/components/forms";
import FormInputAutocompletion from "@/components/forms/form-input-autocompletion";
import { Icon } from "@/components/icon";
import { BaseCard } from "@/components/modules/base-card";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { db } from "@/core/infrastructure/database/db";
import { useProductTransferStore } from "@/features/product-transfer/infrastructure/store/productTransferStore";
import { useGetProductTransferById } from "@/features/product-transfer/presentation/hooks/useGetProductTransferById";
import { useLocale } from "@/hooks/useLocale";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";
import { ProductTransferFormLayout } from "../../ProductTransferFormLayout";

// Type pour les données du formulaire d'édition
type EditFormData = {
  senderActorId: string;
  senderStoreId: string;
  receiverActorId: string;
  receiverStoreId: string;
  transferDate: string;
};

export function StandardEditForm() {
  const { t } = useTranslation("productTransfer");
  const { t: tCommon } = useTranslation("common");
  const { currentLocale } = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const transferId = searchParams.get("entityId");
  const editOffline = searchParams.has("editOffline");
  const isOnline = useOnlineStatus();

  const { updateProductTransfer } = useProductTransferStore();
  // Ne charger depuis l'API que si on n'est PAS en mode editOffline
  const { productTransfer, isLoading, error } = useGetProductTransferById(
    transferId && !editOffline ? transferId : "",
    isOnline
  );

  const [isSaving, setIsSaving] = useState(false);

  // States pour les options
  const [actorOptions, setActorOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [senderStoreOptions, setSenderStoreOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [receiverStoreOptions, setReceiverStoreOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);

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

  // Créer le schéma de validation avec useMemo pour éviter la récursion de type
  const validationSchema = useMemo(
    () =>
      z.object({
        senderActorId: z.string(),
        senderStoreId: z.string(),
        receiverActorId: z.string(),
        receiverStoreId: z.string(),
        transferDate: z.string().min(1, {
          message: t("form.step1.validation.transferDateRequired"),
        }),
      }),
    [t]
  );

  // Form setup
  const form = useForm<EditFormData>({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      senderActorId: "",
      senderStoreId: "",
      receiverActorId: "",
      receiverStoreId: "",
      transferDate: "",
    },
    mode: "onChange",
    criteriaMode: "firstError",
    shouldFocusError: true,
  });

  const { isValid } = form.formState;

  // Mettre à jour les valeurs du formulaire quand les données sont chargées (mode online)
  useEffect(() => {
    if (productTransfer && !editOffline) {
      form.reset({
        senderActorId: productTransfer.senderActorId || "",
        senderStoreId: productTransfer.senderStoreId || "",
        receiverActorId: productTransfer.receiverActorId || "",
        receiverStoreId: productTransfer.receiverStoreId || "",
        transferDate: productTransfer.transferDate || "",
      });
    }
  }, [productTransfer, editOffline, form]);

  // Charger les données offline si en mode editOffline
  useEffect(() => {
    const loadOfflineData = async () => {
      if (!transferId || !editOffline) return;

      try {
        const pendingOperation = await db.pendingOperations
          .where("entityId")
          .equals(transferId)
          .first();

        if (pendingOperation && pendingOperation.payload) {
          const payload = pendingOperation.payload as Record<string, unknown>;

          // Pré-remplir le formulaire avec les données du payload
          const offlineData: EditFormData = {
            senderActorId: (payload.senderActorId as string) || "",
            senderStoreId: (payload.senderStoreId as string) || "",
            receiverActorId: (payload.receiverActorId as string) || "",
            receiverStoreId: (payload.receiverStoreId as string) || "",
            transferDate: (payload.transferDate as string) || "",
          };

          form.reset(offlineData);
        }
      } catch {
        // Silently fail - offline data loading is not critical
      }
    };

    loadOfflineData();
  }, [transferId, editOffline, form]);

  // Charger les acteurs (tous sauf producteurs)
  useEffect(() => {
    const loadActors = async () => {
      try {
        // if (isOnline) {
        //   // MODE ONLINE - Utiliser syncAll
        //   const syncAllActorsUseCase = container.resolve(SyncAllActorsUseCase);

        //   // Charger tous les acteurs sauf PRODUCER
        //   const actorResult = await syncAllActorsUseCase.execute([
        //     "PRODUCERS",
        //     "BUYER",
        //     "EXPORTER",
        //     "TRANSFORMER",
        //   ]);

        //   const activeActors = actorResult.actors.filter(
        //     (actor) => actor.status === "active"
        //   );

        //   // Mapper les acteurs pour garantir que le status des stores est défini
        //   const mappedActors = activeActors.map((actor) => ({
        //     id: actor.id,
        //     familyName: actor.familyName,
        //     givenName: actor.givenName,
        //     stores: actor.stores?.map((store) => ({
        //       id: store.id,
        //       name: store.name,
        //       code: store.code,
        //       status: store.status || ("active" as const),
        //     })),
        //   }));

        //   setActors(mappedActors);

        //   const actorOpts = activeActors.map((actor) => ({
        //     value: actor.id,
        //     label: `${actor.familyName} ${actor.givenName}`.trim(),
        //   }));

        //   setActorOptions(actorOpts);
        // } else {
        // MODE OFFLINE - Utiliser IndexedDB
        const allActors = await db.actors
          .where("actorType")
          .anyOf(["PRODUCERS", "BUYER", "EXPORTER", "TRANSFORMER"])
          .and((actor) => actor.status === "active")
          .toArray();

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

        const actorOpts = allActors.map((actor) => ({
          value: actor.serverId || actor.localId || "",
          label: `${actor.familyName} ${actor.givenName}`.trim(),
        }));

        setActorOptions(actorOpts);
        // }
      } catch {
        // Silently fail - actor loading is not critical
        setActorOptions([]);
      }
    };

    loadActors();
  }, [isOnline]);

  // Observer le changement du senderActorId pour récupérer les magasins
  const senderActorId = form.watch("senderActorId");

  useEffect(() => {
    if (!senderActorId) {
      setSenderStoreOptions([]);
      // Réinitialiser la valeur du magasin expéditeur
      form.setValue("senderStoreId", "");
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

      // Réinitialiser la valeur du magasin expéditeur si elle n'est plus valide
      const currentStoreId = form.getValues("senderStoreId");
      if (
        currentStoreId &&
        !storeOpts.find((opt) => opt.value === currentStoreId)
      ) {
        form.setValue("senderStoreId", "");
      }
    } else {
      setSenderStoreOptions([]);
      // Réinitialiser la valeur du magasin expéditeur
      form.setValue("senderStoreId", "");
    }
  }, [senderActorId, actors, form]);

  // Observer le changement du receiverActorId pour récupérer les magasins
  const receiverActorId = form.watch("receiverActorId");
  const senderStoreId = form.watch("senderStoreId");

  useEffect(() => {
    if (!receiverActorId) {
      setReceiverStoreOptions([]);
      // Réinitialiser la valeur du magasin destinataire
      form.setValue("receiverStoreId", "");
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

      // Réinitialiser la valeur du magasin destinataire si elle n'est plus valide
      const currentStoreId = form.getValues("receiverStoreId");
      if (
        currentStoreId &&
        !storeOpts.find((opt) => opt.value === currentStoreId)
      ) {
        form.setValue("receiverStoreId", "");
      }
    } else {
      setReceiverStoreOptions([]);
      // Réinitialiser la valeur du magasin destinataire
      form.setValue("receiverStoreId", "");
    }
  }, [receiverActorId, actors, senderActorId, senderStoreId, form]);

  const handleSubmit = useCallback(
    async (data: EditFormData) => {
      if (!transferId) {
        toast.error(t("view.invalidId"));
        return;
      }

      setIsSaving(true);
      try {
        await updateProductTransfer(
          transferId,
          {
            transferDate: data.transferDate,
          },
          editOffline
        );

        // Message de succès différent selon le mode
        if (editOffline) {
          toast.success(t("form.messages.updateSuccessOffline"));
        } else {
          toast.success(t("form.messages.updateSuccess"));
        }

        // Redirection selon le mode
        if (editOffline) {
          router.push("/outbox");
        } else {
          router.push(`/product-transfers/view?entityId=${transferId}`);
        }
      } catch (err) {
        console.error("Error updating transfer:", err);
        toast.error(t("form.messages.updateError"));
      } finally {
        setIsSaving(false);
      }
    },
    [transferId, router, updateProductTransfer, editOffline, t]
  );

  const handleCancel = useCallback(() => {
    if (!transferId) return;

    // Redirection selon le mode
    if (editOffline) {
      router.push("/outbox");
    } else {
      router.push(`/product-transfers/view?entityId=${transferId}`);
    }
  }, [transferId, editOffline, router]);

  // Vérifier si le bouton enregistrer doit être activé
  const isSaveButtonEnabled = isValid && !isSaving;

  // Footer buttons
  const footerButtons = (
    <div className="flex gap-2 justify-end">
      <Button
        onClick={form.handleSubmit(handleSubmit)}
        disabled={!isSaveButtonEnabled}
      >
        {isSaving ? (
          <>
            <Icon name="Loader2" className="animate-spin" />
            <span>{tCommon("messages.saving")}</span>
          </>
        ) : (
          <span>{tCommon("actions.save")}</span>
        )}
      </Button>
    </div>
  );

  // Header content
  const headerContent = (
    <div className="flex items-center space-x-3">
      <h1 className="text-xl font-medium text-gray-900">
        {t("form.edit.title")}
      </h1>
    </div>
  );

  // Construire le titre du transfert
  const transferTitle = productTransfer
    ? `${t("form.edit.pageTitle")} - ${productTransfer.code}`
    : t("form.edit.pageTitle");

  if (!transferId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">{t("view.invalidId")}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">{t("view.loadingDetails")}</p>
      </div>
    );
  }

  if (error || !productTransfer) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-destructive mb-4">
            {error || t("view.notFoundDescription")}
          </p>
          <Button asChild>
            <a href="/product-transfers">{t("view.backToList")}</a>
          </Button>
        </div>
      </div>
    );
  }

  // Vérifier que c'est bien un transfert STANDARD
  if (productTransfer.transferType !== "STANDARD") {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-destructive mb-4">
            {t("form.edit.onlyStandardError")}
          </p>
          <Button asChild>
            <a href={`/product-transfers/view?entityId=${transferId}`}>
              {t("view.backToDetails")}
            </a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <ProductTransferFormLayout
      className="lg:flex items-start lg:space-x-4"
      title={transferTitle}
      onHandleCancel={handleCancel}
    >
      {/* Bouton Retour AVANT le BaseCard */}
      <div className="py-3">
        <Button variant="link" onClick={handleCancel}>
          <Icon name="ArrowLeft" />
          <span>{tCommon("actions.back")}</span>
        </Button>
      </div>

      <BaseCard
        title={headerContent}
        footer={footerButtons}
        className="w-full flex-1"
        classNameFooter="!justify-between"
      >
        <Form {...form}>
          <form className="space-y-6">
            {/* Expéditeur - désactivé */}
            <div className="lg:w-1/2">
              <FormInputAutocompletion
                form={form}
                name="senderActorId"
                label={t("form.step1.senderActor")}
                placeholder=""
                emptyMessage={tCommon("messages.noResults")}
                options={actorOptions}
                required
                disabled
              />
            </div>

            {/* Magasin expéditeur - désactivé */}
            <div className="lg:w-1/2">
              <FormInputAutocompletion
                form={form}
                name="senderStoreId"
                label={t("fields.senderStore")}
                placeholder=""
                emptyMessage={tCommon("messages.noResults")}
                options={senderStoreOptions}
                required
                disabled
              />
            </div>

            <Separator />

            {/* Destinataire - désactivé */}
            <div className="lg:w-1/2">
              <FormInputAutocompletion
                form={form}
                name="receiverActorId"
                label={t("form.step1.receiverActor")}
                placeholder=""
                emptyMessage={tCommon("messages.noResults")}
                options={actorOptions}
                required
                disabled
              />
            </div>

            {/* Magasin destinataire - désactivé */}
            <div className="lg:w-1/2">
              <FormInputAutocompletion
                form={form}
                name="receiverStoreId"
                label={t("form.step1.receiverStore")}
                placeholder=""
                emptyMessage={tCommon("messages.noResults")}
                options={receiverStoreOptions}
                required
                disabled
              />
            </div>

            <Separator />

            {/* Date de transfert - modifiable */}
            <div className="lg:w-1/2">
              <FormDatePicker
                form={form}
                name="transferDate"
                label={t("form.step1.transferDate")}
                placeholder=""
                typeCalendar="v2"
                locale={currentLocale}
                required
              />
            </div>
          </form>
        </Form>
      </BaseCard>
    </ProductTransferFormLayout>
  );
}
