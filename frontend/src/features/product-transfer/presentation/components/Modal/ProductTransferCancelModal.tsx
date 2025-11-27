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
  createProductTransferCancelSchema,
  type ProductTransferCancelFormData,
} from "../../schemas/product-transfer-cancel-schemas";
import type { ProductTransferCancelModalData } from "../../types/ProductTransferCancelModalTypes";

/**
 * Fonction utilitaire pour créer la description du modal
 */
export const createProductTransferCancelDescription = (
  transferCode: string,
  t: TranslateFn
): React.ReactElement => {
  return (
    <>
      {t("modals.cancel.description")}
      <span className="block mt-2">
        {t("modals.cancel.confirmInstruction") + " "}
        <SelectableText>{transferCode}</SelectableText>
      </span>
    </>
  );
};

export const ProductTransferCancelModal: React.FC<{
  transferCode: string;
}> = ({ transferCode }) => {
  const { t } = useTranslation("productTransfer");
  const { _setData, handleConfirm, isLoading } =
    useModalContext<ProductTransferCancelModalData>();

  const schema = createProductTransferCancelSchema(transferCode, t);

  const form = useForm<ProductTransferCancelFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      transferCode: "",
    },
    mode: "onChange",
  });

  const { handleSubmit, watch, reset } = form;
  const watchedTransferCode = watch("transferCode");

  // Mettre à jour isValid dans le contexte
  useEffect(() => {
    const isValid = watchedTransferCode === transferCode;
    _setData({ isValid });
  }, [watchedTransferCode, transferCode, _setData]);

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
        id="product-transfer-cancel-modal"
      >
        <FormInput
          form={form}
          name="transferCode"
          label={t("modals.cancel.transferCodeLabel")}
          placeholder={t("modals.cancel.transferCodePlaceholder", {
            transferCode,
          })}
          disabled={isLoading}
          required
        />
      </form>
    </Form>
  );
};
