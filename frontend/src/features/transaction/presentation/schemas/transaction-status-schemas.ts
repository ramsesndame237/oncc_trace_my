import { TranslateFn } from "@/i18n/types";
import { z } from "zod";

/**
 * Schéma de validation pour la confirmation/annulation d'une transaction
 * @param transactionCode - Code de la transaction attendu pour confirmation
 * @param t - Fonction de traduction
 */
export const createTransactionStatusSchema = (
  transactionCode: string,
  t: TranslateFn
) => {
  return z.object({
    transactionCode: z
      .string()
      .min(1, { message: t("modals.status.validation.required") })
      .refine((value) => value === transactionCode, {
        message: t("modals.status.validation.mismatch"),
      }),
  });
};

/**
 * Type pour les données du formulaire de changement de statut
 */
export type TransactionStatusFormData = {
  transactionCode: string;
};
