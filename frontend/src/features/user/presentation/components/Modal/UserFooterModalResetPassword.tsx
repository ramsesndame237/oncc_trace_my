"use client";

import { DefaultFooter } from "@/components/modals/WrapperModal";
import { useModalContext } from "@/components/modals/contexts/DynamicModalProvider";
import React from "react";
import { useTranslation } from "react-i18next";
import type { UserResetPasswordModalData } from "../../types/UserResetPasswordModalTypes";

export const UserFooterModalResetPassword: React.FC = () => {
  const { t } = useTranslation(["user", "common"]);
  const data = useModalContext<UserResetPasswordModalData>();

  const primaryAction = {
    label: t("user:modals.resetPassword.resetButton"),
    disabled: !data.isValid || data.isLoading,
    form: "user-reset-password-modal",
    key: "user-reset-password-modal",
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