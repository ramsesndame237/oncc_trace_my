import { TranslateFn } from "@/i18n/types";
import { z } from "zod";

/**
 * Schéma de validation pour l'annulation d'un transfert de produit
 * @param transferCode - Code du transfert attendu pour confirmation
 * @param t - Fonction de traduction
 */
export const createProductTransferCancelSchema = (
  transferCode: string,
  t: TranslateFn
) => {
  return z.object({
    transferCode: z
      .string()
      .min(1, { message: t("modals.cancel.validation.required") })
      .refine((value) => value === transferCode, {
        message: t("modals.cancel.validation.mismatch"),
      }),
  });
};

/**
 * Type pour les données du formulaire d'annulation
 */
export type ProductTransferCancelFormData = {
  transferCode: string;
};
