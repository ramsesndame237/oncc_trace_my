import { z } from "zod"
import type { IFileValue } from "@/types/type"

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
 * Schéma Step 1 - Informations générales
 */
export const step1Schema = z.object({
  senderActorId: z.string().min(1, "L'expéditeur est requis"),
  senderStoreId: z.string().min(1, "Le magasin expéditeur est requis"),
  receiverActorId: z.string().min(1, "Le destinataire est requis"),
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
 * Schéma Step 3 - Informations chauffeur (optionnel)
 */
export const step3Schema = z
  .object({
    hasDriver: z.boolean(),
    driverInfo: driverInfoSchema.optional(),
  })
  .refine(
    (data) => {
      // Si hasDriver est true, driverInfo doit être fourni et valide
      if (data.hasDriver) {
        return !!data.driverInfo
      }
      return true
    },
    {
      message: "Les informations du chauffeur sont requises",
      path: ["driverInfo"],
    }
  )

export type Step3Data = z.infer<typeof step3Schema>

/**
 * Schéma Step 4 - Documents justificatifs (optionnels)
 */
export const step4Schema = z.object({
  routeSheetDocuments: z.array(z.custom<IFileValue>()).default([]),
})

export type Step4Data = z.infer<typeof step4Schema>

/**
 * Schéma Step 5 - Récapitulatif et confirmation
 */
export const step5Schema = z.object({
  confirmed: z.boolean().refine((val) => val === true, {
    message: "Vous devez confirmer les informations avant de soumettre",
  }),
})

export type Step5Data = z.infer<typeof step5Schema>

/**
 * Schéma complet du formulaire
 */
export const standardFormSchema = z.object({
  step1: step1Schema,
  step2: step2Schema,
  step3: step3Schema,
  step4: step4Schema,
  step5: step5Schema,
})

export type StandardFormData = z.infer<typeof standardFormSchema>

/**
 * Schéma de validation pour l'édition des documents
 * Les documents sont optionnels lors de l'édition
 */
export const createEditDocumentsSchema = () => {
  return z.object({
    routeSheetDocuments: z
      .array(
        z.object({
          optionValues: z.array(z.string()),
          type: z.string().min(1, "Type is required"),
          data: z.union([z.string(), z.instanceof(Blob)]), // ⭐ Peut être base64 (string) OU Blob
          fileSize: z.number().positive("File size must be positive"),
          name: z.string().min(1, "Name is required"),
          id: z.string().optional(),
        })
      )
      .default([]),
  });
};

export type EditDocumentsData = z.infer<ReturnType<typeof createEditDocumentsSchema>>
