import type { TranslateFn } from "@/i18n/types";
import type { IFileValue } from "@/types/type";
import { z } from "zod";

// ===== STEP 1: INFORMATIONS TRANSFORMATEUR =====
export const createStep1TransformerInfoSchema = (t: TranslateFn) => {
  return z.object({
    // Informations de base
    familyName: z
      .string()
      .min(2, t("actor:transformer.validation.familyNameRequired")),
    givenName: z
      .string()
      .min(2, t("actor:transformer.validation.givenNameRequired")),

    // Identifiants (optionnels)
    onccId: z.string().optional(),
    identifiantId: z.string().optional(),

    // Localisation (uniquement dans un bassin de production)
    locationCode: z
      .string()
      .min(1, t("actor:transformer.validation.locationCodeRequired")),

    // Métadonnées (date de création, siège social) - Tous optionnels
    metadata: z.object({
      creationDate: z.string().optional(),
      headquarters: z.string().optional(),
    }),

    // Déclaration d'existence
    hasExistenceDeclaration: z.boolean(),
    existenceDeclarationDate: z.string().optional(),
    existenceDeclarationCode: z.string().optional(),
    existenceDeclarationYears: z.enum(["2", "5"]).optional(),
  });
};

export type Step1TransformerInfoData = z.infer<
  ReturnType<typeof createStep1TransformerInfoSchema>
>;

// Validation conditionnelle: si hasExistenceDeclaration est true, les champs deviennent obligatoires
export const createStep1TransformerInfoSchemaWithConditional = (
  t: TranslateFn
) => {
  return createStep1TransformerInfoSchema(t)
    .refine(
      (data) => {
        if (data.hasExistenceDeclaration) {
          return !!data.existenceDeclarationDate;
        }
        return true;
      },
      {
        message: t(
          "actor:transformer.validation.existenceDeclarationDateRequired"
        ),
        path: ["existenceDeclarationDate"],
      }
    )
    .refine(
      (data) => {
        if (data.hasExistenceDeclaration) {
          return !!data.existenceDeclarationCode;
        }
        return true;
      },
      {
        message: t(
          "actor:transformer.validation.existenceDeclarationCodeRequired"
        ),
        path: ["existenceDeclarationCode"],
      }
    )
    .refine(
      (data) => {
        if (data.hasExistenceDeclaration) {
          return !!data.existenceDeclarationYears;
        }
        return true;
      },
      {
        message: t(
          "actor:transformer.validation.existenceDeclarationYearsRequired"
        ),
        path: ["existenceDeclarationYears"],
      }
    );
};

// ===== STEP 2: MANAGER INFO =====
export const createStep2ManagerInfoSchema = (t: TranslateFn) => {
  return z.object({
    managerFamilyName: z
      .string()
      .min(2, t("actor:transformer.validation.managerLastNameRequired")),
    managerGivenName: z
      .string()
      .min(2, t("actor:transformer.validation.managerFirstNameRequired")),
    managerPhone: z.string().optional(),
    managerEmail: z
      .string()
      .email(t("common:validation.emailInvalid"))
      .min(1, t("actor:transformer.validation.managerEmailRequired")),
  });
};

export type Step2ManagerInfoData = z.infer<
  ReturnType<typeof createStep2ManagerInfoSchema>
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

// ===== STEP 3: DOCUMENTS =====
export const createStep3DocumentsSchema = (t: TranslateFn) => {
  return z.object({
    documents: z
      .array(
        z.object({
          base64Data: z.string(),
          mimeType: z.string(),
          fileName: z.string(),
          documentType: z.string(),
        })
      )
      .min(1, t("actor:transformer.validation.documentsRequired")),
  });
};

// Fonction pour créer un schéma avec validation des documents transformateurs obligatoires
export const createStep3DocumentsSchemaWithValidation = (
  t: TranslateFn,
  requiredTransformerDocs: { value: string; label: string }[]
) => {
  return z.object({
    documents: z
      .array(fileValueSchema)
      .refine(
        (files) => validateAllDocumentTypesProvided(files, requiredTransformerDocs),
        {
          message: t("actor:transformer.validation.allDocumentsRequired"),
        }
      ),
    // Documents complémentaires (optionnels)
    complementaryDocuments: z.array(fileValueSchema).optional(),
  });
};

export type Step3DocumentsData = z.infer<
  ReturnType<typeof createStep3DocumentsSchemaWithValidation>
>;

// ===== STEP 4: SUMMARY =====
export const createStep4SummarySchema = (t: TranslateFn) => {
  return z.object({
    confirmed: z
      .boolean()
      .refine((val) => val === true, {
        message: t("actor:transformer.validation.confirmationRequired"),
      }),
  });
};

export type Step4SummaryData = z.infer<
  ReturnType<typeof createStep4SummarySchema>
>;

// ===== SCHÉMA COMPLET POUR LA SOUMISSION =====
export const createTransformerCompleteSchema = (t: TranslateFn) => {
  return z.object({
    step1: createStep1TransformerInfoSchemaWithConditional(t),
    step2: createStep2ManagerInfoSchema(t),
    step3: createStep3DocumentsSchema(t),
    step4: createStep4SummarySchema(t),
  });
};

export type TransformerCompleteData = z.infer<
  ReturnType<typeof createTransformerCompleteSchema>
>;

// ===== SCHÉMA POUR L'ÉDITION D'UN TRANSFORMATEUR EXISTANT =====
export const createTransformerEditSchema = (t: TranslateFn) => {
  // Créer le schéma de base avec les informations transformateur + manager
  const baseSchema = z.object({
    // Informations de base
    familyName: z
      .string()
      .min(2, t("actor:transformer.validation.familyNameRequired")),
    givenName: z
      .string()
      .min(2, t("actor:transformer.validation.givenNameRequired")),

    // Identifiants
    onccId: z.string().optional(),
    identifiantId: z.string().optional(),

    // Localisation
    locationCode: z.string().min(1, t("common:validation.locationRequired")),

    // Métadonnées
    metadata: z
      .object({
        creationDate: z.string().optional(),
        headquarters: z.string().optional(),
      })
      .optional(),

    // Déclaration d'existence
    hasExistenceDeclaration: z.boolean(),
    existenceDeclarationDate: z.string().optional(),
    existenceDeclarationCode: z.string().optional(),
    existenceDeclarationYears: z.enum(["2", "5"]).optional(),
  });

  // Appliquer les validations conditionnelles
  return baseSchema
    .refine(
      (data) => {
        if (data.hasExistenceDeclaration) {
          return !!data.existenceDeclarationDate;
        }
        return true;
      },
      {
        message: t(
          "actor:transformer.validation.existenceDeclarationDateRequired"
        ),
        path: ["existenceDeclarationDate"],
      }
    )
    .refine(
      (data) => {
        if (data.hasExistenceDeclaration) {
          return !!data.existenceDeclarationCode;
        }
        return true;
      },
      {
        message: t(
          "actor:transformer.validation.existenceDeclarationCodeRequired"
        ),
        path: ["existenceDeclarationCode"],
      }
    )
    .refine(
      (data) => {
        if (data.hasExistenceDeclaration) {
          return !!data.existenceDeclarationYears;
        }
        return true;
      },
      {
        message: t(
          "actor:transformer.validation.existenceDeclarationYearsRequired"
        ),
        path: ["existenceDeclarationYears"],
      }
    );
};

export type TransformerEditData = z.infer<ReturnType<typeof createTransformerEditSchema>>;
