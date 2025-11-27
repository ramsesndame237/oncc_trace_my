"use client";

import { DefaultFooter } from "@/components/modals/WrapperModal";
import { useModalContext } from "@/components/modals/contexts/DynamicModalProvider";
import React from "react";
import { useTranslation } from "react-i18next";
import type { UserModalChangeStatusData } from "../../types/UserModalChangeStatusTypes";

export const UserFooterModalChangeStatus: React.FC = () => {
  const { t } = useTranslation(["user", "common"]);
  const data = useModalContext<UserModalChangeStatusData>();

  const isActivation = data.action === "activate";

  const primaryAction = {
    label: isActivation
      ? t("user:modals.changeStatus.activateButton")
      : t("user:modals.changeStatus.deactivateButton"),
    disabled: !data.isValid || data.isLoading,
    form: "user-action-modal",
    key: "user-action-modal",
    type: "submit" as const,
  };

  const secondaryAction = {
    label: t("common:actions.cancel"),
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
