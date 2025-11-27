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
  createUpdateExpectedSalesCountSchema,
  type UpdateExpectedSalesCountFormData,
} from "../../schemas/calendar-action-schemas";
import type { CalendarModalUpdateExpectedSalesCountData } from "../../types/CalendarModalUpdateExpectedSalesCountTypes";

// Fonction utilitaire pour créer la description du modal
export const createUpdateExpectedSalesCountDescription = (
  calendarCode: string,
  currentValue: number | null,
  t: TranslateFn
): React.ReactElement => {
  return (
    <>
      {t("modals.updateExpectedSalesCount.description")}
      <span className="block mt-2">
        <strong>{t("modals.updateExpectedSalesCount.currentValue")}:</strong>{" "}
        {currentValue !== null ? currentValue : "N/A"}
      </span>
      <span className="block mt-2">
        {t("modals.updateExpectedSalesCount.confirmInstruction") + " "}
        <SelectableText>{calendarCode}</SelectableText>
      </span>
    </>
  );
};

export const CalendarModalUpdateExpectedSalesCount: React.FC<{
  calendarCode: string;
  currentExpectedSalesCount: number | null;
}> = ({ calendarCode, currentExpectedSalesCount }) => {
  const { t } = useTranslation("calendar");
  const { _setData, _updateExpectedSalesCount, handleConfirm, isLoading } =
    useModalContext<CalendarModalUpdateExpectedSalesCountData>();

  const schema = createUpdateExpectedSalesCountSchema(calendarCode, t);

  const form = useForm<UpdateExpectedSalesCountFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      code: "",
      expectedSalesCount: currentExpectedSalesCount || 0,
    },
    mode: "onChange",
  });

  const { handleSubmit, watch, reset } = form;
  const watchedCode = watch("code");
  const watchedExpectedSalesCount = watch("expectedSalesCount");

  // Mettre à jour isValid dans le contexte
  useEffect(() => {
    const isCodeValid = watchedCode === calendarCode;

    // Convertir explicitement en nombre car watch() retourne la valeur brute
    const expectedSalesCountNumber = Number(watchedExpectedSalesCount);
    const isExpectedSalesCountValid =
      watchedExpectedSalesCount !== '' &&
      watchedExpectedSalesCount !== null &&
      watchedExpectedSalesCount !== undefined &&
      !isNaN(expectedSalesCountNumber) &&
      expectedSalesCountNumber >= 0;

    const isValid = isCodeValid && isExpectedSalesCountValid;

    _setData({
      isValid,
      expectedSalesCount: expectedSalesCountNumber,
    });

    // Mettre à jour la variable de closure dans le hook
    _updateExpectedSalesCount?.(expectedSalesCountNumber);
  }, [watchedCode, watchedExpectedSalesCount, calendarCode, _setData, _updateExpectedSalesCount]);

  // Reset automatique quand le modal s'ouvre
  useEffect(() => {
    reset({
      code: "",
      expectedSalesCount: currentExpectedSalesCount || 0,
    });
  }, [reset, currentExpectedSalesCount]);

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
        id="calendar-update-expected-sales-count-modal"
      >
        <FormInput
          form={form}
          name="expectedSalesCount"
          type="number"
          label={t("modals.updateExpectedSalesCount.expectedSalesCountLabel")}
          placeholder={t("modals.updateExpectedSalesCount.expectedSalesCountPlaceholder")}
          disabled={isLoading}
          required
        />

        <FormInput
          form={form}
          name="code"
          label={t("modals.updateExpectedSalesCount.codeLabel")}
          placeholder={t("modals.updateExpectedSalesCount.codePlaceholder")}
          disabled={isLoading}
          required
        />
      </form>
    </Form>
  );
};
