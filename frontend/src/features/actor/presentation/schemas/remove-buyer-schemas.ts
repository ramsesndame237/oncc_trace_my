import { z } from "zod";
import type { TranslateFn } from "@/i18n/types";

export const createRemoveBuyerSchema = (
  expectedBuyerId: string,
  t: TranslateFn
) => {
  return z.object({
    buyerId: z
      .string()
      .min(1, t("actor:validation.buyerIdRequired"))
      .refine(
        (value) => value === expectedBuyerId,
        t("actor:validation.buyerIdMismatch")
      ),
  });
};

export type RemoveBuyerFormData = z.infer<
  ReturnType<typeof createRemoveBuyerSchema>
>;
