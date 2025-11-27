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
  createTransactionStatusSchema,
  type TransactionStatusFormData,
} from "../../schemas/transaction-status-schemas";
import type {
  TransactionStatusModalData,
  TransactionStatusAction,
} from "../../types/TransactionStatusModalTypes";

/**
 * Fonction utilitaire pour créer la description du modal
 */
export const createTransactionStatusDescription = (
  transactionCode: string,
  action: TransactionStatusAction,
  t: TranslateFn
): React.ReactElement => {
  const descriptionKey =
    action === "confirm"
      ? "modals.status.confirmDescription"
      : "modals.status.cancelDescription";

  return (
    <>
      {t(descriptionKey)}
      <span className="block mt-2">
        {t("modals.status.confirmInstruction") + " "}
        <SelectableText>{transactionCode}</SelectableText>
      </span>
    </>
  );
};

export const TransactionStatusModal: React.FC<{
  transactionCode: string;
}> = ({ transactionCode }) => {
  const { t } = useTranslation("transaction");
  const { _setData, handleConfirm, isLoading } =
    useModalContext<TransactionStatusModalData>();

  const schema = createTransactionStatusSchema(transactionCode, t);

  const form = useForm<TransactionStatusFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      transactionCode: "",
    },
    mode: "onChange",
  });

  const { handleSubmit, watch, reset } = form;
  const watchedTransactionCode = watch("transactionCode");

  // Mettre à jour isValid dans le contexte
  useEffect(() => {
    const isValid = watchedTransactionCode === transactionCode;
    _setData({ isValid });
  }, [watchedTransactionCode, transactionCode, _setData]);

  // Reset automatique quand le modal s'ouvre
  useEffect(() => {
    reset();
  }, [reset]);

  const onSubmit = () => {
    handleConfirm();
  };

  return (
    <Form {...form}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4"
        id="transaction-status-modal"
      >
        <FormInput
          form={form}
          name="transactionCode"
          label={t("modals.status.transactionCodeLabel")}
          placeholder={t("modals.status.transactionCodePlaceholder", {
            transactionCode,
          })}
          disabled={isLoading}
          required
        />
      </form>
    </Form>
  );
};
