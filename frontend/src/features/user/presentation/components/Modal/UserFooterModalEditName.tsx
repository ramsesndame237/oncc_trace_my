"use client";

import { DefaultFooter } from "@/components/modals/WrapperModal";
import { useModalContext } from "@/components/modals/contexts/DynamicModalProvider";
import React from "react";
import { useTranslation } from "react-i18next";
import type { UserEditNameModalData } from "../../types/UserModalEditNameTypes";

export const UserFooterModalEditName: React.FC = () => {
  const { t } = useTranslation(["common"]);
  const data = useModalContext<UserEditNameModalData>();

  const primaryAction = {
    label: data.isLoading ? t("actions.saving") : t("actions.save"),
    disabled: !data.isValid || data.isLoading,
    form: "user-edit-name-modal",
    key: "user-edit-name-modal",
    type: "submit" as const,
  };

  const secondaryAction = {
    label: t("actions.cancel"),
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
