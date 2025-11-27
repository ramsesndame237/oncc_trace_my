import { apiClient, ApiError } from "@/core/infrastructure/api";
import { createSanitizedFile } from "@/lib/sanitizeFileName";
import { injectable } from "tsyringe";
import {
  DocumentErrorCodes,
  DocumentErrorMessages
} from "../../domain";
import type {
  IDocumentRepository,
  DocumentFilters,
  GetDocumentsResult,
  UploadDocumentRequest,
  UploadDocumentsRequest,
  Document,
  DocumentSyncData,
  DocumentSyncResult
} from "../../domain";
import type { PaginatedDocumentsResponse } from "../../domain/types/response";

@injectable()
export class DocumentRepository implements IDocumentRepository {
  /**
   * Construit les paramètres de requête à partir des filtres
   */
  private buildQueryParams(filters: DocumentFilters): URLSearchParams {
    const params = new URLSearchParams({
      documentable_type: filters.documentableType,
      documentable_id: filters.documentableId,
    });

    if (filters.page !== undefined) {
      params.append('page', filters.page.toString());
    }

    if (filters.limit !== undefined) {
      params.append('limit', filters.limit.toString());
    }

    if (filters.documentType) {
      params.append('document_type', filters.documentType);
    }

    return params;
  }

  /**
   * Récupère les documents.
   * - En mode EN LIGNE: Récupère les données fraîches depuis l'API avec métadonnées de pagination.
   * - En mode HORS LIGNE: Non supporté pour les documents (lecture seule depuis l'API).
   * @param filters - Filtres pour la recherche et la pagination
   * @param isOnline - Indique si l'application est en ligne
   * @returns Une promesse résolue avec les documents et les métadonnées de pagination
   */
  async getAll(filters: DocumentFilters, isOnline: boolean): Promise<GetDocumentsResult> {
    if (!isOnline) {
      throw new ApiError(
        DocumentErrorCodes.DOCUMENT_ACCESS_DENIED,
        DocumentErrorMessages.DOCUMENT_ACCESS_DENIED
      );
    }

    try {
      const queryParams = this.buildQueryParams(filters);
      const url = `/documents?${queryParams.toString()}`;

      const response = await apiClient.get<PaginatedDocumentsResponse>(url);

      if (!response.success || !response.data) {
        throw new ApiError(
          DocumentErrorCodes.DOCUMENT_LIST_FAILED,
          DocumentErrorMessages.DOCUMENT_LIST_FAILED
        );
      }

      return {
        documents: response.data.data,
        meta: response.data.meta,
      };
    } catch (error) {
      console.error("Erreur API dans getAll documents:", error);

      // Si c'est déjà une ApiError, on la relance
      if (error instanceof ApiError) {
        throw error;
      }

      // Sinon on crée une nouvelle ApiError
      throw new ApiError(
        DocumentErrorCodes.DOCUMENT_LIST_FAILED,
        DocumentErrorMessages.DOCUMENT_LIST_FAILED
      );
    }
  }

  /**
   * Upload un document.
   * - En mode EN LIGNE: Upload via l'API avec FormData.
   * - En mode HORS LIGNE: Non supporté pour l'upload.
   * @param request - Paramètres de l'upload
   * @param isOnline - Indique si l'application est en ligne
   * @returns Une promesse résolue avec le document uploadé
   */
  async uploadDocument(request: UploadDocumentRequest, isOnline: boolean): Promise<Document> {
    if (!isOnline) {
      throw new ApiError(
        DocumentErrorCodes.DOCUMENT_UPLOAD_FAILED,
        DocumentErrorMessages.DOCUMENT_UPLOAD_FAILED
      );
    }

    try {
      // Créer FormData
      const formData = new FormData();

      // Sanitiser le nom du fichier et préserver le nom original
      const sanitizedFile = createSanitizedFile(request.file);

      // Ajouter le fichier avec le nom sanitisé
      formData.append('files', sanitizedFile);

      // Ajouter le nom original pour le backend
      formData.append('original_names[]', request.file.name);

      // Ajouter les métadonnées avec les noms attendus par le backend
      formData.append('document_type', request.documentType || '');
      formData.append('documentable_type', request.documentableType);
      formData.append('documentable_id', request.documentableId);

      // Ajouter optionValues si présent
      if (request.optionValues && Array.isArray(request.optionValues)) {
        request.optionValues.forEach((value: string, index: number) => {
          formData.append(`optionValues[${index}]`, value);
        });
      }

      const response = await apiClient.postFormData<Document>("/documents", formData);

      if (!response.success || !response.data) {
        throw new ApiError(
          DocumentErrorCodes.DOCUMENT_UPLOAD_FAILED,
          DocumentErrorMessages.DOCUMENT_UPLOAD_FAILED
        );
      }

      return response.data;
    } catch (error) {
      console.error("Erreur API dans uploadDocument:", error);

      // Si c'est déjà une ApiError, on la relance
      if (error instanceof ApiError) {
        throw error;
      }

      // Sinon on crée une nouvelle ApiError
      throw new ApiError(
        DocumentErrorCodes.DOCUMENT_UPLOAD_FAILED,
        DocumentErrorMessages.DOCUMENT_UPLOAD_FAILED
      );
    }
  }

  /**
   * Upload plusieurs documents en une seule requête.
   * - En mode EN LIGNE: Upload via l'API avec FormData.
   * - En mode HORS LIGNE: Non supporté pour l'upload.
   * @param request - Paramètres de l'upload avec tableau de fichiers
   * @param isOnline - Indique si l'application est en ligne
   * @returns Une promesse résolue avec le tableau des documents uploadés
   */
  async uploadDocuments(request: UploadDocumentsRequest, isOnline: boolean): Promise<Document[]> {
    if (!isOnline) {
      throw new ApiError(
        DocumentErrorCodes.DOCUMENT_UPLOAD_FAILED,
        DocumentErrorMessages.DOCUMENT_UPLOAD_FAILED
      );
    }

    try {
      // Créer FormData
      const formData = new FormData();

      // Ajouter tous les fichiers avec noms sanitisés (sans accents)
      // Le nom original est envoyé séparément pour le backend
      request.files.forEach((file) => {
        const sanitizedFile = createSanitizedFile(file);
        formData.append('files', sanitizedFile);
        // Préserver le nom original
        formData.append('original_names[]', file.name);
      });

      // Ajouter les métadonnées communes
      formData.append('documentable_type', request.documentableType);
      formData.append('documentable_id', request.documentableId);

      // Ajouter les types de documents si présents
      if (request.documentTypes && request.documentTypes.length > 0) {
        request.documentTypes.forEach((type) => {
          formData.append('document_types[]', type);
        });
      }

      // Ajouter optionValues si présents
      if (request.optionValues && Array.isArray(request.optionValues)) {
        request.optionValues.forEach((options, fileIndex) => {
          if (Array.isArray(options)) {
            options.forEach((value: string, optionIndex: number) => {
              formData.append(`optionValues[${fileIndex}][${optionIndex}]`, value);
            });
          }
        });
      }

      const response = await apiClient.postFormData<Document[]>("/documents", formData);

      if (!response.success || !response.data) {
        throw new ApiError(
          DocumentErrorCodes.DOCUMENT_UPLOAD_FAILED,
          DocumentErrorMessages.DOCUMENT_UPLOAD_FAILED
        );
      }

      return response.data;
    } catch (error) {
      console.error("Erreur API dans uploadDocuments:", error);

      // Si c'est déjà une ApiError, on la relance
      if (error instanceof ApiError) {
        throw error;
      }

      // Sinon on crée une nouvelle ApiError
      throw new ApiError(
        DocumentErrorCodes.DOCUMENT_UPLOAD_FAILED,
        DocumentErrorMessages.DOCUMENT_UPLOAD_FAILED
      );
    }
  }

  /**
   * Synchronise les documents d'une entité (ajouter, conserver, supprimer).
   * - En mode EN LIGNE: Appelle l'endpoint sync du backend.
   * - En mode HORS LIGNE: Non supporté.
   * @param data - Données de synchronisation
   * @param isOnline - Indique si l'application est en ligne
   * @returns Une promesse résolue avec le résultat de la synchronisation
   */
  async syncDocuments(data: DocumentSyncData, isOnline: boolean): Promise<DocumentSyncResult> {
    if (!isOnline) {
      throw new ApiError(
        DocumentErrorCodes.DOCUMENT_SYNC_FAILED,
        DocumentErrorMessages.DOCUMENT_SYNC_FAILED
      );
    }

    try {
      // Créer FormData
      const formData = new FormData();

      // Ajouter les métadonnées
      formData.append('documentable_type', data.documentableType);
      formData.append('documentable_id', data.documentableId);
      formData.append('existing_document_ids', JSON.stringify(data.documentsToKeep));

      // Ajouter les nouveaux documents avec noms sanitisés
      const documentTypes: string[] = [];
      data.documentsToAdd.forEach(({ file, documentType }) => {
        if (file instanceof File) {
          // Sanitiser le nom du fichier
          const sanitizedFile = createSanitizedFile(file);
          formData.append('files', sanitizedFile);
          // Préserver le nom original
          formData.append('original_names[]', file.name);
          documentTypes.push(documentType);
        }
      });

      // Ajouter les types de documents si présents
      if (documentTypes.length > 0) {
        formData.append('document_types', JSON.stringify(documentTypes));
      }

      const response = await apiClient.postFormData<DocumentSyncResult>("/documents/sync", formData);

      if (!response.success || !response.data) {
        throw new ApiError(
          DocumentErrorCodes.DOCUMENT_SYNC_FAILED,
          DocumentErrorMessages.DOCUMENT_SYNC_FAILED
        );
      }

      return response.data;
    } catch (error) {
      console.error("Erreur API dans syncDocuments:", error);

      // Si c'est déjà une ApiError, on la relance
      if (error instanceof ApiError) {
        throw error;
      }

      // Sinon on crée une nouvelle ApiError
      throw new ApiError(
        DocumentErrorCodes.DOCUMENT_SYNC_FAILED,
        DocumentErrorMessages.DOCUMENT_SYNC_FAILED
      );
    }
  }
}