import type { TranslateFn } from "@/i18n/types";
import { IFileValue } from "@/types/type";
import { z } from "zod";

// Schema pour IFileValue (structure de fichier uploadé)
const fileValueSchema: z.ZodType<IFileValue> = z.object({
  optionValues: z.array(z.any()), // [extraValue, documentType]
  type: z.string(), // Type MIME du fichier
  data: z.union([z.string(), z.instanceof(Blob)]), // ⭐ Peut être base64 (string) OU Blob
  fileSize: z.number(), // Taille du fichier en bytes
  name: z.string().optional(),
  id: z.string().optional(), // ID du document existant (pour édition)
});

/**
 * Schéma de validation pour l'étape 1 - Informations de base
 */
export const createStep1Schema = (t: TranslateFn) => {
  return z.object({
    buyerExporterId: z
      .string()
      .min(1, t("convention:form.step1.validation.buyerExporterRequired")),
    producersId: z
      .string()
      .min(1, t("convention:form.step1.validation.producerRequired")),
    signatureDate: z
      .string()
      .min(1, t("convention:form.step1.validation.signatureDateRequired")),
  });
};

export type Step1Data = z.infer<ReturnType<typeof createStep1Schema>>;

/**
 * Schéma de validation pour un produit
 */
export const createProductSchema = (t: TranslateFn) => {
  return z.object({
    quality: z
      .string()
      .min(1, t("convention:form.step2.validation.qualityRequired")),
    standard: z
      .string()
      .min(1, t("convention:form.step2.validation.standardRequired")),
    weight: z.coerce
      .number()
      .min(1, t("convention:form.step2.validation.weightRequired")),
    bags: z.coerce
      .number()
      .min(1, t("convention:form.step2.validation.bagsRequired")),
    humidity: z.coerce
      .number()
      .min(0.01, t("convention:form.step2.validation.humidityInvalid"))
      .max(100, t("convention:form.step2.validation.humidityInvalid")),
    pricePerKg: z.coerce
      .number()
      .min(1, t("convention:form.step2.validation.priceRequired")),
  });
};

// Type d'entrée pour le formulaire (accepte string | number pour les champs numériques)
export type ProductFormInput = z.input<ReturnType<typeof createProductSchema>>;
// Type de sortie après validation (tous les champs numériques sont des numbers)
export type ProductData = z.output<ReturnType<typeof createProductSchema>>;

/**
 * Schéma de validation pour l'étape 2 - Produits
 */
export const createStep2Schema = (t: TranslateFn) => {
  return z.object({
    products: z
      .array(createProductSchema(t))
      .min(1, t("convention:form.step2.validation.atLeastOneProduct")),
  });
};

export type Step2Data = z.infer<ReturnType<typeof createStep2Schema>>;

/**
 * Schéma de validation pour l'étape 3 - Documents
 * Pattern: required field uses default([]) + refine on field, optional fields use optional()
 */
export const createStep3Schema = (t: TranslateFn) => {
  return z.object({
    // Documents de convention obligatoires
    conventionDocuments: z
      .array(fileValueSchema)
      .default([])
      .refine((files) => files.length > 0, {
        message: t("convention:form.step3.validation.contractRequired"),
      }),
    // Documents complémentaires optionnels
    complementDocuments: z.array(fileValueSchema).optional(),
  });
};

export type Step3Data = z.infer<ReturnType<typeof createStep3Schema>>;

/**
 * Schéma de validation pour l'étape 4 - Récapitulatif
 */
export const createStep4Schema = (t: TranslateFn) => {
  return z.object({
    confirmed: z
      .boolean()
      .refine((val) => val === true, {
        message: t("convention:form.summary.validation.confirmRequired"),
      }),
  });
};

export type Step4Data = z.infer<ReturnType<typeof createStep4Schema>>;

/**
 * Schéma de validation pour la gestion des documents d'une convention existante
 * Les documents de convention ne sont plus obligatoires car ils existent déjà
 */
export const createEditDocumentsSchema = (t: TranslateFn) => {
  return z.object({
    // Documents de convention (au moins un requis)
    conventionDocuments: z
      .array(fileValueSchema)
      .default([])
      .refine((files) => files.length > 0, {
        message: t("convention:form.step3.validation.contractRequired"),
      }),
    // Documents complémentaires optionnels
    complementDocuments: z.array(fileValueSchema).optional(),
  });
};

export type EditDocumentsData = z.infer<ReturnType<typeof createEditDocumentsSchema>>;
