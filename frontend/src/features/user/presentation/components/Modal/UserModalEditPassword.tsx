"use client";

import { FormPasswordInput } from "@/components/forms";
import FormInput from "@/components/forms/form-input";
import { useModalContext } from "@/components/modals/contexts/DynamicModalProvider";
import { Form } from "@/components/ui/form";
import { SelectableText } from "@/components/ui/selectable-text";
import type { TranslateFn } from "@/i18n/types";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
  createEditPasswordModalSchema,
  type EditPasswordModalFormData,
} from "../../schemas";
import type { UserEditPasswordModalData } from "../../types/UserModalEditPasswordTypes";

// Fonction utilitaire pour créer la description du modal
export const createEditPasswordDescription = (
  userId: string,
  t: TranslateFn
): React.ReactElement => {
  return (
    <>
      {t("user:modals.editPassword.description")}
      <span className="block mt-2">
        {t("user:modals.editPassword.confirmInstruction")}{" "}
        <SelectableText>{userId}</SelectableText>
      </span>
    </>
  );
};

export const UserModalEditPassword: React.FC<{
  userId: string;
}> = ({ userId }) => {
  const { t } = useTranslation(["user", "common", "auth"]);
  const { _setData, handleConfirm, isLoading } =
    useModalContext<UserEditPasswordModalData>();

  const schema = createEditPasswordModalSchema(userId, t);

  const form = useForm<EditPasswordModalFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
      userId: "",
    },
    mode: "onChange",
  });

  const { handleSubmit, watch, reset } = form;
  const watchedUserId = watch("userId");
  const watchedCurrentPassword = watch("currentPassword");
  const watchedNewPassword = watch("newPassword");
  const watchedConfirmPassword = watch("confirmPassword");

  useEffect(() => {
    const isUserIdValid = watchedUserId === userId;
    const hasCurrentPassword = watchedCurrentPassword.trim().length > 0;
    const hasNewPassword = watchedNewPassword.trim().length >= 8;
    const passwordsMatch =
      watchedNewPassword === watchedConfirmPassword &&
      watchedConfirmPassword.trim().length > 0;

    const isValid =
      isUserIdValid && hasCurrentPassword && hasNewPassword && passwordsMatch;
    _setData({ isValid });
  }, [
    watchedUserId,
    watchedCurrentPassword,
    watchedNewPassword,
    watchedConfirmPassword,
    userId,
    _setData,
  ]);

  // Reset automatique quand le modal s'ouvre
  useEffect(() => {
    reset({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
      userId: "",
    });
  }, [reset]);

  const onSubmit = () => {
    handleConfirm(watchedCurrentPassword, watchedNewPassword);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4"
        id="user-edit-password-modal"
      >
        <FormPasswordInput
          form={form}
          name="currentPassword"
          label={t("auth:form.currentPassword")}
          placeholder={t("user:modals.editPassword.currentPasswordPlaceholder")}
          disabled={isLoading}
          required
        />

        <FormPasswordInput
          form={form}
          name="newPassword"
          label={t("auth:form.newPassword")}
          placeholder={t("user:modals.editPassword.newPasswordPlaceholder")}
          disabled={isLoading}
          required
          showValidation
          validationRules={{
            minLength: 8,
            requireUpperCase: true,
            requireLowerCase: true,
            requireNumber: true,
            requireSpecialChar: true,
          }}
          validationTitle={t("auth:validation.title")}
          customValidationMessages={{
            minLength: t("auth:validation.minLength"),
            upperCase: t("auth:validation.upperCase"),
            lowerCase: t("auth:validation.lowerCase"),
            number: t("auth:validation.number"),
            specialChar: t("auth:validation.specialChar"),
          }}
        />

        <FormPasswordInput
          form={form}
          name="confirmPassword"
          label={t("auth:form.confirmPassword")}
          placeholder={t("user:modals.editPassword.confirmPasswordPlaceholder")}
          disabled={isLoading}
          required
        />

        <FormInput
          form={form}
          name="userId"
          label={t("user:modals.editPassword.userIdLabel")}
          placeholder={t("user:modals.editPassword.userIdPlaceholder", { userId })}
          disabled={isLoading}
          required
        />
      </form>
    </Form>
  );
};
