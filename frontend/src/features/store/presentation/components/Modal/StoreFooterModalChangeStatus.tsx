"use client";

import { DefaultFooter } from "@/components/modals/WrapperModal";
import { useModalContext } from "@/components/modals/contexts/DynamicModalProvider";
import React from "react";
import { useTranslation } from "react-i18next";
import type { StoreModalChangeStatusData } from "../../types/StoreModalChangeStatusTypes";

export const StoreFooterModalChangeStatus: React.FC = () => {
  const { t } = useTranslation("store");
  const data = useModalContext<StoreModalChangeStatusData>();

  const primaryAction = {
    label: t("modals.changeStatus.confirmButton"),
    disabled: !data.isValid || data.isLoading,
    form: "store-action-modal",
    key: "store-action-modal",
    type: "submit" as const,
  };

  const secondaryAction = {
    label: t("modals.changeStatus.cancelButton"),
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
