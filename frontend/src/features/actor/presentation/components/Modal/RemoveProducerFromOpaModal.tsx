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
  createRemoveProducerSchema,
  type RemoveProducerFormData,
} from "../../schemas/remove-producer-schemas";
import type { RemoveProducerFromOpaData } from "../../types/RemoveProducerFromOpaTypes";

// Fonction utilitaire pour créer la description du modal
export const createRemoveProducerDescription = (
  producerId: string,
  t: TranslateFn
): React.ReactElement => {
  return (
    <>
      {t("modals.removeProducer.description")}
      <span className="block">
        {" " + t("modals.removeProducer.confirmInstruction") + " "}
        <SelectableText>{producerId}</SelectableText>
      </span>
    </>
  );
};

export const RemoveProducerFromOpaModal: React.FC<{
  producerId: string;
}> = ({ producerId }) => {
  const { t } = useTranslation("actor");
  const { _setData, handleConfirm, isLoading } =
    useModalContext<RemoveProducerFromOpaData>();

  const schema = createRemoveProducerSchema(producerId, t);

  const form = useForm<RemoveProducerFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      producerId: "",
    },
    mode: "onChange",
  });

  const { handleSubmit, watch, reset } = form;
  const watchedProducerId = watch("producerId");

  useEffect(() => {
    const isValid = watchedProducerId === producerId;
    _setData({ isValid });
  }, [watchedProducerId, producerId, _setData]);

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
        id="remove-producer-modal"
      >
        <FormInput
          form={form}
          name="producerId"
          label={t("modals.removeProducer.producerIdLabel")}
          placeholder={t("modals.removeProducer.producerIdPlaceholder", {
            producerId,
          })}
          disabled={isLoading}
          required
        />
      </form>
    </Form>
  );
};
