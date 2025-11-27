import { z } from "zod";

export const createStoreActionSchema = (
  expectedStoreCode: string
) => {
  return z.object({
    storeCode: z
      .string()
      .min(1, "Le code du magasin est requis")
      .refine(
        (value) => value === expectedStoreCode,
        "Le code saisi ne correspond pas au code du magasin"
      ),
  });
};

export type StoreActionFormData = z.infer<
  ReturnType<typeof createStoreActionSchema>
>;