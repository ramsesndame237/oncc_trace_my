"use client";

import FormInput from "@/components/forms/form-input";
import { useModalContext } from "@/components/modals/contexts/DynamicModalProvider";
import { Form } from "@/components/ui/form";
import { SelectableText } from "@/components/ui/selectable-text";
import { CampaignServiceProvider } from "@/features/campaign/infrastructure/di/campaignServiceProvider";
import { TranslateFn } from "@/i18n/types";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import {
  createConventionActivateSchema,
  type ConventionActivateFormData,
} from "../../schemas/convention-activate-schemas";
import type { ConventionAssociateCampaignModalData } from "../../types/ConventionAssociateCampaignModalTypes";

// Fonction utilitaire pour créer la description du modal
export const createConventionAssociateDescription = (
  conventionId: string,
  campaignName: string | null,
  t: TranslateFn
): React.ReactElement => {
  return (
    <>
      {campaignName ? (
        <>
          Vous êtes sur le point d&apos;associer cette convention à la campagne{" "}
          <strong>{campaignName}</strong>.
        </>
      ) : (
        <>{t("modals.associateCampaign.noCampaignDescription")}</>
      )}
      {campaignName && (
        <span className="block mt-2">
          {" " + t("modals.associateCampaign.confirmInstruction") + " "}
          <SelectableText>{conventionId}</SelectableText>
        </span>
      )}
    </>
  );
};

export const ConventionAssociateCampaignModal: React.FC<{
  conventionId: string;
}> = ({ conventionId }) => {
  const { t } = useTranslation("convention");
  const { _setData, handleConfirm, isLoading } =
    useModalContext<ConventionAssociateCampaignModalData>();

  const isOnline = useOnlineStatus();
  const [campaignName, setCampaignName] = useState<string | null>(null);
  const [isLoadingCampaign, setIsLoadingCampaign] = useState(true);

  const schema = createConventionActivateSchema(conventionId, t);

  const form = useForm<ConventionActivateFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      conventionId: "",
    },
    mode: "onChange",
  });

  const { handleSubmit, watch, reset } = form;
  const watchedConventionId = watch("conventionId");

  // Charger la campagne active
  useEffect(() => {
    const loadActiveCampaign = async () => {
      try {
        setIsLoadingCampaign(true);
        const getActiveCampaignUseCase = CampaignServiceProvider.getGetActiveCampaignUseCase();
        const activeCampaign = await getActiveCampaignUseCase.execute(isOnline);

        if (activeCampaign) {
          setCampaignName(activeCampaign.code);
        } else {
          setCampaignName(null);
        }
      } catch {
        setCampaignName(null);
      } finally {
        setIsLoadingCampaign(false);
      }
    };

    loadActiveCampaign();
  }, [isOnline]);

  useEffect(() => {
    const isValid = watchedConventionId === conventionId && campaignName !== null;
    _setData({ isValid });
  }, [watchedConventionId, conventionId, campaignName, _setData]);

  // Reset automatique quand le modal s'ouvre
  useEffect(() => {
    reset();
  }, [reset]);

  const onSubmit = () => {
    // Appeler handleConfirm sans await pour éviter de bloquer le formulaire
    // Les erreurs seront gérées par le composant parent via la promesse rejetée
    handleConfirm();
  };

  if (isLoadingCampaign) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {t("modals.associateCampaign.loadingCampaign")}
        </p>
      </div>
    );
  }

  if (!campaignName) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-red-600">
          {t("modals.associateCampaign.noCampaignError")}
        </p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4"
        id="convention-associate-campaign-modal"
      >
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm font-medium text-blue-900">
            {t("modals.associateCampaign.campaignLabel")}
          </p>
          <p className="text-lg font-semibold text-blue-700 mt-1">
            {campaignName}
          </p>
        </div>

        <FormInput
          form={form}
          name="conventionId"
          label={t("modals.associateCampaign.conventionIdLabel")}
          placeholder={t("modals.associateCampaign.conventionIdPlaceholder", {
            conventionId,
          })}
          disabled={isLoading}
          required
        />
      </form>
    </Form>
  );
};
