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

// Schema pour l'étape 1: Informations générales (achat)
export const createPurchaseStep1GeneralInfoSchema = (t: TranslateFn) => {
  return z
    .object({
      locationType: z.enum(TRANSACTION_LOCATION_TYPES_ENUM, {
        errorMap: () => ({
          message: t("transaction:purchaseAdd.validation.locationTypeRequired"),
        }),
      }),
      buyerId: z
        .string()
        .min(1, t("transaction:purchaseAdd.validation.buyerRequired")),
      sellerId: z
        .string()
        .min(1, t("transaction:purchaseAdd.validation.sellerRequired")),
      principalExporterId: z.string().optional().or(z.literal("")),
      calendarId: z.string().optional().or(z.literal("")),
      conventionId: z.string().optional().or(z.literal("")),
      transactionDate: z
        .string()
        .min(1, t("transaction:purchaseAdd.validation.transactionDateRequired")),
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
        message: t("transaction:purchaseAdd.validation.calendarRequired"),
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
        message: t("transaction:purchaseAdd.validation.conventionRequired"),
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
        message: t("transaction:purchaseAdd.validation.calendarRequired"),
        path: ["calendarId"],
      }
    )
    .refine(
      (data) => {
        // Vendeur et acheteur ne peuvent pas être identiques
        return data.sellerId !== data.buyerId;
      },
      {
        message: t("transaction:purchaseAdd.validation.sellerBuyerNotSame"),
        path: ["sellerId"],
      }
    );
};

// Schema pour un produit dans la transaction d'achat (sans producteur)
export const createPurchaseProductSchema = (t: TranslateFn) => {
  return z.object({
    id: z.string(), // ID temporaire pour le form
    quality: z
      .string()
      .min(1, t("transaction:purchaseAdd.validation.qualityRequired")),
    standard: z
      .string()
      .min(1, t("transaction:purchaseAdd.validation.standardRequired")),
    weight: z.coerce
      .number({
        required_error: t("transaction:purchaseAdd.validation.weightRequired"),
        invalid_type_error: t(
          "transaction:purchaseAdd.validation.weightInvalidType"
        ),
      })
      .positive(t("transaction:purchaseAdd.validation.weightPositive")),
    bagCount: z.coerce
      .number({
        required_error: t("transaction:purchaseAdd.validation.bagCountRequired"),
        invalid_type_error: t(
          "transaction:purchaseAdd.validation.bagCountInvalidType"
        ),
      })
      .int(t("transaction:purchaseAdd.validation.bagCountInteger"))
      .positive(t("transaction:purchaseAdd.validation.bagCountPositive")),
    pricePerKg: z.coerce
      .number({
        required_error: t("transaction:purchaseAdd.validation.pricePerKgRequired"),
        invalid_type_error: t(
          "transaction:purchaseAdd.validation.pricePerKgInvalidType"
        ),
      })
      .positive(t("transaction:purchaseAdd.validation.pricePerKgPositive")),
    totalPrice: z.coerce
      .number({
        required_error: t("transaction:purchaseAdd.validation.totalPriceRequired"),
        invalid_type_error: t(
          "transaction:purchaseAdd.validation.totalPriceInvalidType"
        ),
      })
      .positive(t("transaction:purchaseAdd.validation.totalPricePositive")),
    humidity: z.coerce
      .number()
      .min(0, t("transaction:purchaseAdd.validation.humidityMinZero"))
      .max(100, t("transaction:purchaseAdd.validation.humidityMaxHundred"))
      .optional()
      .or(z.literal(null)),
    producerId: z.string().optional().or(z.literal("")).or(z.literal(null)),
    notes: z.string().optional().or(z.literal("")).or(z.literal(null)),
  });
};

// Schema pour ajouter UN seul produit (sans producteur pour achat)
export const createPurchaseSingleProductSchema = (t: TranslateFn) => {
  return z.object({
    quality: z
      .string()
      .min(1, t("transaction:purchaseAdd.validation.qualityRequired")),
    standard: z
      .string()
      .min(1, t("transaction:purchaseAdd.validation.standardRequired")),
    weight: z.coerce
      .number({
        required_error: t("transaction:purchaseAdd.validation.weightRequired"),
        invalid_type_error: t(
          "transaction:purchaseAdd.validation.weightInvalidType"
        ),
      })
      .positive(t("transaction:purchaseAdd.validation.weightPositive")),
    bagCount: z.coerce
      .number({
        required_error: t("transaction:purchaseAdd.validation.bagCountRequired"),
        invalid_type_error: t(
          "transaction:purchaseAdd.validation.bagCountInvalidType"
        ),
      })
      .int(t("transaction:purchaseAdd.validation.bagCountInteger"))
      .positive(t("transaction:purchaseAdd.validation.bagCountPositive")),
    pricePerKg: z.coerce
      .number({
        required_error: t("transaction:purchaseAdd.validation.pricePerKgRequired"),
        invalid_type_error: t(
          "transaction:purchaseAdd.validation.pricePerKgInvalidType"
        ),
      })
      .positive(t("transaction:purchaseAdd.validation.pricePerKgPositive")),
    humidity: z.coerce
      .number()
      .min(0, t("transaction:purchaseAdd.validation.humidityMinZero"))
      .max(100, t("transaction:purchaseAdd.validation.humidityMaxHundred"))
      .optional()
      .or(z.literal(null)),
  });
};

// Schema pour l'étape 2: Produits
export const createPurchaseStep2ProductsSchema = (t: TranslateFn) => {
  return z.object({
    products: z
      .array(createPurchaseProductSchema(t))
      .min(1, t("transaction:purchaseAdd.validation.atLeastOneProduct")),
  });
};

// Schema pour l'étape 3: Documents (contrat d'achat)
export const createPurchaseStep3DocumentsSchema = (t: TranslateFn) => {
  return z.object({
    purchaseContractDocuments: z
      .array(fileValueSchema)
      .min(1, t("transaction:purchaseAdd.validation.purchaseContractRequired")),
  });
};

// Schema pour l'étape 4: Récapitulatif
export const createPurchaseStep4SummarySchema = (t: TranslateFn) => {
  return z.object({
    confirmed: z.boolean().refine((val) => val === true, {
      message: t("transaction:purchaseAdd.validation.confirmationRequired"),
    }),
    notes: z.string().optional().or(z.literal("")).or(z.literal(null)),
  });
};

// Types pour le formulaire multi-étapes d'achat
export type PurchaseStep1GeneralInfoData = z.infer<
  ReturnType<typeof createPurchaseStep1GeneralInfoSchema>
>;
export type PurchaseProductData = z.infer<
  ReturnType<typeof createPurchaseProductSchema>
>;
export type PurchaseSingleProductData = z.infer<
  ReturnType<typeof createPurchaseSingleProductSchema>
>;
export type PurchaseStep2ProductsData = z.infer<
  ReturnType<typeof createPurchaseStep2ProductsSchema>
>;
export type PurchaseStep3DocumentsData = z.infer<
  ReturnType<typeof createPurchaseStep3DocumentsSchema>
>;
export type PurchaseStep4SummaryData = z.infer<
  ReturnType<typeof createPurchaseStep4SummarySchema>
>;
