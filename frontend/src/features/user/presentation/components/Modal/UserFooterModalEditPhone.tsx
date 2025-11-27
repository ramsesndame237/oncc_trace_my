"use client";

import { useModalContext } from "@/components/modals/contexts/DynamicModalProvider";
import { Button } from "@/components/ui/button";
import React from "react";
import { useTranslation } from "react-i18next";
import type { UserEditPhoneModalData } from "../../types/UserModalEditPhoneTypes";

export const UserFooterModalEditPhone: React.FC = () => {
  const { t } = useTranslation(["common"]);
  const { isValid, isLoading, handleCancel } =
    useModalContext<UserEditPhoneModalData>();

  return (
    <div className="flex justify-end gap-2">
      <Button
        type="button"
        variant="outline"
        onClick={handleCancel}
        disabled={isLoading}
      >
        {t("actions.cancel")}
      </Button>
      <Button
        type="submit"
        form="user-edit-phone-modal"
        disabled={!isValid || isLoading}
      >
        {isLoading ? t("actions.saving") : t("actions.save")}
      </Button>
    </div>
  );
};
