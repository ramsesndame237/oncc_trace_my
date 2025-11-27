/**
 * Codes d'erreur spécifiques aux documents
 */
export enum DocumentErrorCodes {
  DOCUMENT_NOT_FOUND = 'DOCUMENT_NOT_FOUND',
  DOCUMENT_LIST_FAILED = 'DOCUMENT_LIST_FAILED',
  DOCUMENT_CREATION_FAILED = 'DOCUMENT_CREATION_FAILED',
  DOCUMENT_UPDATE_FAILED = 'DOCUMENT_UPDATE_FAILED',
  DOCUMENT_DELETION_FAILED = 'DOCUMENT_DELETION_FAILED',
  DOCUMENT_DOWNLOAD_FAILED = 'DOCUMENT_DOWNLOAD_FAILED',
  DOCUMENT_PREVIEW_FAILED = 'DOCUMENT_PREVIEW_FAILED',
  DOCUMENT_NOT_AUTHORIZED = 'DOCUMENT_NOT_AUTHORIZED',
  DOCUMENT_UPLOAD_FAILED = 'DOCUMENT_UPLOAD_FAILED',
  DOCUMENT_FILE_TOO_LARGE = 'DOCUMENT_FILE_TOO_LARGE',
  DOCUMENT_FILE_TYPE_NOT_ALLOWED = 'DOCUMENT_FILE_TYPE_NOT_ALLOWED',
  DOCUMENT_FILE_INVALID = 'DOCUMENT_FILE_INVALID',
  DOCUMENT_STORAGE_ERROR = 'DOCUMENT_STORAGE_ERROR',
  DOCUMENT_NOT_PREVIEWABLE = 'DOCUMENT_NOT_PREVIEWABLE',
  DOCUMENT_MINIO_CONNECTION_ERROR = 'DOCUMENT_MINIO_CONNECTION_ERROR',
  DOCUMENT_BUCKET_NOT_FOUND = 'DOCUMENT_BUCKET_NOT_FOUND',
  DOCUMENT_FILE_NOT_FOUND_IN_STORAGE = 'DOCUMENT_FILE_NOT_FOUND_IN_STORAGE',
  DOCUMENT_VALIDATION_FAILED = 'DOCUMENT_VALIDATION_FAILED',
  DOCUMENT_INVALID_FILES = 'DOCUMENT_INVALID_FILES',
  DOCUMENT_SYNC_FAILED = 'DOCUMENT_SYNC_FAILED',
}

/**
 * Codes de succès spécifiques aux documents
 */
export enum DocumentSuccessCodes {
  DOCUMENT_LIST_SUCCESS = 'DOCUMENT_LIST_SUCCESS',
  DOCUMENT_FETCH_SUCCESS = 'DOCUMENT_FETCH_SUCCESS',
  DOCUMENT_CREATED = 'DOCUMENT_CREATED',
  DOCUMENT_UPDATED = 'DOCUMENT_UPDATED',
  DOCUMENT_DELETED = 'DOCUMENT_DELETED',
  DOCUMENT_DOWNLOADED = 'DOCUMENT_DOWNLOADED',
  DOCUMENT_PREVIEWED = 'DOCUMENT_PREVIEWED',
  DOCUMENT_UPLOADED = 'DOCUMENT_UPLOADED',
  DOCUMENTS_FETCHED = 'DOCUMENTS_FETCHED',
  DOCUMENT_SYNC_SUCCESS = 'DOCUMENT_SYNC_SUCCESS',
}

/**
 * Messages d'erreur pour les documents
 */
export const DocumentErrorMessages: Record<DocumentErrorCodes, string> = {
  [DocumentErrorCodes.DOCUMENT_NOT_FOUND]: 'Document non trouvé',
  [DocumentErrorCodes.DOCUMENT_LIST_FAILED]: 'Échec de la récupération de la liste des documents',
  [DocumentErrorCodes.DOCUMENT_CREATION_FAILED]: 'Échec de la création du document',
  [DocumentErrorCodes.DOCUMENT_UPDATE_FAILED]: 'Échec de la mise à jour du document',
  [DocumentErrorCodes.DOCUMENT_DELETION_FAILED]: 'Échec de la suppression du document',
  [DocumentErrorCodes.DOCUMENT_DOWNLOAD_FAILED]: 'Échec du téléchargement du document',
  [DocumentErrorCodes.DOCUMENT_PREVIEW_FAILED]: 'Échec de la prévisualisation du document',
  [DocumentErrorCodes.DOCUMENT_NOT_AUTHORIZED]: 'Non autorisé à accéder à ce document',
  [DocumentErrorCodes.DOCUMENT_UPLOAD_FAILED]: "Échec de l'upload du document",
  [DocumentErrorCodes.DOCUMENT_FILE_TOO_LARGE]: 'Le fichier est trop volumineux',
  [DocumentErrorCodes.DOCUMENT_FILE_TYPE_NOT_ALLOWED]: 'Type de fichier non autorisé',
  [DocumentErrorCodes.DOCUMENT_FILE_INVALID]: 'Fichier invalide',
  [DocumentErrorCodes.DOCUMENT_STORAGE_ERROR]: 'Erreur de stockage du document',
  [DocumentErrorCodes.DOCUMENT_NOT_PREVIEWABLE]:
    'Ce type de document ne peut pas être prévisualisé',
  [DocumentErrorCodes.DOCUMENT_MINIO_CONNECTION_ERROR]: 'Erreur de connexion au stockage Minio',
  [DocumentErrorCodes.DOCUMENT_BUCKET_NOT_FOUND]: 'Bucket de stockage non trouvé',
  [DocumentErrorCodes.DOCUMENT_FILE_NOT_FOUND_IN_STORAGE]: 'Fichier non trouvé dans le stockage',
  [DocumentErrorCodes.DOCUMENT_VALIDATION_FAILED]: 'Échec de la validation des documents',
  [DocumentErrorCodes.DOCUMENT_INVALID_FILES]: 'Certains fichiers sont invalides',
  [DocumentErrorCodes.DOCUMENT_SYNC_FAILED]: 'Échec de la synchronisation des documents',
}

/**
 * Messages de succès pour les documents
 */
export const DocumentSuccessMessages: Record<DocumentSuccessCodes, string> = {
  [DocumentSuccessCodes.DOCUMENT_LIST_SUCCESS]: 'Liste des documents récupérée avec succès',
  [DocumentSuccessCodes.DOCUMENT_FETCH_SUCCESS]: 'Document récupéré avec succès',
  [DocumentSuccessCodes.DOCUMENT_CREATED]: 'Document créé avec succès',
  [DocumentSuccessCodes.DOCUMENT_UPDATED]: 'Document mis à jour avec succès',
  [DocumentSuccessCodes.DOCUMENT_DELETED]: 'Document supprimé avec succès',
  [DocumentSuccessCodes.DOCUMENT_DOWNLOADED]: 'Document téléchargé avec succès',
  [DocumentSuccessCodes.DOCUMENT_PREVIEWED]: 'Prévisualisation du document affichée avec succès',
  [DocumentSuccessCodes.DOCUMENT_UPLOADED]: 'Document uploadé avec succès',
  [DocumentSuccessCodes.DOCUMENTS_FETCHED]: 'Documents récupérés avec succès',
  [DocumentSuccessCodes.DOCUMENT_SYNC_SUCCESS]: 'Documents synchronisés avec succès',
}
