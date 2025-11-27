import { z } from "zod";

export const createCampaignActionSchema = (
  expectedCampaignCode: string
) => {
  return z.object({
    campaignCode: z
      .string()
      .min(1, "Le code de la campagne est requis")
      .refine(
        (value) => value === expectedCampaignCode,
        "Le code saisi ne correspond pas au code de la campagne"
      ),
  });
};

export type CampaignActionFormData = z.infer<
  ReturnType<typeof createCampaignActionSchema>
>;