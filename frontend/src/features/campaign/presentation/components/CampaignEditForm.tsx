"use client";

import { FormDatePicker } from "@/components/forms";
import { BaseCard } from "@/components/modules/base-card";
import { SyncErrorAlert } from "@/components/modules/sync-error-alert";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useLocale } from "@/hooks/useLocale";
import { showError } from "@/lib/notifications/toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, type JSX } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useCampaignStore } from "../../infrastructure/store/campaignStore";
import { useGetCampaignById } from "../hooks/useGetCampaignById";
import { campaignSchema, type CampaignFormData } from "../schemas";

export interface CampaignEditFormProps {
  entityId?: string;
  editOffline?: boolean;
}

export default function CampaignEditForm({
  entityId,
  editOffline,
}: CampaignEditFormProps): JSX.Element {
  const { t } = useTranslation("campaign");
  const { currentLocale } = useLocale();
  const router = useRouter();
  const { createCampaign, updateCampaign, isLoading } = useCampaignStore();

  // Mode édition : charger les données si entityId présent
  const { campaign, isLoading: isLoadingCampaign } = useGetCampaignById(
    entityId ?? ""
  );

  const form = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      startDate: "",
      endDate: "",
    },
    mode: "onChange",
  });

  // Surveiller la date de début pour mettre à jour les contraintes de la date de fin
  const watchedStartDate = form.watch("startDate");

  // Réinitialiser la date de fin quand la date de début change
  useEffect(() => {
    if (watchedStartDate) {
      // Reset la date de fin pour forcer une nouvelle sélection
      form.setValue("endDate", "", { shouldValidate: true, shouldDirty: true });
      // Force la mise à jour du composant
      form.trigger("endDate");
    }
  }, [watchedStartDate, form]);

  // Fonction utilitaire pour parser une date string en fuseau local
  const parseLocalDate = (dateString: string): Date => {
    const [year, month, day] = dateString.split("-").map(Number);
    return new Date(year, month - 1, day); // month-1 car les mois sont 0-indexés
  };

  // Calculer la date minimum pour la date de fin
  const getMinDateForEnd = (): Date => {
    if (watchedStartDate) {
      const startDate = parseLocalDate(watchedStartDate);
      return new Date(startDate.getTime() + 24 * 60 * 60 * 1000); // Jour suivant
    }
    return new Date(Date.now() + 24 * 60 * 60 * 1000); // Par défaut, demain
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

  // Initialiser le formulaire en mode édition
  useEffect(() => {
    if (entityId && campaign) {
      form.reset({
        startDate: campaign.startDate,
        endDate: campaign.endDate,
      });
    }
  }, [entityId, campaign, form]);

  const onSubmit: SubmitHandler<CampaignFormData> = async (
    data
  ): Promise<void> => {
    try {
      if (entityId) {
        await updateCampaign({
          id: entityId,
          startDate: data.startDate,
          endDate: data.endDate,
          isOnline: !editOffline,
        });
        if (editOffline) {
          router.replace(`/outbox`);
        } else {
          router.replace(`/campaign/view?entityId=${entityId}`);
        }
      } else {
        await createCampaign({
          startDate: data.startDate,
          endDate: data.endDate,
        });
        form.reset();
        router.replace("/campaign");
      }
    } catch (error) {
      showError(
        entityId ? t("messages.updateError") : t("messages.createError")
      );
      console.error("Erreur lors de la sauvegarde de la campagne:", error);
    }
  };

  if (entityId && isLoadingCampaign) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        {t("view.loadingInfo")}
      </div>
    );
  }

  return (
    <BaseCard
      title={entityId ? t("form.editCampaign") : t("form.createCampaign")}
      footer={[
        <Button
          type="submit"
          disabled={form.formState.isSubmitting || isLoading}
          key="save-campaign"
          form="edit-campaign-form"
        >
          {form.formState.isSubmitting || isLoading
            ? t("actions.saving")
            : entityId
            ? t("actions.saveChanges")
            : t("actions.save")}
        </Button>,
      ]}
    >
      {/* Alerte d'erreur de synchronisation */}
      {editOffline && entityId && (
        <SyncErrorAlert entityId={entityId} entityType="campaign" />
      )}
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-8"
          id="edit-campaign-form"
        >
          <div className="lg:w-1/2">
            <FormDatePicker
              form={form}
              name="startDate"
              label={t("form.startDate")}
              placeholder={t("form.startDatePlaceholder")}
              required
              minDate={new Date(Date.now() + 24 * 60 * 60 * 1000)} // Demain minimum
              maxDate={new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)} // Maximum 1 an dans le futur
              disabledDates={{
                before: new Date(Date.now() + 24 * 60 * 60 * 1000), // Demain (strictement supérieur à aujourd'hui)
                after: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Maximum 1 an dans le futur
              }}
              locale={currentLocale}
            />
          </div>

          <div className="lg:w-1/2">
            <FormDatePicker
              form={form}
              name="endDate"
              label={t("form.endDate")}
              placeholder={t("form.endDatePlaceholder")}
              required
              minDate={getMinDateForEnd()}
              maxDate={getMaxDateForEnd()}
              disabledDates={{
                before: getMinDateForEnd(),
                after: getMaxDateForEnd(),
              }}
              locale={currentLocale}
            />
          </div>
        </form>
      </Form>
    </BaseCard>
  );
}
