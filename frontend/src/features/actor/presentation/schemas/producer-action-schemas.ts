import { z } from "zod";
import type { TranslateFn } from "@/i18n/types";

export const createProducerActionSchema = (
  expectedActorId: string,
  action: "activate" | "deactivate",
  t: TranslateFn
) => {
  return z.object({
    actorId: z
      .string()
      .min(1, t("actor:validation.actorIdRequired"))
      .refine(
        (value) => value === expectedActorId,
        t("actor:validation.actorIdMismatch")
      ),
  });
};

export type ProducerActionFormData = z.infer<
  ReturnType<typeof createProducerActionSchema>
>;
