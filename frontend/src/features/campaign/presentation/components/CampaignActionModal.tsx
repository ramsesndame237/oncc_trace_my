"use client";

import FormInput from "@/components/forms/form-input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { SelectableText } from "@/components/ui/selectable-text";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
  createCampaignActionSchema,
  type CampaignActionFormData,
} from "../schemas";

interface CampaignActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  campaignCode: string;
  isLoading?: boolean;
  action: "activate" | "deactivate";
}

export const CampaignActionModal: React.FC<CampaignActionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  campaignCode,
  isLoading = false,
  action,
}) => {
  const { t } = useTranslation("campaign");
  // Créer le schéma avec validation dynamique du code de campagne
  const schema = createCampaignActionSchema(campaignCode);

  const form = useForm<CampaignActionFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      campaignCode: "",
    },
  });

  const { handleSubmit, reset, watch } = form;
  const watchedCampaignCode = watch("campaignCode");

  // Reset form when modal closes or opens
  useEffect(() => {
    if (isOpen) {
      reset();
    }
  }, [isOpen, reset]);

  const onSubmit = () => {
    onConfirm();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const isValid = watchedCampaignCode === campaignCode;

  const isActivation = action === "activate";
  const title = isActivation
    ? t("modals.action.activateTitle")
    : t("modals.action.deactivateTitle");

  const descriptionContent = isActivation ? (
    <>
      {t("modals.action.activateDescription")}{" "}
      <SelectableText>{campaignCode}</SelectableText>
    </>
  ) : (
    <>
      {t("modals.action.deactivateDescription")}{" "}
      <SelectableText>{campaignCode}</SelectableText>
    </>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>{descriptionContent}</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <FormInput
                form={form}
                name="campaignCode"
                label={t("modals.action.campaignCodeLabel")}
                placeholder={t("modals.action.campaignCodePlaceholder", {
                  campaignCode,
                })}
                disabled={isLoading}
                required
              />
            </div>

            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                {t("actions.cancel")}
              </Button>
              <Button
                type="submit"
                variant={isActivation ? "default" : "destructive"}
                disabled={!isValid || isLoading}
                className="w-full sm:w-auto"
              >
                {isLoading
                  ? isActivation
                    ? t("modals.action.activating")
                    : t("modals.action.deactivating")
                  : isActivation
                  ? t("modals.action.activateButton")
                  : t("modals.action.deactivateButton")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
