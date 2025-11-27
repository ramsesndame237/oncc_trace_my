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
  createProducerActionSchema,
  type ProducerActionFormData,
} from "../../schemas/producer-action-schemas";
import type { ProducerModalChangeStatusData } from "../../types/ProducerModalChangeStatusTypes";

// Fonction utilitaire pour créer la description du modal
export const createProducerActionDescription = (
  actorId: string,
  action: "activate" | "deactivate",
  t: TranslateFn
): React.ReactElement => {
  const isActivation = action === "activate";

  return (
    <>
      {isActivation ? (
        <>{t("modals.changeStatus.activateDescription")}</>
      ) : (
        <>{t("modals.changeStatus.deactivateDescription")}</>
      )}
      <span className="block">
        {" " + t("modals.changeStatus.confirmInstruction") + " "}
        <SelectableText>{actorId}</SelectableText>
      </span>
    </>
  );
};

export const ProducerModalChangeStatus: React.FC<{
  actorId: string;
  action: "activate" | "deactivate";
}> = ({ actorId, action }) => {
  const { t } = useTranslation("actor");
  const { _setData, handleConfirm, isLoading } =
    useModalContext<ProducerModalChangeStatusData>();

  const schema = createProducerActionSchema(actorId, action, t);

  const form = useForm<ProducerActionFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      actorId: "",
    },
    mode: "onChange",
  });

  const { handleSubmit, watch, reset } = form;
  const watchedActorId = watch("actorId");

  useEffect(() => {
    const isValid = watchedActorId === actorId;
    _setData({ isValid });
  }, [watchedActorId, actorId, _setData]);

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
        id="producer-action-modal"
      >
        <FormInput
          form={form}
          name="actorId"
          label={t("modals.changeStatus.actorIdLabel")}
          placeholder={t("modals.changeStatus.actorIdPlaceholder", {
            actorId,
          })}
          disabled={isLoading}
          required
        />
      </form>
    </Form>
  );
};
