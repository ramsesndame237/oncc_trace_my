import type { TranslateFn } from "@/i18n/types";
import { IFileValue } from "@/types/type";
import { z } from "zod";

// Regex pour validation email stricte côté frontend
const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

// ===== STEP 1: INFORMATIONS ACHETEUR =====
export const createStep1BuyerInfoSchema = (t: TranslateFn) => {
  return z.object({
    // Informations de base
    familyName: z
      .string()
      .min(2, t("actor:buyer.validation.familyNameRequired")),
    givenName: z.string().min(2, t("actor:buyer.validation.givenNameRequired")),

    // Email obligatoire pour les acheteurs
    email: z
      .string()
      .min(1, t("common:validation.emailRequired"))
      .regex(EMAIL_REGEX, t("common:validation.emailInvalid")),

    // Téléphone
    phone: z.string().optional(),

    // Localisation (uniquement dans un bassin de production)
    locationCode: z.string().min(1, t("common:validation.locationRequired")),

    // Identifiants
    onccId: z.string().optional(),
    identifiantId: z.string().optional(),

    // Métadonnées spécifiques aux acheteurs
    gender: z.enum(["M", "F"], {
      errorMap: () => ({
        message: t("common:validation.genderRequired"),
      }),
    }),
    companyName: z
      .string()
      .min(1, t("actor:buyer.validation.companyNameRequired")),
    cniNumber: z.string().optional(),
    professionalCardNumber: z.string().optional(),
  });
};

export type Step1BuyerInfoData = z.infer<
  ReturnType<typeof createStep1BuyerInfoSchema>
>;

// Schema pour IFileValue (structure de fichier uploadé)
const fileValueSchema: z.ZodType<IFileValue> = z.object({
  optionValues: z.array(z.any()), // [extraValue, documentType]
  type: z.string(), // Type MIME du fichier
  data: z.union([z.string(), z.instanceof(Blob)]), // ⭐ Peut être base64 (string) OU Blob
  fileSize: z.number(), // Taille du fichier en bytes
});

// Fonction d'aide pour valider que tous les types de documents requis sont fournis
const validateAllDocumentTypesProvided = (
  files: IFileValue[],
  requiredOptions: { value: string; label: string }[]
) => {
  const providedTypes = files.map((file) => file.optionValues[1]);
  const requiredTypes = requiredOptions.map((option) => option.value);

  return requiredTypes.every((requiredType) =>
    providedTypes.includes(requiredType)
  );
};

// ===== STEP 2: DOCUMENTS ACHETEUR =====
export const createStep2DocumentsSchema = () => {
  return z.object({
    // Documents acheteur obligatoires (RCCM, Attestation de conformité, Agrément)
    buyerDocuments: z.array(fileValueSchema).default([]),
    // Autres documents (landProof)
    landProofDocuments: z.array(fileValueSchema).optional(),
    // Documents complémentaires optionnels
    complementaryDocuments: z.array(fileValueSchema).optional(),
  });
};

// Fonction pour créer un schéma avec validation des documents acheteur obligatoires
export const createStep2DocumentsSchemaWithValidation = (
  t: TranslateFn,
  requiredBuyerDocs: { value: string; label: string }[]
) => {
  return z.object({
    buyerDocuments: z
      .array(fileValueSchema)
      .refine(
        (files) => validateAllDocumentTypesProvided(files, requiredBuyerDocs),
        {
          message: t("actor:buyer.validation.allDocumentsRequired"),
        }
      ),
    landProofDocuments: z.array(fileValueSchema).optional(),
    complementaryDocuments: z.array(fileValueSchema).optional(),
  });
};

export type Step2DocumentsData = z.infer<
  ReturnType<typeof createStep2DocumentsSchema>
>;

// ===== STEP 3: SUMMARY =====
export const createStep3SummarySchema = (t: TranslateFn) => {
  return z.object({
    confirmed: z.boolean().refine((val) => val === true, {
      message: t("actor:buyer.validation.confirmationRequired"),
    }),
  });
};

export type Step3SummaryData = z.infer<
  ReturnType<typeof createStep3SummarySchema>
>;

// ===== SCHEMA COMPLET =====
export const createBuyerFormCompleteSchema = (t: TranslateFn) => {
  return z.object({
    step1: createStep1BuyerInfoSchema(t),
    step2: createStep2DocumentsSchema(),
    step3: createStep3SummarySchema(t),
  });
};

export type BuyerFormCompleteData = z.infer<
  ReturnType<typeof createBuyerFormCompleteSchema>
>;

// ===== SCHEMA POUR L'ÉDITION ACHETEUR =====
export const createBuyerEditSchema = (t: TranslateFn) => {
  return z.object({
    // Informations de base
    familyName: z
      .string()
      .min(2, t("actor:buyer.validation.familyNameRequired")),
    givenName: z.string().min(2, t("actor:buyer.validation.givenNameRequired")),

    // Email obligatoire
    email: z
      .string()
      .min(1, t("common:validation.emailRequired"))
      .regex(EMAIL_REGEX, t("common:validation.emailInvalid")),

    // Téléphone
    phone: z.string().optional(),

    // Localisation
    locationCode: z.string().min(1, t("common:validation.locationRequired")),

    // Identifiants
    onccId: z.string().optional(),
    identifiantId: z.string().optional(),

    // Métadonnées (champs plats pour le formulaire)
    gender: z.string().optional(),
    companyName: z.string().optional(),
    cniNumber: z.string().optional(),
    professionalCardNumber: z.string().optional(),
  });
};

export type BuyerEditData = z.infer<ReturnType<typeof createBuyerEditSchema>>;
