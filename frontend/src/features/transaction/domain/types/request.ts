import { TransactionFilters } from "../Transaction";

export type GetTransactionsRequest = TransactionFilters;

/**
 * CreateTransactionRequest : payload pour l'API lors de la création d'une transaction
 * Utilisé UNIQUEMENT dans le repository pour construire la requête API
 */
export interface CreateTransactionRequest {
  transactionType: "SALE" | "PURCHASE";
  locationType: "MARKET" | "CONVENTION" | "OUTSIDE_MARKET";
  sellerId: string;
  buyerId: string;
  principalExporterId?: string | null;
  // campaignId est déduit côté backend à partir de la campagne active
  calendarId?: string | null;
  conventionId?: string | null;
  transactionDate: string;
  notes?: string | null;
  products: Array<{
    quality: string;
    standard: string;
    weight: number;
    bagCount: number;
    pricePerKg: number;
    totalPrice: number;
    producerId?: string | null;
    humidity?: number | null;
    notes?: string | null;
  }>;
  // Documents stockés localement (pas envoyés au backend pour l'instant)
  documents?: Array<{
    base64Data: string;
    mimeType: string;
    fileName: string;
    documentType: string;
  }>;
}

/**
 * UpdateTransactionRequest : payload pour l'API lors de la mise à jour d'une transaction
 */
export interface UpdateTransactionRequest {
  transactionType?: "SALE" | "PURCHASE";
  locationType?: "MARKET" | "CONVENTION" | "OUTSIDE_MARKET";
  sellerId?: string;
  buyerId?: string;
  principalExporterId?: string | null;
  campaignId?: string;
  calendarId?: string | null;
  conventionId?: string | null;
  transactionDate?: string;
  notes?: string | null;
  products?: Array<{
    quality: string;
    standard: string;
    weight: number;
    bagCount: number;
    pricePerKg: number;
    totalPrice: number;
    producerId?: string | null;
    humidity?: number | null;
    notes?: string | null;
  }>;
  documents?: Array<{
    base64Data: string;
    mimeType: string;
    fileName: string;
    documentType: string;
  }>;
}
