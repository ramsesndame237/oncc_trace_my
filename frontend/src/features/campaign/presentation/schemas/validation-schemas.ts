import { z } from "zod";

/**
 * Schéma de validation pour la création d'une campagne
 */
export const campaignSchema = z
  .object({
    startDate: z
      .string()
      .min(1, "La date de début est requise")
      .refine((date) => {
        const selectedDate = new Date(date);
        const today = new Date();
        today.setHours(23, 59, 59, 999); // Fin de la journée courante
        return selectedDate > today;
      }, "La date de début doit être strictement supérieure à aujourd'hui")
      .refine((date) => {
        const selectedDate = new Date(date);
        const oneYearFromNow = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
        return selectedDate <= oneYearFromNow;
      }, "La date de début ne peut pas être sélectionnée au-delà d'un an dans le futur"),
    endDate: z.string().min(1, "La date de fin est requise"),
  })
  .refine(
    (data) => {
      if (!data.startDate || !data.endDate) return true; // Laisser les validations individuelles gérer les champs vides
      const startDate = new Date(data.startDate);
      const endDate = new Date(data.endDate);
      return endDate > startDate;
    },
    {
      message:
        "La date de fin doit être strictement supérieure à la date de début",
      path: ["endDate"], // L'erreur sera affichée sur le champ endDate
    }
  )
  .refine(
    (data) => {
      if (!data.startDate || !data.endDate) return true; // Laisser les validations individuelles gérer les champs vides
      const startDate = new Date(data.startDate);
      const endDate = new Date(data.endDate);

      // Calculer la différence en millisecondes puis en jours
      const diffInMs = endDate.getTime() - startDate.getTime();
      const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

      // Vérifier que l'intervalle ne dépasse pas 365 jours (1 an)
      return diffInDays <= 365;
    },
    {
      message:
        "L'intervalle entre les dates ne peut pas dépasser un an (365 jours)",
      path: ["endDate"], // L'erreur sera affichée sur le champ endDate
    }
  );

/**
 * Schéma de validation pour les filtres de campagne
 */
export const campaignFiltersSchema = z.object({
  search: z.string().optional(),
  status: z.enum(["active", "inactive"]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

/**
 * Type dérivé du schéma de validation pour les formulaires
 */
export type CampaignFormData = z.infer<typeof campaignSchema>;

/**
 * Type dérivé du schéma de validation pour les filtres
 */
export type CampaignFiltersFormData = z.infer<typeof campaignFiltersSchema>;
