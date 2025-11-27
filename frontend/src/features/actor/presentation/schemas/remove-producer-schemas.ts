import { z } from "zod";
import type { TranslateFn } from "@/i18n/types";

export const createRemoveProducerSchema = (
  expectedProducerId: string,
  t: TranslateFn
) => {
  return z.object({
    producerId: z
      .string()
      .min(1, t("actor:validation.producerIdRequired"))
      .refine(
        (value) => value === expectedProducerId,
        t("actor:validation.producerIdMismatch")
      ),
  });
};

export type RemoveProducerFormData = z.infer<
  ReturnType<typeof createRemoveProducerSchema>
>;
