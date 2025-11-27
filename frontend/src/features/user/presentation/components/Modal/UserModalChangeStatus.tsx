"use client";

import FormInput from "@/components/forms/form-input";
import FormTextarea from "@/components/forms/form-textarea";
import { useModalContext } from "@/components/modals/contexts/DynamicModalProvider";
import { Form } from "@/components/ui/form";
import { SelectableText } from "@/components/ui/selectable-text";
import { TranslateFn } from "@/i18n/types";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
  createUserModalActionSchema,
  type UserModalActionFormData,
} from "../../schemas";
import type { UserModalChangeStatusData } from "../../types/UserModalChangeStatusTypes";

// Fonction utilitaire pour créer la description du modal
export const createUserActionDescription = (
  username: string,
  action: "activate" | "deactivate",
  t: TranslateFn
): React.ReactElement => {
  const isActivation = action === "activate";

  return (
    <>
      {isActivation ? (
        <>{t("modals.changeStatus.activateDescription")}</>
      ) : (
        <>{t("modals.changeStatus.deactivateDescription")}</>
      )}
      <span className="block">
        {" " + t("modals.changeStatus.confirmInstruction") + " "}
        <SelectableText>{username}</SelectableText>
      </span>
    </>
  );
};

export const UserModalChangeStatus: React.FC<{
  username: string;
  action: "activate" | "deactivate";
}> = ({ username, action }) => {
  const { t } = useTranslation("user");
  const { _setData, handleConfirm, isLoading } =
    useModalContext<UserModalChangeStatusData>();

  const schema = createUserModalActionSchema(username, action, t);

  const form = useForm<UserModalActionFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      username: "",
      reason: "",
    },
    mode: "onChange",
  });

  const { handleSubmit, watch, reset } = form;
  const watchedUsername = watch("username");

  useEffect(() => {
    const isValid = watchedUsername === username;
    _setData({ isValid });
  }, [watchedUsername, username, _setData]);

  // Reset automatique quand le modal s'ouvre
  useEffect(() => {
    reset();
  }, [reset]);

  const onSubmit = (data: UserModalActionFormData) => {
    // Appeler handleConfirm sans await pour éviter de bloquer le formulaire
    // Les erreurs seront gérées par le composant parent via la promesse rejetée
    handleConfirm(action === "deactivate" ? data.reason : undefined);
  };

  const isActivation = action === "activate";

  return (
    <Form {...form}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4"
        id="user-action-modal"
      >
        <FormInput
          form={form}
          name="username"
          label={t("modals.changeStatus.usernameLabel")}
          placeholder={t("modals.changeStatus.usernamePlaceholder", {
            username,
          })}
          disabled={isLoading}
          required
        />

        {!isActivation && (
          <FormTextarea
            form={form}
            name="reason"
            label={t("modals.changeStatus.reasonLabel")}
            placeholder={t("modals.changeStatus.reasonPlaceholder")}
            disabled={isLoading}
            description={t("modals.changeStatus.reasonDescription")}
          />
        )}
      </form>
    </Form>
  );
};
