import { z } from "zod"

/**
 * Schéma pour les informations du chauffeur
 */
export const driverInfoSchema = z.object({
  fullName: z.string().min(1, "Le nom complet du chauffeur est requis"),
  vehicleRegistration: z
    .string()
    .min(1, "L'immatriculation du véhicule est requise"),
  drivingLicenseNumber: z
    .string()
    .min(1, "Le numéro de permis de conduire est requis"),
  routeSheetCode: z.string().min(1, "Le code feuille de route est requis"),
})

/**
 * Schéma Step 1 - Informations générales (sans driver info)
 */
export const step1Schema = z.object({
  senderActorId: z.string().min(1, "L'expéditeur (Producteur) est requis"),
  receiverActorId: z.string().min(1, "Le destinataire (OPA) est requis"),
  receiverStoreId: z.string().min(1, "Le magasin destinataire est requis"),
  transferDate: z.string().min(1, "La date de transfert est requise"),
})

export type Step1Data = z.infer<typeof step1Schema>

/**
 * Schéma pour un produit
 */
export const productSchema = z.object({
  quality: z.string().min(1, "La qualité est requise"),
  weight: z
    .number()
    .positive("Le poids doit être supérieur à 0")
    .or(z.string().min(1, "Le poids est requis")),
  numberOfBags: z
    .number()
    .int()
    .positive("Le nombre de sacs doit être supérieur à 0")
    .or(z.string().min(1, "Le nombre de sacs est requis")),
})

export type ProductData = z.infer<typeof productSchema>

/**
 * Schéma Step 2 - Produits
 */
export const step2Schema = z.object({
  products: z
    .array(productSchema)
    .min(1, "Au moins un produit est requis")
    .refine(
      (products) => {
        // Vérifier qu'il n'y a pas de doublons de qualité
        const qualities = products.map((p) => p.quality)
        return new Set(qualities).size === qualities.length
      },
      {
        message: "Chaque qualité ne peut être ajoutée qu'une seule fois",
      }
    ),
})

export type Step2Data = z.infer<typeof step2Schema>

/**
 * Schéma Step 3 - Récapitulatif
 */
export const step3Schema = z.object({
  confirmed: z.boolean().refine((val) => val === true, {
    message: "Vous devez confirmer les informations avant de soumettre",
  }),
})

export type Step3Data = z.infer<typeof step3Schema>

/**
 * Schéma complet du formulaire
 */
export const groupageFormSchema = z.object({
  step1: step1Schema,
  step2: step2Schema,
  step3: step3Schema,
})

export type GroupageFormData = z.infer<typeof groupageFormSchema>
