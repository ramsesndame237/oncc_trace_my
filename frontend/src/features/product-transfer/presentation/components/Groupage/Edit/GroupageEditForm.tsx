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
  receiverActorId: string;
  receiverStoreId: string;
  transferDate: string;
};

export function GroupageEditForm() {
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
  const [senderActorOptions, setSenderActorOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [receiverActorOptions, setReceiverActorOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [storeOptions, setStoreOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);

  // Stocker les acteurs complets pour accéder à leurs magasins
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
    }>
  >([]);

  // Créer le schéma de validation avec useMemo pour éviter la récursion de type
  const validationSchema = useMemo(
    () =>
      z.object({
        senderActorId: z.string(),
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

  // Charger les acteurs (Producteurs et OPA)
  useEffect(() => {
    const loadActors = async () => {
      try {
        // if (isOnline) {
        //   // MODE ONLINE - Utiliser syncAll
        //   const syncAllActorsUseCase = container.resolve(SyncAllActorsUseCase);

        //   // Charger les Producteurs (expéditeurs)
        //   const producerResult = await syncAllActorsUseCase.execute([
        //     "PRODUCER",
        //   ]);

        //   const producerOpts = producerResult.actors
        //     .filter((actor) => actor.status === "active")
        //     .map((actor) => ({
        //       value: actor.id,
        //       label: `${actor.familyName} ${actor.givenName}`.trim(),
        //     }));

        //   setSenderActorOptions(producerOpts);

        //   // Charger les OPA (destinataires) avec leurs magasins
        //   const opaResult = await syncAllActorsUseCase.execute(["PRODUCERS"]);

        //   const activeOpaActors = opaResult.actors.filter(
        //     (actor) => actor.status === "active"
        //   );

        //   // Mapper les acteurs pour garantir que le status des stores est défini
        //   const mappedOpaActors = activeOpaActors.map((actor) => ({
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

        //   // Stocker les acteurs complets (avec leurs magasins)
        //   setReceiverActors(mappedOpaActors);

        //   const opaOpts = activeOpaActors.map((actor) => ({
        //     value: actor.id,
        //     label: `${actor.familyName} ${actor.givenName}`.trim(),
        //   }));

        //   setReceiverActorOptions(opaOpts);
        // } else {
        // MODE OFFLINE - Utiliser IndexedDB

        // Charger Producteurs depuis IndexedDB
        const producerActors = await db.actors
          .where("actorType")
          .equals("PRODUCER")
          .toArray();

        const producerOpts = producerActors.map((actor) => ({
          value: actor.serverId || actor.localId || "",
          label: `${actor.familyName} ${actor.givenName}`.trim(),
        }));

        setSenderActorOptions(producerOpts);

        // Charger OPA depuis IndexedDB avec leurs magasins
        const opaActors = await db.actors
          .where("actorType")
          .equals("PRODUCERS")
          .toArray();

        // Mapper les acteurs pour garantir que le status des stores est défini
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

        // Stocker les acteurs complets (avec leurs magasins)
        setReceiverActors(mappedOpaActors);

        const opaOpts = opaActors.map((actor) => ({
          value: actor.serverId || actor.localId || "",
          label: `${actor.familyName} ${actor.givenName}`.trim(),
        }));

        setReceiverActorOptions(opaOpts);
        // }
      } catch {
        // Silently fail - actor loading is not critical
        setSenderActorOptions([]);
        setReceiverActorOptions([]);
      }
    };

    loadActors();
  }, [isOnline]);

  // Observer le changement du receiverActorId pour récupérer les magasins de l'OPA
  const receiverActorId = form.watch("receiverActorId");

  // Récupérer les magasins directement depuis l'OPA sélectionnée
  useEffect(() => {
    if (!receiverActorId) {
      setStoreOptions([]);
      // Ne réinitialiser la valeur que si elle est déjà définie (évite d'effacer au chargement initial)
      const currentStoreId = form.getValues("receiverStoreId");
      if (currentStoreId) {
        form.setValue("receiverStoreId", "");
      }
      return;
    }

    // Si les acteurs ne sont pas encore chargés, ne rien faire (évite de reset prématurément)
    if (receiverActors.length === 0) {
      return;
    }

    // Trouver l'OPA sélectionnée dans la liste des acteurs chargés
    const selectedOpa = receiverActors.find(
      (actor) => actor.id === receiverActorId
    );

    if (selectedOpa && selectedOpa.stores) {
      const currentStoreId = form.getValues("receiverStoreId");

      // Filtrer les magasins actifs, mais inclure aussi le magasin actuellement sélectionné même s'il est inactif
      const filteredStores = selectedOpa.stores.filter(
        (store) => store.status === "active" || store.id === currentStoreId
      );

      const storeOpts = filteredStores.map((store) => ({
        value: store.id,
        label: `${store.name}${store.code ? ` (${store.code})` : ""}`,
      }));

      setStoreOptions(storeOpts);

      // Ne réinitialiser le magasin que s'il n'existe pas du tout dans les stores de l'OPA
      if (
        currentStoreId &&
        !selectedOpa.stores.find((s) => s.id === currentStoreId)
      ) {
        form.setValue("receiverStoreId", "");
      }
    } else {
      setStoreOptions([]);
      // Ne réinitialiser que si une valeur existe déjà
      const currentStoreId = form.getValues("receiverStoreId");
      if (currentStoreId) {
        form.setValue("receiverStoreId", "");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [receiverActorId, receiverActors]); // Retirer 'form' des dépendances pour éviter des boucles

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

  // Vérifier que c'est bien un transfert GROUPAGE
  if (productTransfer.transferType !== "GROUPAGE") {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-destructive mb-4">
            {t("form.edit.onlyGroupageError")}
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
            {/* Expéditeur (Producteur) - désactivé */}
            <div className="lg:w-1/2">
              <FormInputAutocompletion
                form={form}
                name="senderActorId"
                label={t("form.step1.senderActor")}
                placeholder=""
                emptyMessage={tCommon("messages.noResults")}
                options={senderActorOptions}
                required
                disabled
              />
            </div>

            <Separator />

            {/* Destinataire (OPA) - désactivé */}
            <div className="lg:w-1/2">
              <FormInputAutocompletion
                form={form}
                name="receiverActorId"
                label={t("form.step1.receiverActor")}
                placeholder=""
                emptyMessage={tCommon("messages.noResults")}
                options={receiverActorOptions}
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
                options={storeOptions}
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
