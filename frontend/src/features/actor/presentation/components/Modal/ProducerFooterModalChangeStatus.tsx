"use client";

import { DefaultFooter } from "@/components/modals/WrapperModal";
import { useModalContext } from "@/components/modals/contexts/DynamicModalProvider";
import React from "react";
import { useTranslation } from "react-i18next";
import type { ProducerModalChangeStatusData } from "../../types/ProducerModalChangeStatusTypes";

export const ProducerFooterModalChangeStatus: React.FC = () => {
  const { t } = useTranslation("actor");
  const data = useModalContext<ProducerModalChangeStatusData>();

  const primaryAction = {
    label: t("modals.changeStatus.confirmButton"),
    disabled: !data.isValid || data.isLoading,
    form: "producer-action-modal",
    key: "producer-action-modal",
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
