"use client";

import { DefaultFooter } from "@/components/modals/WrapperModal";
import { useModalContext } from "@/components/modals/contexts/DynamicModalProvider";
import React from "react";
import { useTranslation } from "react-i18next";
import type { ConventionActivateModalData } from "../../types/ConventionActivateModalTypes";

export const ConventionActivateFooter: React.FC = () => {
  const { t } = useTranslation("convention");
  const data = useModalContext<ConventionActivateModalData>();

  const primaryAction = {
    label: t("modals.activate.confirmButton"),
    disabled: !data.isValid || data.isLoading,
    form: "convention-activate-modal",
    key: "convention-activate-modal",
    type: "submit" as const,
  };

  const secondaryAction = {
    label: t("modals.activate.cancelButton"),
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
