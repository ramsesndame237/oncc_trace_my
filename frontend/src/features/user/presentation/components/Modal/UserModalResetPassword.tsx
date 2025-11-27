"use client";

import FormInput from "@/components/forms/form-input";
import { useModalContext } from "@/components/modals/contexts/DynamicModalProvider";
import { Form } from "@/components/ui/form";
import { SelectableText } from "@/components/ui/selectable-text";
import { TranslateFn } from "@/i18n/types";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Trans, useTranslation } from "react-i18next";
import {
  createResetPasswordModalSchema,
  type ResetPasswordModalFormData,
} from "../../schemas";
import type { UserResetPasswordModalData } from "../../types/UserResetPasswordModalTypes";

// Fonction utilitaire pour créer la description du modal
export const createResetPasswordDescription = (
  username: string,
  userFullName: string,
  t: TranslateFn
): React.ReactElement => {
  return (
    <>
      <Trans
        i18nKey="modals.resetPassword.description"
        values={{ userFullName }}
        components={{ b: <b /> }}
        ns="user"
      />
      <span className="block">
        {" " + t("modals.resetPassword.confirmInstruction") + " "}
        <SelectableText>{username}</SelectableText>
      </span>
    </>
  );
};

export const UserModalResetPassword: React.FC<{ username: string }> = ({
  username,
}) => {
  const { t } = useTranslation("user");
  const { _setData, handleConfirm, isLoading } =
    useModalContext<UserResetPasswordModalData>();

  const schema = createResetPasswordModalSchema(username, t);

  const form = useForm<ResetPasswordModalFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      username: "",
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

  const onSubmit = () => {
    // Appeler handleConfirm sans await pour éviter de bloquer le formulaire
    // Les erreurs seront gérées par le composant parent via la promesse rejetée
    handleConfirm();
  };

  return (
    <Form {...form}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4"
        id="user-reset-password-modal"
      >
        <FormInput
          form={form}
          name="username"
          label={t("modals.resetPassword.usernameLabel")}
          placeholder={t("modals.resetPassword.usernamePlaceholder", {
            username,
          })}
          disabled={isLoading}
          required
        />
      </form>
    </Form>
  );
};
