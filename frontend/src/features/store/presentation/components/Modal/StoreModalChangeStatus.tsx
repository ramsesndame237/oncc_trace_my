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
  createStoreActionSchema,
  type StoreActionFormData,
} from "../../schemas";
import type { StoreModalChangeStatusData } from "../../types/StoreModalChangeStatusTypes";

// Fonction utilitaire pour créer la description du modal
export const createStoreActionDescription = (
  storeCode: string,
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
        <SelectableText>{storeCode}</SelectableText>
      </span>
    </>
  );
};

export const StoreModalChangeStatus: React.FC<{ storeCode: string }> = ({
  storeCode,
}) => {
  const { t } = useTranslation("store");
  const { _setData, handleConfirm, isLoading } =
    useModalContext<StoreModalChangeStatusData>();

  const schema = createStoreActionSchema(storeCode);

  const form = useForm<StoreActionFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      storeCode: "",
    },
    mode: "onChange",
  });

  const { handleSubmit, watch, reset } = form;
  const watchedStoreCode = watch("storeCode");

  useEffect(() => {
    const isValid = watchedStoreCode === storeCode;
    _setData({ isValid });
  }, [watchedStoreCode, storeCode, _setData]);

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
        id="store-action-modal"
      >
        <FormInput
          form={form}
          name="storeCode"
          label={t("modals.changeStatus.storeCodeLabel")}
          placeholder={t("modals.changeStatus.storeCodePlaceholder", {
            storeCode,
          })}
          disabled={isLoading}
          required
        />
      </form>
    </Form>
  );
};
