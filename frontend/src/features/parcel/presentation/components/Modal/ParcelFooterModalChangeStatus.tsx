"use client";

import { useModalContext } from "@/components/modals/contexts/DynamicModalProvider";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { useTranslation } from "react-i18next";
import type { ParcelModalChangeStatusData } from "../../types/ParcelModalChangeStatusTypes";

export const ParcelFooterModalChangeStatus: React.FC = () => {
  const { t } = useTranslation("parcel");
  const { handleCancel, isValid, isLoading, action } =
    useModalContext<ParcelModalChangeStatusData>();

  const isActivation = action === "activate";

  return (
    <DialogFooter>
      <Button
        type="button"
        variant="outline"
        onClick={handleCancel}
        disabled={isLoading}
      >
        {t("modal.cancel")}
      </Button>
      <Button
        type="submit"
        form="parcel-action-modal"
        variant={isActivation ? "default" : "destructive"}
        disabled={!isValid || isLoading}
      >
        {isLoading
          ? t("modal.processing")
          : isActivation
          ? t("actions.activate")
          : t("actions.deactivate")}
      </Button>
    </DialogFooter>
  );
};
