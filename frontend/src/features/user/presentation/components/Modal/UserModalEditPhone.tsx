"use client";

import FormInput from "@/components/forms/form-input";
import FormPhoneInput from "@/components/forms/form-phone-input";
import { useModalContext } from "@/components/modals/contexts/DynamicModalProvider";
import { Form } from "@/components/ui/form";
import { SelectableText } from "@/components/ui/selectable-text";
import type { TranslateFn } from "@/i18n/types";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
  createEditPhoneModalSchema,
  type EditPhoneModalFormData,
} from "../../schemas";
import type { UserEditPhoneModalData } from "../../types/UserModalEditPhoneTypes";

// Fonction utilitaire pour créer la description du modal
export const createEditPhoneDescription = (
  userId: string,
  currentPhone: string | undefined,
  t: TranslateFn
): React.ReactElement => {
  return (
    <>
      {t("user:modals.editPhone.description")}
      {currentPhone
        ? ` ${t("user:modals.editPhone.currentPhone", { phone: currentPhone })}`
        : ""}
      .
      <span className="block mt-2">
        {t("user:modals.editPhone.confirmInstruction")}{" "}
        <SelectableText>{userId}</SelectableText>
      </span>
    </>
  );
};

export const UserModalEditPhone: React.FC<{
  userId: string;
  currentPhone?: string;
}> = ({ userId, currentPhone }) => {
  const { t } = useTranslation(["user", "common"]);
  const { _setData, handleConfirm, isLoading } =
    useModalContext<UserEditPhoneModalData>();

  const schema = createEditPhoneModalSchema(userId, t);

  const form = useForm<EditPhoneModalFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      phone: currentPhone || "",
      userId: "",
    },
    mode: "onChange",
  });

  const { handleSubmit, watch, reset } = form;
  const watchedUserId = watch("userId");
  const watchedPhone = watch("phone");

  useEffect(() => {
    const isUserIdValid = watchedUserId === userId;
    const hasChanged = watchedPhone !== (currentPhone || "");

    const isValid = isUserIdValid && hasChanged;
    _setData({ isValid });
  }, [watchedUserId, watchedPhone, userId, currentPhone, _setData]);

  // Reset automatique quand le modal s'ouvre
  useEffect(() => {
    reset({
      phone: currentPhone || "",
      userId: "",
    });
  }, [reset, currentPhone]);

  const onSubmit = () => {
    const phone = watchedPhone;
    handleConfirm(phone);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4"
        id="user-edit-phone-modal"
      >
        <FormPhoneInput
          form={form}
          name="phone"
          label={t("common:fields.phone")}
          placeholder={t("user:modals.editPhone.phonePlaceholder")}
          disabled={isLoading}
        />

        <FormInput
          form={form}
          name="userId"
          label={t("user:modals.editPhone.userIdLabel")}
          placeholder={t("user:modals.editPhone.userIdPlaceholder", { userId })}
          disabled={isLoading}
          required
        />
      </form>
    </Form>
  );
};
