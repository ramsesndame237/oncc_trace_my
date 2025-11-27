"use client";

import { DefaultFooter } from "@/components/modals/WrapperModal";
import { useModalContext } from "@/components/modals/contexts/DynamicModalProvider";
import React from "react";
import { useTranslation } from "react-i18next";
import type { ConventionAssociateCampaignModalData } from "../../types/ConventionAssociateCampaignModalTypes";

export const ConventionAssociateCampaignFooter: React.FC = () => {
  const { t } = useTranslation("convention");
  const data = useModalContext<ConventionAssociateCampaignModalData>();

  const primaryAction = {
    label: t("modals.associateCampaign.confirmButton"),
    disabled: !data.isValid || data.isLoading,
    form: "convention-associate-campaign-modal",
    key: "convention-associate-campaign-modal",
    type: "submit" as const,
  };

  const secondaryAction = {
    label: t("modals.associateCampaign.cancelButton"),
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
