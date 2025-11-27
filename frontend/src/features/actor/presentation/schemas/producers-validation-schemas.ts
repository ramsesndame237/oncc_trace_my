import type { TranslateFn } from "@/i18n/types";
import { z } from "zod";

// ===== STEP 1: INFORMATIONS OPA =====
export const createStep1OPAInfoSchema = (t: TranslateFn) => {
  return z.object({
    // Informations de base
    familyName: z
      .string()
      .min(2, t("actor:producers.validation.familyNameRequired")),
    givenName: z
      .string()
      .min(2, t("actor:producers.validation.givenNameRequired")),

    // Identifiants
    onccId: z.string().optional(),
    identifiantId: z.string().optional(),

    // Localisation
    locationCode: z.string().min(1, t("common:validation.locationRequired")),

    // Métadonnées (siège social, date de création, référence COBGET)
    metadata: z
      .object({
        headquartersAddress: z.string().optional(),
        creationDate: z.string().optional(),
        cobgetReference: z.string().optional(),
      })
      .optional(),

    // Déclaration d'existence
    hasExistenceDeclaration: z.boolean(),
    existenceDeclarationDate: z.string().optional(),
    existenceDeclarationCode: z.string().optional(),
    existenceDeclarationYears: z.enum(["2", "5"]).optional(),
  });
};

export type Step1OPAInfoData = z.infer<
  ReturnType<typeof createStep1OPAInfoSchema>
>;

// Validation conditionnelle: si hasExistenceDeclaration est true, les champs deviennent obligatoires
export const createStep1OPAInfoSchemaWithConditional = (t: TranslateFn) => {
  return createStep1OPAInfoSchema(t)
    .refine(
      (data) => {
        if (data.hasExistenceDeclaration) {
          return !!data.existenceDeclarationDate;
        }
        return true;
      },
      {
        message: t(
          "actor:producers.validation.existenceDeclarationDateRequired"
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
          "actor:producers.validation.existenceDeclarationCodeRequired"
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
          "actor:producers.validation.existenceDeclarationYearsRequired"
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
      .min(2, t("actor:producers.validation.managerLastNameRequired")),
    prenom: z
      .string()
      .min(2, t("actor:producers.validation.managerFirstNameRequired")),
    phone: z.string().optional(),
    email: z
      .string()
      .min(1, t("common:validation.emailRequired"))
      .email(t("common:validation.emailInvalid")),
  });
};

export type Step2ManagerInfoData = z.infer<
  ReturnType<typeof createStep2ManagerInfoSchema>
>;

// ===== SCHEMA COMBINÉ POUR L'ÉDITION OPA =====
export const createOPAEditSchema = (t: TranslateFn) => {
  // Créer le schéma de base avec les informations OPA + manager
  const baseSchema = z.object({
    // Informations de base
    familyName: z
      .string()
      .min(2, t("actor:producers.validation.familyNameRequired")),
    givenName: z
      .string()
      .min(2, t("actor:producers.validation.givenNameRequired")),

    // Identifiants
    onccId: z.string().optional(),
    identifiantId: z.string().optional(),

    // Localisation
    locationCode: z.string().min(1, t("common:validation.locationRequired")),

    // Métadonnées
    metadata: z
      .object({
        headquartersAddress: z.string().optional(),
        creationDate: z.string().optional(),
        cobgetReference: z.string().optional(),
      })
      .optional(),

    // Déclaration d'existence
    hasExistenceDeclaration: z.boolean(),
    existenceDeclarationDate: z.string().optional(),
    existenceDeclarationCode: z.string().optional(),
    existenceDeclarationYears: z.enum(["2", "5"]).optional(),

    // Informations du manager
    managerInfo: z
      .object({
        nom: z.string().optional(),
        prenom: z.string().optional(),
        phone: z.string().optional(),
        email: z
          .string()
          .optional()
          .refine(
            (val) => {
              if (!val || val === "") return true;
              return z.string().email().safeParse(val).success;
            },
            {
              message: t("common:validation.emailInvalid"),
            }
          ),
      })
      .optional(),
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
          "actor:producers.validation.existenceDeclarationDateRequired"
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
          "actor:producers.validation.existenceDeclarationCodeRequired"
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
          "actor:producers.validation.existenceDeclarationYearsRequired"
        ),
        path: ["existenceDeclarationYears"],
      }
    );
};

export type OPAEditData = z.infer<ReturnType<typeof createOPAEditSchema>>;

// Schema pour IFileValue (structure de fichier uploadé)
import { IFileValue } from "@/types/type";
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

// ===== STEP 3: MEMBERS =====
export const createStep3MembersSchema = () => {
  return z.object({
    selectedProducerIds: z.array(z.string()).default([]),
  });
};

export type Step3MembersData = z.infer<
  ReturnType<typeof createStep3MembersSchema>
>;

// ===== STEP 4: DOCUMENTS =====
export const createStep4DocumentsSchema = () => {
  return z.object({
    // Documents OPA obligatoires
    opaDocuments: z.array(fileValueSchema).default([]),
    // Preuves foncières optionnelles
    landProofDocuments: z.array(fileValueSchema).optional(),
    // Documents complémentaires optionnels
    complementaryDocuments: z.array(fileValueSchema).optional(),
  });
};

// Fonction pour créer un schéma avec validation des documents OPA obligatoires
export const createStep4DocumentsSchemaWithValidation = (
  t: TranslateFn,
  requiredOPADocs: { value: string; label: string }[]
) => {
  return z.object({
    opaDocuments: z
      .array(fileValueSchema)
      .refine(
        (files) => validateAllDocumentTypesProvided(files, requiredOPADocs),
        {
          message: t("actor:opa.validation.allDocumentsRequired"),
        }
      ),
    landProofDocuments: z.array(fileValueSchema).optional(),
    complementaryDocuments: z.array(fileValueSchema).optional(),
  });
};

export type Step4DocumentsData = z.infer<
  ReturnType<typeof createStep4DocumentsSchema>
>;

// ===== STEP 5: SUMMARY =====
export const createStep5SummarySchema = (t: TranslateFn) => {
  return z.object({
    confirmed: z.boolean().refine((val) => val === true, {
      message: t("actor:opa.validation.confirmationRequired"),
    }),
  });
};

export type Step5SummaryData = z.infer<
  ReturnType<typeof createStep5SummarySchema>
>;

// ===== SCHEMA COMPLET =====
export const createOPAFormCompleteSchema = (t: TranslateFn) => {
  return z.object({
    step1: createStep1OPAInfoSchemaWithConditional(t),
    step2: createStep2ManagerInfoSchema(t),
    step3: createStep3MembersSchema(),
    step4: createStep4DocumentsSchema(),
    step5: createStep5SummarySchema(t),
  });
};

export type OPAFormCompleteData = z.infer<
  ReturnType<typeof createOPAFormCompleteSchema>
>;
