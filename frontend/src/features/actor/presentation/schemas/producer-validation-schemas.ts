import { ACTOR_TYPES } from "@/core/domain/actor.types";
import type { TranslateFn } from "@/i18n/types";
import { IFileValue } from "@/types/type";
import { z } from "zod";

export const createActorSearchSchema = () => {
  return z.object({
    search: z.string().optional(),
    actorType: z
      .enum(Object.values(ACTOR_TYPES) as [string, ...string[]])
      .optional(),
    status: z.enum(["active", "inactive", "pending"]).optional(),
    locationCode: z.string().optional(),
    page: z.number().min(1).optional(),
    per_page: z.number().min(1).max(100).optional(),
  });
};

// Regex pour validation email stricte côté frontend
const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

// Schéma pour les informations du manager
const createManagerInfoSchema = (t: TranslateFn) => {
  return z
    .object({
      familyName: z.string(),
      givenName: z.string(),
      phone: z.string().optional(),
      email: z
        .string()
        .regex(EMAIL_REGEX, t("common:validation.emailInvalid")),
    })
    .optional();
};

// Base schema without refinement for partial reuse
const createBaseActorSchema = (t: TranslateFn) => {
  return z.object({
    actorType: z.enum(Object.values(ACTOR_TYPES) as [string, ...string[]]),
    familyName: z
      .string()
      .min(1, t("common:validation.familyNameRequired")),
    givenName: z
      .string()
      .min(1, t("common:validation.givenNameRequired")),
    phone: z.string().optional(),
    email: z
      .string()
      .regex(EMAIL_REGEX, t("common:validation.emailInvalid"))
      .optional(),
    onccId: z.string().optional(),
    identifiantId: z.string().optional(),
    locationCode: z.string().optional(),
    status: z.enum(["active", "inactive", "pending"]).optional(),
    managerInfo: createManagerInfoSchema(t),
    metadata: z.record(z.any()).optional(),
  });
};

// Create actor schema with conditional validation
export const createActorSchema = (t: TranslateFn) => {
  return z
    .object({
      actorType: z.enum(Object.values(ACTOR_TYPES) as [string, ...string[]]),
      familyName: z
        .string()
        .min(1, t("common:validation.familyNameRequired")),
      givenName: z
        .string()
        .min(1, t("common:validation.givenNameRequired")),
      phone: z.string().optional(),
      email: z
        .string()
        .regex(EMAIL_REGEX, t("common:validation.emailInvalid"))
        .optional(),
      onccId: z.string().optional(),
      identifiantId: z.string().optional(),
      locationCode: z.string().optional(),
      status: z.enum(["active", "inactive", "pending"]).optional(),
      managerInfo: createManagerInfoSchema(t),
      metadata: z.record(z.any()).optional(),
    })
    .refine(
      (data) => {
        // Validation conditionnelle: managerInfo requis pour tous les types sauf PRODUCER
        if (data.actorType !== "PRODUCER") {
          return (
            data.managerInfo &&
            data.managerInfo.familyName &&
            data.managerInfo.givenName
          );
        }
        return true;
      },
      {
        message: t("actor:producer.validation.managerInfoRequired"),
        path: ["managerInfo"],
      }
    );
};

// Update actor schema as partial of base schema with conditional validation
export const createUpdateActorSchema = (t: TranslateFn) => {
  return createBaseActorSchema(t)
    .partial()
    .refine(
      (data) => {
        // Validation conditionnelle: managerInfo requis pour tous les types sauf PRODUCER
        // Seulement si le type d'acteur est défini
        if (data.actorType && data.actorType !== "PRODUCER") {
          return (
            data.managerInfo &&
            data.managerInfo.familyName &&
            data.managerInfo.givenName
          );
        }
        return true;
      },
      {
        message: t("actor:producer.validation.managerInfoRequired"),
        path: ["managerInfo"],
      }
    );
};

// Regex pour numéro de CNI camerounais
const CNI_REGEX = /^[0-9]{8}[A-Z]$/;

// Regex pour code ONCC (optionnel - peut être utilisé plus tard pour validation stricte)
// const ONCC_CODE_REGEX = /^[A-Z0-9]{6,10}$/;

// Schema pour les informations du gérant (version complète) - utilisé uniquement pour l'inférence de type
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const completeManagerInfoSchema = z.object({
  nom: z.string().min(1, "Le nom du gérant est requis"),
  prenom: z.string().min(1, "Le prénom du gérant est requis"),
  email: z
    .string()
    .min(1, "L'email du gérant est requis")
    .regex(EMAIL_REGEX, "Format d'email invalide"),
  phone: z.string().min(1, "Le téléphone du gérant est requis"),
});

// Schema pour les métadonnées du producteur - utilisé uniquement pour l'inférence de type
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const producerMetadataSchema = z.object({
  gender: z.enum(["M", "F"], {
    errorMap: () => ({ message: "Le genre est requis" }),
  }),
  birthDate: z.string().min(1, "La date de naissance est requise"),
  birthPlace: z.string().min(1, "Le lieu de naissance est requis"),
  cniNumber: z
    .string()
    .min(1, "Le numéro de CNI est requis")
    .regex(CNI_REGEX, "Format de CNI invalide (ex: 12345678A)"),
  sustainabilityProgram: z.boolean().default(false),
});

// Schema pour l'étape 1: Informations de l'acteur producteur
export const createStep1ProducerInfoSchema = (t: TranslateFn) => {
  return z.object({
    familyName: z
      .string()
      .min(1, t("common:validation.familyNameRequired")),
    givenName: z
      .string()
      .min(1, t("common:validation.givenNameRequired")),
    email: z
      .string()
      .regex(EMAIL_REGEX, t("common:validation.emailInvalid"))
      .optional()
      .or(z.literal("")),
    phone: z.string().min(1, t("common:validation.phoneRequired")),
    locationCode: z
      .string()
      .min(1, t("common:validation.locationRequired")),
    onccId: z.string().optional(),
    identifiantId: z.string().optional(),
    // Métadonnées spécifiques au producteur
    gender: z.enum(["M", "F"], {
      errorMap: () => ({
        message: t("common:validation.genderRequired"),
      }),
    }),
    birthDate: z
      .string()
      .min(1, t("common:validation.birthDateRequired")),
    birthPlace: z
      .string()
      .min(1, t("common:validation.birthPlaceRequired")),
    cniNumber: z.string().optional(),
    sustainabilityProgram: z.boolean().default(false),
  });
};

// Schema pour une coordonnée GPS
const createCoordinateSchema = (t: TranslateFn) => {
  return z.object({
    latitude: z.coerce
      .number({
        required_error: t("common:validation.latitudeRequired"),
        invalid_type_error: t("common:validation.latitudeInvalidType"),
      })
      .min(-90, t("common:validation.latitudeRange"))
      .max(90, t("common:validation.latitudeRange")),
    longitude: z.coerce
      .number({
        required_error: t("common:validation.longitudeRequired"),
        invalid_type_error: t("common:validation.longitudeInvalidType"),
      })
      .min(-180, t("common:validation.longitudeRange"))
      .max(180, t("common:validation.longitudeRange")),
  });
};

// Schema pour une parcelle
const createParcelSchema = (t: TranslateFn) => {
  return z
    .object({
      // Localisation (utilise un seul champ comme dans le reste de l'app)
      locationCode: z
        .string()
        .min(1, t("actor:producer.validation.parcelLocationRequired")),

      // Type de parcelle
      parcelType: z
        .string()
        .min(1, t("actor:producer.validation.parcelTypeRequired")),

      // Superficie en m² (correspond à surfaceArea dans le backend)
      surfaceArea: z.coerce
        .number()
        .min(1, t("actor:producer.validation.parcelSurfaceRequired")),

      // Date de création de la parcelle (optionnel)
      parcelCreationDate: z.string().optional(),

      // Code d'identification unique de parcelle (optionnel)
      identificationId: z.string().optional(),

      // Code d'identification ONCC
      onccId: z.string().optional(),

      // Indicateur si les coordonnées GPS sont disponibles
      hasCoordinates: z.boolean().default(false),

      // Coordonnées GPS (optionnelles maintenant)
      coordinates: z.array(createCoordinateSchema(t)).default([]),
    })
    .refine(
      (data) => {
        // Si hasCoordinates est true, il faut au moins une coordonnée
        if (data.hasCoordinates) {
          return data.coordinates && data.coordinates.length >= 1;
        }
        return true;
      },
      {
        message: t("common:validation.coordinatesRequired"),
        path: ["coordinates"],
      }
    )
    .refine(
      (data) => {
        // Si hasCoordinates est true, toutes les coordonnées doivent être valides (latitude ET longitude non nulles)
        if (
          data.hasCoordinates &&
          data.coordinates &&
          data.coordinates.length > 0
        ) {
          return data.coordinates.every(
            (coord) => coord.latitude !== 0 && coord.longitude !== 0
          );
        }
        return true;
      },
      {
        message: t("common:validation.coordinatesInvalid"),
        path: ["coordinates"],
      }
    )
    .refine(
      (data) => {
        // Si hasCoordinates est true ET superficie >= 4000 m², il faut au moins 3 coordonnées
        if (data.hasCoordinates) {
          const area = data.surfaceArea;
          if (!isNaN(area) && area >= 4000) {
            return data.coordinates && data.coordinates.length >= 3;
          }
        }
        return true;
      },
      {
        message: t("actor:producer.validation.coordinatesMinThree"),
        path: ["coordinates"],
      }
    );
};

// Schema pour l'étape 2: Informations des parcelles
export const createStep2ParcelInfoSchema = (t: TranslateFn) => {
  return z.object({
    parcels: z
      .array(createParcelSchema(t))
      .min(1, t("actor:producer.validation.atLeastOneParcel")),
  });
};

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

// Schema pour l'étape 3: Documents
export const createStep3DocumentsSchema = () => {
  return z.object({
    producerDocuments: z.array(fileValueSchema), // Documents du producteur
    landProofDocuments: z.array(fileValueSchema).optional(), // Preuves foncières
    complementaryDocuments: z.array(fileValueSchema).optional(), // Documents complémentaires
  });
};

// Fonction pour créer un schéma avec validation des documents obligatoires
export const createStep3DocumentsSchemaWithValidation = (
  t: TranslateFn,
  requiredProducerDocs: { value: string; label: string }[]
) => {
  return z.object({
    producerDocuments: z
      .array(fileValueSchema)
      .refine(
        (files) =>
          validateAllDocumentTypesProvided(files, requiredProducerDocs),
        {
          message: t("actor:producer.validation.allDocumentsRequired"),
        }
      ),
    landProofDocuments: z.array(fileValueSchema).optional(),
    complementaryDocuments: z.array(fileValueSchema).optional(),
  });
};

// Schema pour l'étape 4: Récapitulatif (validation finale)
export const createStep4SummarySchema = (t: TranslateFn) => {
  return z.object({
    confirmed: z.boolean().refine((val) => val === true, {
      message: t("actor:producer.validation.confirmationRequired"),
    }),
  });
};

export type ActorSearchFormData = z.infer<
  ReturnType<typeof createActorSearchSchema>
>;
export type CreateActorFormData = z.infer<ReturnType<typeof createActorSchema>>;
export type UpdateActorFormData = z.infer<
  ReturnType<typeof createUpdateActorSchema>
>;

// Types pour le formulaire multi-pages du producteur
export type Step1ProducerInfoData = z.infer<
  ReturnType<typeof createStep1ProducerInfoSchema>
>;
export type Step2ParcelInfoData = z.infer<
  ReturnType<typeof createStep2ParcelInfoSchema>
>;
export type Step2ParcelInfoInputData = z.input<
  ReturnType<typeof createStep2ParcelInfoSchema>
>;
export type Step3DocumentsData = z.infer<
  ReturnType<typeof createStep3DocumentsSchema>
>;
export type Step4SummaryData = z.infer<
  ReturnType<typeof createStep4SummarySchema>
>;

// Types pour les métadonnées et gérant
export type ProducerMetadata = z.infer<typeof producerMetadataSchema>;
export type CompleteManagerInfo = z.infer<typeof completeManagerInfoSchema>;

// Types pour les parcelles
export type CoordinateData = z.infer<ReturnType<typeof createCoordinateSchema>>;
export type ParcelData = z.infer<ReturnType<typeof createParcelSchema>>;
