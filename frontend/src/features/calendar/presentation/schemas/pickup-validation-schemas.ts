import type { TranslateFn } from "@/i18n/types"
import { z } from "zod"

/**
 * Schéma Step 1 - Informations du calendrier ENLEVEMENT
 */
export const createStep1Schema = (t: TranslateFn) => z
  .object({
    opaId: z.string().min(1, t("calendar:forms.pickupAdd.step1.validation.opaRequired")),
    conventionId: z.string().min(1, t("calendar:forms.pickupAdd.step1.validation.conventionRequired")),
    startDate: z
      .string()
      .min(1, t("calendar:forms.pickupAdd.step1.validation.startDateRequired"))
      .refine(
        (date) => {
          const selectedDate = new Date(date);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return selectedDate > today;
        },
        t("calendar:forms.pickupAdd.step1.validation.startDateMustBeAfterToday")
      )
      .refine(
        (date) => {
          const selectedDate = new Date(date);
          const oneYearFromNow = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
          return selectedDate <= oneYearFromNow;
        },
        t("calendar:forms.pickupAdd.step1.validation.startDateMaxOneYear")
      ),
    endDate: z.string().min(1, t("calendar:forms.pickupAdd.step1.validation.endDateRequired")),
    locationCode: z.string().min(1, t("calendar:forms.pickupAdd.step1.validation.locationCodeRequired")),
    location: z.string().min(1, t("calendar:forms.pickupAdd.step1.validation.locationRequired")),
    eventTime: z.string().min(1, t("calendar:forms.pickupAdd.step1.validation.eventTimeRequired")),
  })
  .refine(
    (data) => {
      // Si l'une des dates est vide, on laisse la validation de présence gérer
      if (!data.startDate || !data.endDate) return true
      // Vérifier que la date de fin est strictement supérieure à la date de début
      return new Date(data.endDate) > new Date(data.startDate)
    },
    {
      message: t("calendar:forms.pickupAdd.step1.validation.endDateMustBeAfterStartDate"),
      path: ["endDate"], // Affiche l'erreur sur le champ endDate
    }
  )
  .refine(
    (data) => {
      // Si l'une des dates est vide, on laisse la validation de présence gérer
      if (!data.startDate || !data.endDate) return true
      const startDate = new Date(data.startDate)
      const endDate = new Date(data.endDate)

      // Calculer la différence en millisecondes puis en jours
      const diffInMs = endDate.getTime() - startDate.getTime()
      const diffInDays = diffInMs / (1000 * 60 * 60 * 24)

      // Vérifier que l'intervalle ne dépasse pas 365 jours (1 an)
      return diffInDays <= 365
    },
    {
      message: t("calendar:forms.pickupAdd.step1.validation.maxDurationExceeded"),
      path: ["endDate"], // Affiche l'erreur sur le champ endDate
    }
  )

export type Step1Data = z.infer<ReturnType<typeof createStep1Schema>>

/**
 * Schéma Step 2 - Récapitulatif
 */
export const createStep2Schema = (t: TranslateFn) => z.object({
  confirmed: z.boolean().refine((val) => val === true, {
    message: t("calendar:forms.pickupAdd.step2.confirmRequired"),
  }),
})

export type Step2Data = z.infer<ReturnType<typeof createStep2Schema>>

/**
 * Schéma complet du formulaire
 */
export const createPickupCalendarFormSchema = (t: TranslateFn) => z.object({
  step1: createStep1Schema(t),
  step2: createStep2Schema(t),
})

export type PickupCalendarFormData = z.infer<ReturnType<typeof createPickupCalendarFormSchema>>

/**
 * Fonction helper pour parser une date string en fuseau local
 */
const parseLocalDate = (dateString: string): Date => {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day); // month-1 car les mois sont 0-indexés
};

/**
 * Schéma pour l'édition d'un calendrier ENLEVEMENT
 */
export const createPickupEditSchema = (t: TranslateFn) => z
  .object({
    opaId: z.string().min(1, t("calendar:forms.pickupAdd.step1.validation.opaRequired")),
    conventionId: z.string().min(1, t("calendar:forms.pickupAdd.step1.validation.conventionRequired")),
    startDate: z
      .string()
      .min(1, t("calendar:forms.pickupAdd.step1.validation.startDateRequired"))
      .refine(
        (date) => {
          if (!date) return true;
          const selectedDate = parseLocalDate(date);
          const tomorrow = new Date();
          tomorrow.setHours(0, 0, 0, 0);
          tomorrow.setDate(tomorrow.getDate() + 1);
          return selectedDate >= tomorrow;
        },
        t("calendar:forms.pickupAdd.step1.validation.startDateMustBeAfterToday")
      )
      .refine(
        (date) => {
          if (!date) return true;
          const selectedDate = parseLocalDate(date);
          const oneYearFromNow = new Date();
          oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
          return selectedDate <= oneYearFromNow;
        },
        t("calendar:forms.pickupAdd.step1.validation.startDateMaxOneYear")
      ),
    endDate: z.string().min(1, t("calendar:forms.pickupAdd.step1.validation.endDateRequired")),
    locationCode: z.string().min(1, t("calendar:forms.pickupAdd.step1.validation.locationCodeRequired")),
    location: z.string().min(1, t("calendar:forms.pickupAdd.step1.validation.locationRequired")),
    eventTime: z.string().min(1, t("calendar:forms.pickupAdd.step1.validation.eventTimeRequired")),
  })
  .refine(
    (data) => {
      if (!data.startDate || !data.endDate) return true;
      const start = parseLocalDate(data.startDate);
      const end = parseLocalDate(data.endDate);
      return end > start;
    },
    {
      message: t("calendar:forms.pickupAdd.step1.validation.endDateMustBeAfterStartDate"),
      path: ["endDate"],
    }
  )
  .refine(
    (data) => {
      if (!data.startDate || !data.endDate) return true;
      const start = parseLocalDate(data.startDate);
      const end = parseLocalDate(data.endDate);
      const daysDifference = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      return daysDifference <= 365;
    },
    {
      message: t("calendar:forms.pickupAdd.step1.validation.maxDurationExceeded"),
      path: ["endDate"],
    }
  );

export type PickupEditData = z.infer<ReturnType<typeof createPickupEditSchema>>;
