"use client";

import { DefaultFooter } from "@/components/modals/WrapperModal";
import { useModalContext } from "@/components/modals/contexts/DynamicModalProvider";
import React from "react";
import { useTranslation } from "react-i18next";
import type { TransactionStatusModalData } from "../../types/TransactionStatusModalTypes";

export const TransactionStatusFooter: React.FC = () => {
  const { t } = useTranslation("transaction");
  const data = useModalContext<TransactionStatusModalData>();

  const buttonLabel =
    data.action === "confirm"
      ? t("modals.status.confirmButton")
      : t("modals.status.cancelButton");

  const variant = data.action === "confirm" ? "default" : "destructive";

  const primaryAction = {
    label: buttonLabel,
    disabled: !data.isValid || data.isLoading,
    form: "transaction-status-modal",
    key: "transaction-status-modal",
    type: "submit" as const,
    variant: variant as "default" | "destructive",
  };

  const secondaryAction = {
    label: t("modals.status.closeButton"),
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
