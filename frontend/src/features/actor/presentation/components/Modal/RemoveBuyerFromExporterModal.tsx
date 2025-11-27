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
  createRemoveBuyerSchema,
  type RemoveBuyerFormData,
} from "../../schemas/remove-buyer-schemas";
import type { RemoveBuyerFromExporterData } from "../../types/RemoveBuyerFromExporterTypes";

// Fonction utilitaire pour créer la description du modal
export const createRemoveBuyerDescription = (
  buyerId: string,
  t: TranslateFn
): React.ReactElement => {
  return (
    <>
      {t("modals.removeBuyer.description")}
      <span className="block">
        {" " + t("modals.removeBuyer.confirmInstruction") + " "}
        <SelectableText>{buyerId}</SelectableText>
      </span>
    </>
  );
};

export const RemoveBuyerFromExporterModal: React.FC<{
  buyerId: string;
}> = ({ buyerId }) => {
  const { t } = useTranslation("actor");
  const { _setData, handleConfirm, isLoading } =
    useModalContext<RemoveBuyerFromExporterData>();

  const schema = createRemoveBuyerSchema(buyerId, t);

  const form = useForm<RemoveBuyerFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      buyerId: "",
    },
    mode: "onChange",
  });

  const { handleSubmit, watch, reset } = form;
  const watchedBuyerId = watch("buyerId");

  useEffect(() => {
    const isValid = watchedBuyerId === buyerId;
    _setData({ isValid });
  }, [watchedBuyerId, buyerId, _setData]);

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
        id="remove-buyer-modal"
      >
        <FormInput
          form={form}
          name="buyerId"
          label={t("modals.removeBuyer.buyerIdLabel")}
          placeholder={t("modals.removeBuyer.buyerIdPlaceholder", {
            buyerId,
          })}
          disabled={isLoading}
          required
        />
      </form>
    </Form>
  );
};
