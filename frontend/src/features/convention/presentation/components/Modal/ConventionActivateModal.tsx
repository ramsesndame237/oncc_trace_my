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
import type { ConventionActivateModalData } from "../../types/ConventionActivateModalTypes";

// Fonction utilitaire pour créer la description du modal
export const createConventionActivateDescription = (
  conventionId: string,
  activeCampaignName: string | undefined,
  t: TranslateFn
): React.ReactElement => {
  return (
    <>
      {activeCampaignName ? (
        <>
          {t("modals.activate.descriptionWithCampaign", {
            campaignName: activeCampaignName,
          })}
        </>
      ) : (
        <>{t("modals.activate.description")}</>
      )}
      <span className="block">
        {" " + t("modals.activate.confirmInstruction") + " "}
        <SelectableText>{conventionId}</SelectableText>
      </span>
    </>
  );
};

export const ConventionActivateModal: React.FC<{
  conventionId: string;
  activeCampaignName?: string;
}> = ({ conventionId }) => {
  const { t } = useTranslation("convention");
  const { _setData, handleConfirm, isLoading } =
    useModalContext<ConventionActivateModalData>();

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
        id="convention-activate-modal"
      >
        <FormInput
          form={form}
          name="conventionId"
          label={t("modals.activate.conventionIdLabel")}
          placeholder={t("modals.activate.conventionIdPlaceholder", {
            conventionId,
          })}
          disabled={isLoading}
          required
        />
      </form>
    </Form>
  );
};
