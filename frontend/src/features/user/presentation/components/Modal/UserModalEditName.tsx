"use client";

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
  createEditNameModalSchema,
  type EditNameModalFormData,
} from "../../schemas";
import type { UserEditNameModalData } from "../../types/UserModalEditNameTypes";

// Fonction utilitaire pour créer la description du modal
export const createEditNameDescription = (
  userId: string,
  currentGivenName: string,
  currentFamilyName: string,
  t: TranslateFn
): React.ReactElement => {
  return (
    <>
      {t("user:modals.editName.description")} <b>{currentGivenName} {currentFamilyName}</b>.
      <span className="block mt-2">
        {t("user:modals.editName.confirmInstruction")}{" "}
        <SelectableText>{userId}</SelectableText>
      </span>
    </>
  );
};

export const UserModalEditName: React.FC<{
  userId: string;
  currentGivenName: string;
  currentFamilyName: string;
}> = ({ userId, currentGivenName, currentFamilyName }) => {
  const { t } = useTranslation(["user", "common"]);
  const { _setData, handleConfirm, isLoading } =
    useModalContext<UserEditNameModalData>();

  const schema = createEditNameModalSchema(userId, t);

  const form = useForm<EditNameModalFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      givenName: currentGivenName,
      familyName: currentFamilyName,
      userId: "",
    },
    mode: "onChange",
  });

  const { handleSubmit, watch, reset } = form;
  const watchedUserId = watch("userId");
  const watchedGivenName = watch("givenName");
  const watchedFamilyName = watch("familyName");

  useEffect(() => {
    const isUserIdValid = watchedUserId === userId;
    const hasChanged =
      watchedGivenName !== currentGivenName ||
      watchedFamilyName !== currentFamilyName;

    const isValid = isUserIdValid && hasChanged;
    _setData({ isValid });
  }, [watchedUserId, watchedGivenName, watchedFamilyName, userId, currentGivenName, currentFamilyName, _setData]);

  // Reset automatique quand le modal s'ouvre
  useEffect(() => {
    reset({
      givenName: currentGivenName,
      familyName: currentFamilyName,
      userId: "",
    });
  }, [reset, currentGivenName, currentFamilyName]);

  const onSubmit = () => {
    const givenName = watchedGivenName;
    const familyName = watchedFamilyName;
    handleConfirm(givenName, familyName);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4"
        id="user-edit-name-modal"
      >
        <FormInput
          form={form}
          name="givenName"
          label={t("common:fields.firstName")}
          placeholder={t("user:modals.editName.givenNamePlaceholder")}
          disabled={isLoading}
          required
        />

        <FormInput
          form={form}
          name="familyName"
          label={t("common:fields.lastName")}
          placeholder={t("user:modals.editName.familyNamePlaceholder")}
          disabled={isLoading}
          required
        />

        <FormInput
          form={form}
          name="userId"
          label={t("user:modals.editName.userIdLabel")}
          placeholder={t("user:modals.editName.userIdPlaceholder", { userId })}
          disabled={isLoading}
          required
        />
      </form>
    </Form>
  );
};
