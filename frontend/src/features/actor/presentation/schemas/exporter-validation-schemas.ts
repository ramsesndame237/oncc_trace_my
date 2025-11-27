import type { TranslateFn } from "@/i18n/types";
import type { IFileValue } from "@/types/type";
import { z } from "zod";

// ===== STEP 1: INFORMATIONS EXPORTATEUR =====
export const createStep1ExporterInfoSchema = (t: TranslateFn) => {
  return z.object({
    // Informations de base
    familyName: z
      .string()
      .min(2, t("actor:exporter.validation.familyNameRequired")),
    givenName: z
      .string()
      .min(2, t("actor:exporter.validation.givenNameRequired")),

    // Identifiants (optionnels)
    onccId: z.string().optional(),
    identifiantId: z.string().optional(),

    // Localisation (uniquement dans un bassin de production)
    locationCode: z
      .string()
      .min(1, t("actor:exporter.validation.locationCodeRequired")),

    // Métadonnées (numéro professionnel, RCCM, code exportateur) - Tous optionnels
    metadata: z.object({
      professionalNumber: z.string().optional(),
      rccmNumber: z.string().optional(),
      exporterCode: z.string().optional(),
    }),

    // Déclaration d'existence
    hasExistenceDeclaration: z.boolean(),
    existenceDeclarationDate: z.string().optional(),
    existenceDeclarationCode: z.string().optional(),
    existenceDeclarationYears: z.enum(["2", "5"]).optional(),
  });
};

export type Step1ExporterInfoData = z.infer<
  ReturnType<typeof createStep1ExporterInfoSchema>
>;

// Validation conditionnelle: si hasExistenceDeclaration est true, les champs deviennent obligatoires
export const createStep1ExporterInfoSchemaWithConditional = (
  t: TranslateFn
) => {
  return createStep1ExporterInfoSchema(t)
    .refine(
      (data) => {
        if (data.hasExistenceDeclaration) {
          return !!data.existenceDeclarationDate;
        }
        return true;
      },
      {
        message: t(
          "actor:exporter.validation.existenceDeclarationDateRequired"
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
          "actor:exporter.validation.existenceDeclarationCodeRequired"
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
          "actor:exporter.validation.existenceDeclarationYearsRequired"
        ),
        path: ["existenceDeclarationYears"],
      }
    );
};

// ===== STEP 2: MANAGER INFO =====
export const createStep2ManagerInfoSchema = (t: TranslateFn) => {
  return z.object({
    nom: z
      .string()
      .min(2, t("actor:exporter.validation.managerLastNameRequired")),
    prenom: z
      .string()
      .min(2, t("actor:exporter.validation.managerFirstNameRequired")),
    phone: z.string().optional(),
    email: z
      .string()
      .email(t("common:validation.emailInvalid"))
      .min(1, t("actor:exporter.validation.managerEmailRequired")),
  });
};

export type Step2ManagerInfoData = z.infer<
  ReturnType<typeof createStep2ManagerInfoSchema>
>;

// ===== STEP 3: BUYERS (ACHETEURS) =====
export const createStep3BuyersSchema = () => {
  return z.object({
    selectedBuyerIds: z.array(z.string()).optional(), // Optionnel: un exportateur peut ne pas avoir d'acheteurs lors de la création
  });
};

export type Step3BuyersData = z.infer<
  ReturnType<typeof createStep3BuyersSchema>
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

// ===== STEP 4: DOCUMENTS (renommé de step3) =====
export const createStep4DocumentsSchema = (t: TranslateFn) => {
  return z.object({
    exporterDocuments: z
      .array(
        z.object({
          base64Data: z.string(),
          mimeType: z.string(),
          fileName: z.string(),
          documentType: z.string(),
        })
      )
      .min(3, t("actor:exporter.validation.allDocumentsRequired")),
  });
};

// Fonction pour créer un schéma avec validation des documents exportateurs obligatoires
export const createStep4DocumentsSchemaWithValidation = (
  t: TranslateFn,
  requiredExporterDocs: { value: string; label: string }[]
) => {
  return z.object({
    exporterDocuments: z
      .array(fileValueSchema)
      .refine(
        (files) => validateAllDocumentTypesProvided(files, requiredExporterDocs),
        {
          message: t("actor:exporter.validation.allDocumentsRequired"),
        }
      ),
  });
};

export type Step4DocumentsData = z.infer<
  ReturnType<typeof createStep4DocumentsSchemaWithValidation>
>;

// ===== STEP 5: SUMMARY (renommé de step4) =====
export const createStep5SummarySchema = (t: TranslateFn) => {
  return z.object({
    confirmed: z
      .boolean()
      .refine((val) => val === true, {
        message: t("actor:exporter.validation.confirmationRequired"),
      }),
  });
};

export type Step5SummaryData = z.infer<
  ReturnType<typeof createStep5SummarySchema>
>;

// ===== SCHÉMA COMPLET POUR LA SOUMISSION =====
export const createExporterCompleteSchema = (t: TranslateFn) => {
  return z.object({
    step1: createStep1ExporterInfoSchemaWithConditional(t),
    step2: createStep2ManagerInfoSchema(t),
    step3: createStep3BuyersSchema(t),
    step4: createStep4DocumentsSchema(t),
    step5: createStep5SummarySchema(t),
  });
};

export type ExporterCompleteData = z.infer<
  ReturnType<typeof createExporterCompleteSchema>
>;

// ===== SCHÉMA POUR L'ÉDITION D'UN EXPORTATEUR EXISTANT =====
export const createExporterEditSchema = (t: TranslateFn) => {
  // Créer le schéma de base avec les informations exportateur + manager
  const baseSchema = z.object({
    // Informations de base
    familyName: z
      .string()
      .min(2, t("actor:exporter.validation.familyNameRequired")),
    givenName: z
      .string()
      .min(2, t("actor:exporter.validation.givenNameRequired")),

    // Identifiants
    onccId: z.string().optional(),
    identifiantId: z.string().optional(),

    // Localisation
    locationCode: z.string().min(1, t("common:validation.locationRequired")),

    // Métadonnées
    metadata: z
      .object({
        professionalNumber: z.string().optional(),
        rccmNumber: z.string().optional(),
        exporterCode: z.string().optional(),
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
          "actor:exporter.validation.existenceDeclarationDateRequired"
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
          "actor:exporter.validation.existenceDeclarationCodeRequired"
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
          "actor:exporter.validation.existenceDeclarationYearsRequired"
        ),
        path: ["existenceDeclarationYears"],
      }
    );
};

export type ExporterEditData = z.infer<ReturnType<typeof createExporterEditSchema>>;
