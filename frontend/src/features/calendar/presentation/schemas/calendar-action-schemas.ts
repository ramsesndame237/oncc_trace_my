import { TranslateFn } from "@/i18n/types";
import { z } from "zod";

export const createCalendarActionSchema = (
  expectedCode: string,
  t: TranslateFn
) => {
  return z.object({
    code: z
      .string()
      .min(1, t("modals.changeStatus.codeRequired"))
      .refine(
        (value) => value === expectedCode,
        t("modals.changeStatus.codeMismatch")
      ),
  });
};

export type CalendarActionFormData = z.infer<
  ReturnType<typeof createCalendarActionSchema>
>;

export const createUpdateExpectedSalesCountSchema = (
  expectedCode: string,
  t: TranslateFn
) => {
  return z.object({
    code: z
      .string()
      .min(1, t("modals.updateExpectedSalesCount.codeRequired"))
      .refine(
        (value) => value === expectedCode,
        t("modals.updateExpectedSalesCount.codeMismatch")
      ),
    expectedSalesCount: z.coerce
      .number({
        invalid_type_error: t(
          "modals.updateExpectedSalesCount.expectedSalesCountRequired"
        ),
      })
      .min(0, t("modals.updateExpectedSalesCount.expectedSalesCountMin")),
  });
};

export type UpdateExpectedSalesCountFormData = z.infer<
  ReturnType<typeof createUpdateExpectedSalesCountSchema>
>;
