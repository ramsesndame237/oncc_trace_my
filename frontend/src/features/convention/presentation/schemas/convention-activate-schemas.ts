import { z } from "zod";
import type { TranslateFn } from "@/i18n/types";

export const createConventionActivateSchema = (
  expectedConventionId: string,
  t: TranslateFn
) => {
  return z.object({
    conventionId: z
      .string()
      .min(1, t("convention:validation.conventionIdRequired"))
      .refine(
        (value) => value === expectedConventionId,
        t("convention:validation.conventionIdMismatch")
      ),
  });
};

export type ConventionActivateFormData = z.infer<
  ReturnType<typeof createConventionActivateSchema>
>;
