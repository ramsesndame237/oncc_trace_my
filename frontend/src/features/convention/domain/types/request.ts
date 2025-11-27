import { ConventionFilters } from "../types";

export interface GetConventionsRequest extends ConventionFilters {
  page?: number;
  per_page?: number;
  search?: string;
  buyerExporterId?: string;
  producersId?: string;
  campaignId?: string;
}

export interface GetConventionRequest {
  id: string;
}

/**
 * CreateConventionRequest : payload pour l'API lors de la création d'une convention
 * Utilisé UNIQUEMENT dans le repository pour construire la requête API
 * Les documents sont ajoutés dynamiquement via cast
 */
export interface CreateConventionRequest {
  buyerExporterId: string;
  producersId: string;
  signatureDate: string;
  products: Array<{
    quality: string;
    standard: string;
    weight: number;
    bags: number;
    humidity: number;
    pricePerKg: number;
  }>;
  documents?: Array<{
    base64Data: string;
    mimeType: string;
    fileName: string;
    documentType: string;
  }>;
}

/**
 * UpdateConventionRequest : payload pour l'API lors de la mise à jour d'une convention
 * Utilisé UNIQUEMENT dans le repository pour construire la requête API
 */
export interface UpdateConventionRequest {
  buyerExporterId?: string;
  producersId?: string;
  signatureDate?: string;
  products?: Array<{
    quality: string;
    standard: string;
    weight: number;
    bags: number;
    humidity: number;
    pricePerKg: number;
  }>;
  documents?: Array<{
    base64Data: string;
    mimeType: string;
    fileName: string;
    documentType: string;
  }>;
}
