"use client";

import { DefaultFooter } from "@/components/modals/WrapperModal";
import { useModalContext } from "@/components/modals/contexts/DynamicModalProvider";
import React from "react";
import { useTranslation } from "react-i18next";
import type { ProductTransferCancelModalData } from "../../types/ProductTransferCancelModalTypes";

export const ProductTransferCancelFooter: React.FC = () => {
  const { t } = useTranslation("productTransfer");
  const data = useModalContext<ProductTransferCancelModalData>();

  const primaryAction = {
    label: t("modals.cancel.confirmButton"),
    disabled: !data.isValid || data.isLoading,
    form: "product-transfer-cancel-modal",
    key: "product-transfer-cancel-modal",
    type: "submit" as const,
    variant: "destructive" as const,
  };

  const secondaryAction = {
    label: t("modals.cancel.cancelButton"),
    onClick: data.handleCancel,
  };

  return (
    <DefaultFooter
      onClose={data.handleCancel}
      primaryAction={primaryAction}
      secondaryAction={secondaryAction}
    />
  );
};
