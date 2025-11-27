import type { DocumentFilters, GetDocumentsResult, Document, DocumentSyncData, DocumentSyncResult } from "./document.types";

export interface UploadDocumentRequest {
  file: File;
  documentableType: string;
  documentableId: string;
  documentType?: string;
  optionValues?: string[];
}

export interface UploadDocumentsRequest {
  files: File[];
  documentableType: string;
  documentableId: string;
  documentTypes?: string[];
  optionValues?: string[][];
}

export interface IDocumentRepository {
  getAll(filters: DocumentFilters, isOnline: boolean): Promise<GetDocumentsResult>;
  uploadDocument(request: UploadDocumentRequest, isOnline: boolean): Promise<Document>;
  uploadDocuments(request: UploadDocumentsRequest, isOnline: boolean): Promise<Document[]>;
  syncDocuments(data: DocumentSyncData, isOnline: boolean): Promise<DocumentSyncResult>;
}