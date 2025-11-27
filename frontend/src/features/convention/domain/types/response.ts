import { PaginationMeta } from "@/core/domain/types";

/**
 * Réponse API pour une convention
 */
export interface ConventionResponse {
  id: string;
  code: string;
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
    id: string;
    originalName: string;
    fileName: string;
    mimeType?: string;
    size?: number;
    documentType?: string;
    publicUrl?: string;
  }>;
  status: "active" | "inactive"; // Indique si la convention est associée à la campagne en cours
  createdAt: string;
  updatedAt: string;

  // Relations
  buyerExporter?: {
    id: string;
    actorType: string;
    familyName: string;
    givenName: string;
    email?: string;
    phone?: string;
    onccId?: string;
    status: string;
  };
  producers?: {
    id: string;
    actorType: string;
    familyName: string;
    givenName: string;
    email?: string;
    phone?: string;
    onccId?: string;
    status: string;
  };
  campaigns?: Array<{
    id: string;
    code: string;
    startDate: string;
    endDate: string;
    status: string;
  }>;
}

/**
 * Réponse paginée pour la liste des conventions
 */
export interface PaginatedConventionsResponse {
  data: ConventionResponse[];
  meta: PaginationMeta;
}
