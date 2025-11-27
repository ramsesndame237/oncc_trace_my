"use client";

import FormInput from "@/components/forms/form-input";
import { useModalContext } from "@/components/modals/contexts/DynamicModalProvider";
import { Form } from "@/components/ui/form";
import { SelectableText } from "@/components/ui/selectable-text";
import { TranslateFn } from "@/i18n/types";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
  createConventionActivateSchema,
  type ConventionActivateFormData,
} from "../../schemas/convention-activate-schemas";
import type { ConventionDissociateCampaignModalData } from "../../types/ConventionDissociateCampaignModalTypes";

// Fonction utilitaire pour créer la description du modal
export const createConventionDissociateDescription = (
  conventionId: string,
  campaignName: string,
  t: TranslateFn
): React.ReactElement => {
  return (
    <>
      Vous êtes sur le point de dissocier cette convention de la campagne{" "}
      <strong>{campaignName}</strong>.
      <span className="block mt-2">
        {" " + t("modals.dissociateCampaign.confirmInstruction") + " "}
        <SelectableText>{conventionId}</SelectableText>
      </span>
    </>
  );
};

export const ConventionDissociateCampaignModal: React.FC<{
  conventionId: string;
  campaignName: string;
}> = ({ conventionId, campaignName }) => {
  const { t } = useTranslation("convention");
  const { _setData, handleConfirm, isLoading } =
    useModalContext<ConventionDissociateCampaignModalData>();

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

  useEffect(() => {
    const isValid = watchedConventionId === conventionId;
    _setData({ isValid });
  }, [watchedConventionId, conventionId, _setData]);

  // Reset automatique quand le modal s'ouvre
  useEffect(() => {
    reset();
  }, [reset]);

  const onSubmit = () => {
    // Appeler handleConfirm sans await pour éviter de bloquer le formulaire
    // Les erreurs seront gérées par le composant parent via la promesse rejetée
    handleConfirm();
  };

  return (
    <Form {...form}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4"
        id="convention-dissociate-campaign-modal"
      >
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm font-medium text-red-900">
            {t("modals.dissociateCampaign.campaignLabel")}
          </p>
          <p className="text-lg font-semibold text-red-700 mt-1">
            {campaignName}
          </p>
        </div>

        <FormInput
          form={form}
          name="conventionId"
          label={t("modals.dissociateCampaign.conventionIdLabel")}
          placeholder={t("modals.dissociateCampaign.conventionIdPlaceholder", {
            conventionId,
          })}
          disabled={isLoading}
          required
        />
      </form>
    </Form>
  );
};
