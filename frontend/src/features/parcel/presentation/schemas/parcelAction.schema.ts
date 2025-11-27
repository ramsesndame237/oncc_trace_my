import { z } from "zod";

export const createParcelActionSchema = (parcelId: string) => {
  return z.object({
    parcelId: z
      .string()
      .min(1, "L'ID de la parcelle est requis")
      .refine((value) => value === parcelId, {
        message: "L'ID de la parcelle ne correspond pas",
      }),
  });
};

export type ParcelActionFormData = z.infer<
  ReturnType<typeof createParcelActionSchema>
>;
