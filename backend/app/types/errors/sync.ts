/**
 * Codes d'erreur et de succès pour le domaine de synchronisation
 */

export enum SyncErrorCodes {
  SYNC_CHECK_FAILED = 'SYNC_CHECK_FAILED',
  SYNC_PARSE_ERROR = 'SYNC_PARSE_ERROR',
  SYNC_DATABASE_ERROR = 'SYNC_DATABASE_ERROR',
}

export enum SyncSuccessCodes {
  SYNC_CHECK_SUCCESS = 'SYNC_CHECK_SUCCESS',
}

export const SyncErrorMessages: Record<SyncErrorCodes, string> = {
  [SyncErrorCodes.SYNC_CHECK_FAILED]: 'Échec de la vérification de synchronisation',
  [SyncErrorCodes.SYNC_PARSE_ERROR]: "Erreur lors de l'analyse des paramètres de synchronisation",
  [SyncErrorCodes.SYNC_DATABASE_ERROR]:
    'Erreur de base de données lors de la vérification de synchronisation',
}

export const SyncSuccessMessages: Record<SyncSuccessCodes, string> = {
  [SyncSuccessCodes.SYNC_CHECK_SUCCESS]: 'Vérification de synchronisation réussie',
}
