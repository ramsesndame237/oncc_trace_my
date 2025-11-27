"use client";

import { DefaultFooter } from "@/components/modals/WrapperModal";
import { useModalContext } from "@/components/modals/contexts/DynamicModalProvider";
import React from "react";
import { useTranslation } from "react-i18next";
import type { ConventionDissociateCampaignModalData } from "../../types/ConventionDissociateCampaignModalTypes";

export const ConventionDissociateCampaignFooter: React.FC = () => {
  const { t } = useTranslation("convention");
  const data = useModalContext<ConventionDissociateCampaignModalData>();

  const primaryAction = {
    label: t("modals.dissociateCampaign.confirmButton"),
    disabled: !data.isValid || data.isLoading,
    form: "convention-dissociate-campaign-modal",
    key: "convention-dissociate-campaign-modal",
    type: "submit" as const,
  };

  const secondaryAction = {
    label: t("modals.dissociateCampaign.cancelButton"),
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
