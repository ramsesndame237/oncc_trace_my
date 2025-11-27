"use client";

import { DefaultFooter } from "@/components/modals/WrapperModal";
import { useModalContext } from "@/components/modals/contexts/DynamicModalProvider";
import React from "react";
import { useTranslation } from "react-i18next";
import type { RemoveOccupantFromStoreData } from "../../types/RemoveOccupantFromStoreTypes";

export const RemoveOccupantFromStoreFooter: React.FC = () => {
  const { t } = useTranslation("store");
  const data = useModalContext<RemoveOccupantFromStoreData>();

  const primaryAction = {
    label: t("modals.removeOccupant.confirmButton"),
    disabled: !data.isValid || data.isLoading,
    form: "remove-occupant-modal",
    key: "remove-occupant-modal",
    type: "submit" as const,
  };

  const secondaryAction = {
    label: t("modals.removeOccupant.cancelButton"),
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
