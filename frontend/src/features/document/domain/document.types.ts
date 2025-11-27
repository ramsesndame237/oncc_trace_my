import type { PaginationMeta } from "@/core/domain/types";

// Types de base pour les documents
export interface Document {
  id: string;
  documentableType: string;
  documentableId: string;
  originalName: string;
  fileName: string;
  storagePath: string;
  publicUrl: string | null;
  mimeType: string | null;
  size: number | null;
  documentType: string | null;
  bucketName: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

// Filtres pour la récupération des documents
export interface DocumentFilters {
  documentableType: string;
  documentableId: string;
  page?: number;
  limit?: number;
  documentType?: string;
}

// Résultat de récupération des documents
export interface GetDocumentsResult {
  documents: Document[];
  meta: PaginationMeta;
}

// Validation des documents
export interface DocumentValidationError {
  index: number;
  documentType: string;
  fileName: string;
  field: string;
  error: string;
}

export interface DocumentValidationResult {
  valid: boolean;
  errors: DocumentValidationError[];
}

// Upload de documents
export interface DocumentUploadError {
  index: number;
  documentType: string;
  fileName: string;
  error: string;
}

export interface DocumentUploadResult {
  success: Document[];
  errors: DocumentUploadError[];
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}

// Synchronisation des documents
export interface DocumentSyncData {
  documentableType: string;
  documentableId: string;
  documentsToAdd: Array<{
    file: File | string; // File object ou base64 string
    documentType: string;
  }>;
  documentsToKeep: string[]; // IDs des documents à conserver
  documentsToDelete: string[]; // IDs des documents à supprimer
}

export interface DocumentSyncResult {
  added: Document[];
  kept: Document[];
  deleted: string[];
  errors: DocumentUploadError[];
}