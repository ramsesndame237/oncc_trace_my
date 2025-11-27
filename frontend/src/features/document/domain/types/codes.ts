/**
 * Codes d'erreur et de succès pour la feature Document
 * Alignés avec les codes backend dans /backend/app/types/errors/document.ts
 */

export const DocumentErrorCodes = {
  // Récupération des documents
  DOCUMENT_LIST_FAILED: "DOCUMENT_LIST_FAILED",
  DOCUMENT_NOT_FOUND: "DOCUMENT_NOT_FOUND",
  DOCUMENT_DETAILS_FAILED: "DOCUMENT_DETAILS_FAILED",
  DOCUMENT_DOWNLOAD_FAILED: "DOCUMENT_DOWNLOAD_FAILED",
  DOCUMENT_UPLOAD_FAILED: "DOCUMENT_UPLOAD_FAILED",
  DOCUMENT_CREATION_FAILED: "DOCUMENT_CREATION_FAILED",
  DOCUMENT_UPDATE_FAILED: "DOCUMENT_UPDATE_FAILED",
  DOCUMENT_DELETION_FAILED: "DOCUMENT_DELETION_FAILED",
  DOCUMENT_PREVIEW_FAILED: "DOCUMENT_PREVIEW_FAILED",

  // Paramètres invalides
  DOCUMENT_INVALID_DOCUMENTABLE_TYPE: "DOCUMENT_INVALID_DOCUMENTABLE_TYPE",
  DOCUMENT_INVALID_DOCUMENTABLE_ID: "DOCUMENT_INVALID_DOCUMENTABLE_ID",
  DOCUMENT_INVALID_PAGINATION: "DOCUMENT_INVALID_PAGINATION",

  // Autorisations
  DOCUMENT_ACCESS_DENIED: "DOCUMENT_ACCESS_DENIED",
  DOCUMENT_NOT_AUTHORIZED: "DOCUMENT_NOT_AUTHORIZED",

  // Validation de fichiers
  DOCUMENT_FILE_TOO_LARGE: "DOCUMENT_FILE_TOO_LARGE",
  DOCUMENT_FILE_TYPE_NOT_ALLOWED: "DOCUMENT_FILE_TYPE_NOT_ALLOWED",
  DOCUMENT_FILE_INVALID: "DOCUMENT_FILE_INVALID",
  DOCUMENT_NOT_PREVIEWABLE: "DOCUMENT_NOT_PREVIEWABLE",
  DOCUMENT_VALIDATION_FAILED: "DOCUMENT_VALIDATION_FAILED",
  DOCUMENT_INVALID_FILES: "DOCUMENT_INVALID_FILES",

  // Stockage et infrastructure
  DOCUMENT_STORAGE_ERROR: "DOCUMENT_STORAGE_ERROR",
  DOCUMENT_MINIO_CONNECTION_ERROR: "DOCUMENT_MINIO_CONNECTION_ERROR",
  DOCUMENT_BUCKET_NOT_FOUND: "DOCUMENT_BUCKET_NOT_FOUND",
  DOCUMENT_FILE_NOT_FOUND_IN_STORAGE: "DOCUMENT_FILE_NOT_FOUND_IN_STORAGE",

  // Synchronisation
  DOCUMENT_SYNC_FAILED: "DOCUMENT_SYNC_FAILED",
} as const;

export const DocumentSuccessCodes = {
  DOCUMENT_LIST_SUCCESS: "DOCUMENT_LIST_SUCCESS",
  DOCUMENT_DETAILS_SUCCESS: "DOCUMENT_DETAILS_SUCCESS",
  DOCUMENT_CREATED: "DOCUMENT_CREATED",
  DOCUMENT_UPDATED: "DOCUMENT_UPDATED",
  DOCUMENT_DELETED: "DOCUMENT_DELETED",
  DOCUMENT_DOWNLOADED: "DOCUMENT_DOWNLOADED",
  DOCUMENT_PREVIEWED: "DOCUMENT_PREVIEWED",
  DOCUMENT_UPLOADED: "DOCUMENT_UPLOADED",
  DOCUMENTS_FETCHED: "DOCUMENTS_FETCHED",
  DOCUMENT_FETCH_SUCCESS: "DOCUMENT_FETCH_SUCCESS",
  DOCUMENT_SYNC_SUCCESS: "DOCUMENT_SYNC_SUCCESS",
} as const;

export type DocumentErrorCode = keyof typeof DocumentErrorCodes;
export type DocumentSuccessCode = keyof typeof DocumentSuccessCodes;

/**
 * Messages d'erreur en français pour les documents
 */
export const DocumentErrorMessages: Record<DocumentErrorCode, string> = {
  DOCUMENT_LIST_FAILED: "Échec de la récupération de la liste des documents",
  DOCUMENT_NOT_FOUND: "Document non trouvé",
  DOCUMENT_DETAILS_FAILED: "Échec lors de la récupération des détails du document",
  DOCUMENT_DOWNLOAD_FAILED: "Échec du téléchargement du document",
  DOCUMENT_UPLOAD_FAILED: "Échec de l'upload du document",
  DOCUMENT_CREATION_FAILED: "Échec de la création du document",
  DOCUMENT_UPDATE_FAILED: "Échec de la mise à jour du document",
  DOCUMENT_DELETION_FAILED: "Échec de la suppression du document",
  DOCUMENT_PREVIEW_FAILED: "Échec de la prévisualisation du document",
  DOCUMENT_INVALID_DOCUMENTABLE_TYPE: "Type d'entité documentable invalide",
  DOCUMENT_INVALID_DOCUMENTABLE_ID: "Identifiant d'entité documentable invalide",
  DOCUMENT_INVALID_PAGINATION: "Paramètres de pagination invalides",
  DOCUMENT_ACCESS_DENIED: "Accès refusé aux documents",
  DOCUMENT_NOT_AUTHORIZED: "Non autorisé à accéder à ce document",
  DOCUMENT_FILE_TOO_LARGE: "Le fichier est trop volumineux",
  DOCUMENT_FILE_TYPE_NOT_ALLOWED: "Type de fichier non autorisé",
  DOCUMENT_FILE_INVALID: "Fichier invalide",
  DOCUMENT_NOT_PREVIEWABLE: "Ce type de document ne peut pas être prévisualisé",
  DOCUMENT_VALIDATION_FAILED: "Échec de la validation des documents",
  DOCUMENT_INVALID_FILES: "Certains fichiers sont invalides",
  DOCUMENT_STORAGE_ERROR: "Erreur de stockage du document",
  DOCUMENT_MINIO_CONNECTION_ERROR: "Erreur de connexion au stockage Minio",
  DOCUMENT_BUCKET_NOT_FOUND: "Bucket de stockage non trouvé",
  DOCUMENT_FILE_NOT_FOUND_IN_STORAGE: "Fichier non trouvé dans le stockage",
  DOCUMENT_SYNC_FAILED: "Échec de la synchronisation des documents",
};

/**
 * Messages de succès en français pour les documents
 */
export const DocumentSuccessMessages: Record<DocumentSuccessCode, string> = {
  DOCUMENT_LIST_SUCCESS: "Liste des documents récupérée avec succès",
  DOCUMENT_DETAILS_SUCCESS: "Détails du document récupérés avec succès",
  DOCUMENT_CREATED: "Document créé avec succès",
  DOCUMENT_UPDATED: "Document mis à jour avec succès",
  DOCUMENT_DELETED: "Document supprimé avec succès",
  DOCUMENT_DOWNLOADED: "Document téléchargé avec succès",
  DOCUMENT_PREVIEWED: "Prévisualisation du document affichée avec succès",
  DOCUMENT_UPLOADED: "Document uploadé avec succès",
  DOCUMENTS_FETCHED: "Documents récupérés avec succès",
  DOCUMENT_FETCH_SUCCESS: "Document récupéré avec succès",
  DOCUMENT_SYNC_SUCCESS: "Documents synchronisés avec succès",
};