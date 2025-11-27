"use client";

import { FormDatePicker } from "@/components/forms";
import FormInputAutocompletion from "@/components/forms/form-input-autocompletion";
import { Icon } from "@/components/icon";
import { BaseCard } from "@/components/modules/base-card";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { db } from "@/core/infrastructure/database/db";
import { useLocale } from "@/hooks/useLocale";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useConventionStore } from "../../infrastructure/store/conventionStore";
import { useGetConventionById } from "../hooks/useGetConventionById";
import {
  createStep1Schema,
  type Step1Data,
} from "../schemas/convention-validation-schemas";
import { ConventionFormLayout } from "./ConventionFormLayout";

export function ConventionEdit() {
  const { t } = useTranslation(["convention", "common"]);
  const { currentLocale } = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const conventionId = searchParams.get("entityId");
  const editOffline = searchParams.has("editOffline");

  const { updateConvention } = useConventionStore();
  const { convention, isLoading, error } = useGetConventionById(
    conventionId || ""
  );

  const isOnline = useOnlineStatus();

  // States pour les options
  const [buyerExporterOptions, setBuyerExporterOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [opaOptions, setOpaOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [isSaving, setIsSaving] = useState(false);

  // Créer le schéma de validation
  const validationSchema = createStep1Schema(t);

  // Form setup
  const form = useForm<Step1Data>({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      buyerExporterId: "",
      producersId: "",
      signatureDate: "",
    },
    mode: "onChange",
    criteriaMode: "firstError",
    shouldFocusError: true,
  });

  const { isValid } = form.formState;

  // Charger les données de la convention (online ou offline)
  useEffect(() => {
    const loadConventionData = async () => {
      if (!conventionId) return;

      // Si en mode editOffline, charger depuis pendingOperations
      if (editOffline) {
        try {
          const pendingOperation = await db.pendingOperations
            .where("entityId")
            .equals(conventionId)
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
          // Erreur lors du chargement des données offline
        }
        return;
      }

      // Mode online : charger depuis l'API
      if (convention) {
        form.reset({
          buyerExporterId: convention.buyerExporterId || "",
          producersId: convention.producersId || "",
          signatureDate: convention.signatureDate || "",
        });
      }
    };

    loadConventionData();
  }, [conventionId, editOffline, convention, form]);

  // Charger les exportateurs/acheteurs et OPA
  useEffect(() => {
    const loadActors = async () => {
      try {
        // if (isOnline) {
        //   // MODE ONLINE - Utiliser syncAll
        //   const syncAllActorsUseCase = container.resolve(SyncAllActorsUseCase);

        //   // Charger exportateurs et acheteurs
        //   const buyerExporterResult = await syncAllActorsUseCase.execute([
        //     "EXPORTER",
        //     "BUYER",
        //   ]);

        //   const buyerExporterOpts = buyerExporterResult.actors
        //     .filter((actor) => actor.status === "active")
        //     .map((actor) => ({
        //       value: actor.id,
        //       label: `${actor.familyName} ${actor.givenName}`.trim(),
        //     }));

        //   setBuyerExporterOptions(buyerExporterOpts);

        //   // Charger les OPA
        //   const opaResult = await syncAllActorsUseCase.execute(["PRODUCERS"]);

        //   const opaOpts = opaResult.actors
        //     .filter((actor) => actor.status === "active")
        //     .map((actor) => ({
        //       value: actor.id,
        //       label: `${actor.familyName} ${actor.givenName}`.trim(),
        //     }));

        //   setOpaOptions(opaOpts);
        // } else {
        // MODE OFFLINE
        const buyers = await db.actors
          .filter(
            (actor) =>
              (actor.actorType === "BUYER" || actor.actorType === "EXPORTER") &&
              actor.status === "active"
          )
          .toArray();

        const buyerExporterOpts = buyers.map((actor) => ({
          value: actor.serverId || actor.localId || "",
          label: `${actor.familyName} ${actor.givenName}`.trim(),
        }));

        setBuyerExporterOptions(buyerExporterOpts);

        const producers = await db.actors
          .filter(
            (actor) =>
              actor.actorType === "PRODUCERS" && actor.status === "active"
          )
          .toArray();

        const opaOpts = producers.map((actor) => ({
          value: actor.serverId || actor.localId || "",
          label: `${actor.familyName} ${actor.givenName}`.trim(),
        }));

        setOpaOptions(opaOpts);
        // }
      } catch {
        toast.error(t("convention:messages.loadError"));
      }
    };

    loadActors();
  }, [isOnline, t]);

  const handleSubmit = useCallback(
    async (data: Step1Data) => {
      if (!conventionId) {
        toast.error(t("view.invalidId"));
        return;
      }

      setIsSaving(true);
      try {
        await updateConvention(
          conventionId,
          {
            buyerExporterId: data.buyerExporterId,
            producersId: data.producersId,
            signatureDate: data.signatureDate,
          },
          editOffline
        );

        // Rediriger selon le mode
        if (editOffline) {
          // En mode offline, retourner à la liste des conventions
          router.push("/outbox");
        } else {
          // En mode online, retourner à la vue de la convention
          router.push(`/conventions/view?entityId=${conventionId}`);
        }
      } catch {
        toast.error(t("convention:messages.updateError"));
      } finally {
        setIsSaving(false);
      }
    },
    [conventionId, router, updateConvention, editOffline, t]
  );

  const handleCancel = useCallback(() => {
    if (!conventionId) return;

    // En mode offline, retourner à la liste
    if (editOffline) {
      router.push("/conventions");
    } else {
      // En mode online, retourner à la vue de détails
      router.push(`/conventions/view?entityId=${conventionId}`);
    }
  }, [conventionId, editOffline, router]);

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
            <span>{t("common:messages.saving")}</span>
          </>
        ) : (
          <span>{t("common:actions.save")}</span>
        )}
      </Button>
    </div>
  );

  // Header content
  const headerContent = (
    <div className="flex items-center space-x-3">
      <h1 className="text-xl font-medium text-gray-900">
        {t("form.step1.cardTitle")}
      </h1>
    </div>
  );

  // Construire le titre de la convention
  const conventionTitle = convention
    ? `Convention - ${convention.buyerExporter?.familyName || ""} ${
        convention.buyerExporter?.givenName || ""
      } / ${convention.producers?.familyName || ""} ${
        convention.producers?.givenName || ""
      }`
    : t("form.editTitle");

  if (!conventionId) {
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

  if (error || !convention) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-destructive mb-4">
            {error || t("view.notFoundDescription")}
          </p>
          <Button asChild>
            <a href="/conventions">{t("view.backToList")}</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <ConventionFormLayout
      className="lg:flex items-start lg:space-x-4"
      title={conventionTitle}
      onHandleCancel={handleCancel}
    >
      {/* Bouton Retour AVANT le BaseCard */}
      <div className="py-3">
        <Button variant="link" onClick={handleCancel}>
          <Icon name="ArrowLeft" />
          <span>{t("common:actions.back")}</span>
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
            {/* Exportateur / Acheteur */}
            <div className="lg:w-1/2">
              <FormInputAutocompletion
                form={form}
                name="buyerExporterId"
                label={t("form.step1.buyerExporter")}
                placeholder=""
                options={buyerExporterOptions}
                emptyMessage={t("form.step1.selectBuyerExporter")}
                required
                disabled
              />
            </div>

            {/* OPA (Producteur) */}
            <div className="lg:w-1/2">
              <FormInputAutocompletion
                form={form}
                name="producersId"
                label={t("form.step1.opa")}
                placeholder=""
                options={opaOptions}
                emptyMessage={t("form.step1.selectOpa")}
                required
                disabled
              />
            </div>

            {/* Date de signature */}
            <div className="lg:w-1/2">
              <FormDatePicker
                form={form}
                name="signatureDate"
                label={t("form.step1.signatureDate")}
                placeholder=""
                typeCalendar="v2"
                locale={currentLocale}
              />
            </div>
          </form>
        </Form>
      </BaseCard>
    </ConventionFormLayout>
  );
}
