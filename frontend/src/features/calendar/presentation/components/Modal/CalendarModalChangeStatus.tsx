"use client";

import FormInput from "@/components/forms/form-input";
import { useModalContext } from "@/components/modals/contexts/DynamicModalProvider";
import { Form } from "@/components/ui/form";
import { SelectableText } from "@/components/ui/selectable-text";
import { TranslateFn } from "@/i18n/types";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
  createCalendarActionSchema,
  type CalendarActionFormData,
} from "../../schemas";
import type { CalendarModalChangeStatusData } from "../../types/CalendarModalChangeStatusTypes";

// Fonction utilitaire pour créer la description du modal
export const createCalendarActionDescription = (
  calendarCode: string,
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
        <SelectableText>{calendarCode}</SelectableText>
      </span>
    </>
  );
};

export const CalendarModalChangeStatus: React.FC<{
  calendarCode: string;
}> = ({ calendarCode }) => {
  const { t } = useTranslation("calendar");
  const { _setData, handleConfirm, isLoading } =
    useModalContext<CalendarModalChangeStatusData>();

  const schema = createCalendarActionSchema(calendarCode, t);

  const form = useForm<CalendarActionFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      code: "",
    },
    mode: "onChange",
  });

  const { handleSubmit, watch, reset } = form;
  const watchedCode = watch("code");

  useEffect(() => {
    const isValid = watchedCode === calendarCode;
    _setData({ isValid });
  }, [watchedCode, calendarCode, _setData]);

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
        id="calendar-action-modal"
      >
        <FormInput
          form={form}
          name="code"
          label={t("modals.changeStatus.codeLabel")}
          placeholder={t("modals.changeStatus.codePlaceholder")}
          disabled={isLoading}
          required
        />
      </form>
    </Form>
  );
};
