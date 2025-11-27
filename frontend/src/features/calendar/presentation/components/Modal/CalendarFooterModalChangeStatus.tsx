"use client";

import { DefaultFooter } from "@/components/modals/WrapperModal";
import { useModalContext } from "@/components/modals/contexts/DynamicModalProvider";
import React from "react";
import { useTranslation } from "react-i18next";
import type { CalendarModalChangeStatusData } from "../../types/CalendarModalChangeStatusTypes";

export const CalendarFooterModalChangeStatus: React.FC = () => {
  const { t } = useTranslation("calendar");
  const data = useModalContext<CalendarModalChangeStatusData>();

  const primaryAction = {
    label: t("modals.changeStatus.confirmAction"),
    disabled: !data.isValid || data.isLoading,
    form: "calendar-action-modal",
    key: "calendar-action-modal",
    type: "submit" as const,
  };

  const secondaryAction = {
    label: t("modals.changeStatus.cancel"),
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
