"use client";

import { DefaultFooter } from "@/components/modals/WrapperModal";
import { useModalContext } from "@/components/modals/contexts/DynamicModalProvider";
import React from "react";
import { useTranslation } from "react-i18next";
import type { CalendarModalUpdateExpectedSalesCountData } from "../../types/CalendarModalUpdateExpectedSalesCountTypes";

export const CalendarFooterModalUpdateExpectedSalesCount: React.FC = () => {
  const { t } = useTranslation("calendar");
  const data = useModalContext<CalendarModalUpdateExpectedSalesCountData>();

  const primaryAction = {
    label: t("modals.updateExpectedSalesCount.confirmAction"),
    disabled: !data.isValid || data.isLoading,
    form: "calendar-update-expected-sales-count-modal",
    key: "calendar-update-expected-sales-count-modal",
    type: "submit" as const,
  };

  const secondaryAction = {
    label: t("modals.updateExpectedSalesCount.cancel"),
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
