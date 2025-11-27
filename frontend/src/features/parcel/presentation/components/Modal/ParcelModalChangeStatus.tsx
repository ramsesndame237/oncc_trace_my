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
  createParcelActionSchema,
  type ParcelActionFormData,
} from "../../schemas/parcelAction.schema";
import type { ParcelModalChangeStatusData } from "../../types/ParcelModalChangeStatusTypes";

// Fonction utilitaire pour créer la description du modal
export const createParcelActionDescription = (
  parcelId: string,
  action: "activate" | "deactivate",
  t: TranslateFn
): React.ReactElement => {
  const isActivation = action === "activate";

  return (
    <>
      {isActivation ? (
        <>{t("modal.activateDescription")}</>
      ) : (
        <>{t("modal.deactivateDescription")}</>
      )}
      <span className="block">
        {t("modal.confirmPrompt")}
        <SelectableText>{parcelId}</SelectableText>
      </span>
    </>
  );
};

export const ParcelModalChangeStatus: React.FC<{ parcelId: string }> = ({
  parcelId,
}) => {
  const { t } = useTranslation("parcel");
  const { handleConfirm, isLoading, _setData } =
    useModalContext<ParcelModalChangeStatusData>();

  const schema = createParcelActionSchema(parcelId);

  const form = useForm<ParcelActionFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      parcelId: "",
    },
    mode: "onChange",
  });

  const { handleSubmit, watch, reset } = form;
  const watchedParcelId = watch("parcelId");

  useEffect(() => {
    const isValid = watchedParcelId === parcelId;
    _setData({ isValid });
  }, [watchedParcelId, parcelId, _setData]);

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
        id="parcel-action-modal"
      >
        <FormInput
          form={form}
          name="parcelId"
          label={t("modal.parcelIdLabel")}
          placeholder={t("modal.parcelIdPlaceholder", { parcelId })}
          disabled={isLoading}
          required
        />
      </form>
    </Form>
  );
};
