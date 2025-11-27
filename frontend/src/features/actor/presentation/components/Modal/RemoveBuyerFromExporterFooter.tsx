"use client";

import { DefaultFooter } from "@/components/modals/WrapperModal";
import { useModalContext } from "@/components/modals/contexts/DynamicModalProvider";
import React from "react";
import { useTranslation } from "react-i18next";
import type { RemoveBuyerFromExporterData } from "../../types/RemoveBuyerFromExporterTypes";

export const RemoveBuyerFromExporterFooter: React.FC = () => {
  const { t } = useTranslation("actor");
  const data = useModalContext<RemoveBuyerFromExporterData>();

  const primaryAction = {
    label: t("modals.removeBuyer.confirmButton"),
    disabled: !data.isValid || data.isLoading,
    form: "remove-buyer-modal",
    key: "remove-buyer-modal",
    type: "submit" as const,
  };

  const secondaryAction = {
    label: t("modals.removeBuyer.cancelButton"),
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
