import { z } from "zod";
import type { TranslateFn } from "@/i18n/types";

export const createRemoveOccupantSchema = (
  expectedOccupantId: string,
  t: TranslateFn
) => {
  return z.object({
    occupantId: z
      .string()
      .min(1, t("store:validation.occupantIdRequired"))
      .refine(
        (value) => value === expectedOccupantId,
        t("store:validation.occupantIdMismatch")
      ),
  });
};

export type RemoveOccupantFormData = z.infer<
  ReturnType<typeof createRemoveOccupantSchema>
>;
