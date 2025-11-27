"use client";

import { DefaultFooter } from "@/components/modals/WrapperModal";
import { useModalContext } from "@/components/modals/contexts/DynamicModalProvider";
import React from "react";
import { useTranslation } from "react-i18next";
import type { RemoveProducerFromOpaData } from "../../types/RemoveProducerFromOpaTypes";

export const RemoveProducerFromOpaFooter: React.FC = () => {
  const { t } = useTranslation("actor");
  const data = useModalContext<RemoveProducerFromOpaData>();

  const primaryAction = {
    label: t("modals.removeProducer.confirmButton"),
    disabled: !data.isValid || data.isLoading,
    form: "remove-producer-modal",
    key: "remove-producer-modal",
    type: "submit" as const,
  };

  const secondaryAction = {
    label: t("modals.removeProducer.cancelButton"),
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
