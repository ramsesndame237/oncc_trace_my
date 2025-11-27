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
  createRemoveOccupantSchema,
  type RemoveOccupantFormData,
} from "../../schemas/remove-occupant-schemas";
import type { RemoveOccupantFromStoreData } from "../../types/RemoveOccupantFromStoreTypes";

// Fonction utilitaire pour créer la description du modal
export const createRemoveOccupantDescription = (
  occupantId: string,
  t: TranslateFn
): React.ReactElement => {
  return (
    <>
      {t("modals.removeOccupant.description")}
      <span className="block">
        {" " + t("modals.removeOccupant.confirmInstruction") + " "}
        <SelectableText>{occupantId}</SelectableText>
      </span>
    </>
  );
};

export const RemoveOccupantFromStoreModal: React.FC<{
  occupantId: string;
}> = ({ occupantId }) => {
  const { t } = useTranslation("store");
  const { _setData, handleConfirm, isLoading } =
    useModalContext<RemoveOccupantFromStoreData>();

  const schema = createRemoveOccupantSchema(occupantId, t);

  const form = useForm<RemoveOccupantFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      occupantId: "",
    },
    mode: "onChange",
  });

  const { handleSubmit, watch, reset } = form;
  const watchedOccupantId = watch("occupantId");

  useEffect(() => {
    const isValid = watchedOccupantId === occupantId;
    _setData({ isValid });
  }, [watchedOccupantId, occupantId, _setData]);

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
        id="remove-occupant-modal"
      >
        <FormInput
          form={form}
          name="occupantId"
          label={t("modals.removeOccupant.occupantIdLabel")}
          placeholder={t("modals.removeOccupant.occupantIdPlaceholder", {
            occupantId,
          })}
          disabled={isLoading}
          required
        />
      </form>
    </Form>
  );
};
