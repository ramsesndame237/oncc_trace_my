import type { TranslateFn } from "@/i18n/types";
import { IFileValue } from "@/types/type";
import { z } from "zod";
import {
  TRANSACTION_LOCATION_TYPES,
  type TransactionLocationType,
} from "../../domain/Transaction";

const TRANSACTION_LOCATION_TYPES_ENUM = [...TRANSACTION_LOCATION_TYPES] as [
  TransactionLocationType,
  ...TransactionLocationType[]
];

// Schema pour IFileValue (structure de fichier uploadé)
const fileValueSchema: z.ZodType<IFileValue> = z.object({
  optionValues: z.array(z.any()), // [extraValue, documentType]
  type: z.string(), // Type MIME du fichier
  data: z.union([z.string(), z.instanceof(Blob)]), // Peut être base64 (string) OU Blob
  fileSize: z.number(), // Taille du fichier en bytes
});

// Schema pour l'étape 1: Informations générales
export const createStep1GeneralInfoSchema = (t: TranslateFn) => {
  return z
    .object({
      locationType: z.enum(TRANSACTION_LOCATION_TYPES_ENUM, {
        errorMap: () => ({
          message: t("transaction:saleAdd.validation.locationTypeRequired"),
        }),
      }),
      sellerId: z
        .string()
        .min(1, t("transaction:saleAdd.validation.sellerRequired")),
      buyerId: z
        .string()
        .min(1, t("transaction:saleAdd.validation.buyerRequired")),
      principalExporterId: z.string().optional().or(z.literal("")),
      calendarId: z.string().optional().or(z.literal("")),
      conventionId: z.string().optional().or(z.literal("")),
      transactionDate: z
        .string()
        .min(1, t("transaction:saleAdd.validation.transactionDateRequired")),
    })
    .refine(
      (data) => {
        // Si locationType est MARKET, calendarId est requis
        if (data.locationType === "MARKET") {
          return data.calendarId && data.calendarId.length > 0;
        }
        return true;
      },
      {
        message: t("transaction:saleAdd.validation.calendarRequired"),
        path: ["calendarId"],
      }
    )
    .refine(
      (data) => {
        // Si locationType est CONVENTION, conventionId est requis
        if (data.locationType === "CONVENTION") {
          return data.conventionId && data.conventionId.length > 0;
        }
        return true;
      },
      {
        message: t("transaction:saleAdd.validation.conventionRequired"),
        path: ["conventionId"],
      }
    )
    .refine(
      (data) => {
        // Si locationType est CONVENTION, calendarId (calendrier d'enlèvement) est requis
        if (data.locationType === "CONVENTION") {
          return data.calendarId && data.calendarId.length > 0;
        }
        return true;
      },
      {
        message: t("transaction:saleAdd.validation.calendarRequired"),
        path: ["calendarId"],
      }
    )
    .refine(
      (data) => {
        // Vendeur et acheteur ne peuvent pas être identiques
        return data.sellerId !== data.buyerId;
      },
      {
        message: t("transaction:saleAdd.validation.sellerBuyerNotSame"),
        path: ["buyerId"],
      }
    );
};

// Schema pour un produit dans la transaction
export const createTransactionProductSchema = (t: TranslateFn) => {
  return z.object({
    id: z.string(), // ID temporaire pour le form
    quality: z
      .string()
      .min(1, t("transaction:saleAdd.validation.qualityRequired")),
    standard: z
      .string()
      .min(1, t("transaction:saleAdd.validation.standardRequired")),
    weight: z.coerce
      .number({
        required_error: t("transaction:saleAdd.validation.weightRequired"),
        invalid_type_error: t(
          "transaction:saleAdd.validation.weightInvalidType"
        ),
      })
      .positive(t("transaction:saleAdd.validation.weightPositive")),
    bagCount: z.coerce
      .number({
        required_error: t("transaction:saleAdd.validation.bagCountRequired"),
        invalid_type_error: t(
          "transaction:saleAdd.validation.bagCountInvalidType"
        ),
      })
      .int(t("transaction:saleAdd.validation.bagCountInteger"))
      .positive(t("transaction:saleAdd.validation.bagCountPositive")),
    pricePerKg: z.coerce
      .number({
        required_error: t("transaction:saleAdd.validation.pricePerKgRequired"),
        invalid_type_error: t(
          "transaction:saleAdd.validation.pricePerKgInvalidType"
        ),
      })
      .positive(t("transaction:saleAdd.validation.pricePerKgPositive")),
    totalPrice: z.coerce
      .number({
        required_error: t("transaction:saleAdd.validation.totalPriceRequired"),
        invalid_type_error: t(
          "transaction:saleAdd.validation.totalPriceInvalidType"
        ),
      })
      .positive(t("transaction:saleAdd.validation.totalPricePositive")),
    humidity: z.coerce
      .number()
      .min(0, t("transaction:saleAdd.validation.humidityMinZero"))
      .max(100, t("transaction:saleAdd.validation.humidityMaxHundred"))
      .optional()
      .or(z.literal(null)),
    producerId: z.string().optional().or(z.literal("")).or(z.literal(null)),
    notes: z.string().optional().or(z.literal("")).or(z.literal(null)),
  });
};

// Schema pour ajouter UN seul produit (sans id car généré automatiquement)
export const createSingleProductSchema = (t: TranslateFn) => {
  return z.object({
    quality: z
      .string()
      .min(1, t("transaction:saleAdd.validation.qualityRequired")),
    standard: z
      .string()
      .min(1, t("transaction:saleAdd.validation.standardRequired")),
    weight: z.coerce
      .number({
        required_error: t("transaction:saleAdd.validation.weightRequired"),
        invalid_type_error: t(
          "transaction:saleAdd.validation.weightInvalidType"
        ),
      })
      .positive(t("transaction:saleAdd.validation.weightPositive")),
    bagCount: z.coerce
      .number({
        required_error: t("transaction:saleAdd.validation.bagCountRequired"),
        invalid_type_error: t(
          "transaction:saleAdd.validation.bagCountInvalidType"
        ),
      })
      .int(t("transaction:saleAdd.validation.bagCountInteger"))
      .positive(t("transaction:saleAdd.validation.bagCountPositive")),
    pricePerKg: z.coerce
      .number({
        required_error: t("transaction:saleAdd.validation.pricePerKgRequired"),
        invalid_type_error: t(
          "transaction:saleAdd.validation.pricePerKgInvalidType"
        ),
      })
      .positive(t("transaction:saleAdd.validation.pricePerKgPositive")),
    humidity: z.coerce
      .number()
      .min(0, t("transaction:saleAdd.validation.humidityMinZero"))
      .max(100, t("transaction:saleAdd.validation.humidityMaxHundred"))
      .optional()
      .or(z.literal(null)),
    producerId: z.string().optional().or(z.literal("")).or(z.literal(null)),
  });
};

// Schema pour l'étape 2: Produits
export const createStep2ProductsSchema = (t: TranslateFn) => {
  return z.object({
    products: z
      .array(createTransactionProductSchema(t))
      .min(1, t("transaction:saleAdd.validation.atLeastOneProduct")),
  });
};

// Schema pour l'étape 3: Documents
export const createStep3DocumentsSchema = (t: TranslateFn) => {
  return z.object({
    saleContractDocuments: z
      .array(fileValueSchema)
      .min(1, t("transaction:saleAdd.validation.saleContractRequired")),
  });
};

// Schema pour l'étape 4: Récapitulatif
export const createStep4SummarySchema = (t: TranslateFn) => {
  return z.object({
    confirmed: z.boolean().refine((val) => val === true, {
      message: t("transaction:saleAdd.validation.confirmationRequired"),
    }),
    notes: z.string().optional().or(z.literal("")).or(z.literal(null)),
  });
};

// Types pour le formulaire multi-étapes de vente
export type Step1GeneralInfoData = z.infer<
  ReturnType<typeof createStep1GeneralInfoSchema>
>;
export type TransactionProductData = z.infer<
  ReturnType<typeof createTransactionProductSchema>
>;
export type SingleProductData = z.infer<
  ReturnType<typeof createSingleProductSchema>
>;
export type Step2ProductsData = z.infer<
  ReturnType<typeof createStep2ProductsSchema>
>;
export type Step3DocumentsData = z.infer<
  ReturnType<typeof createStep3DocumentsSchema>
>;
export type Step4SummaryData = z.infer<
  ReturnType<typeof createStep4SummarySchema>
>;
