/**
 * Codes d'erreur pour la gestion des calendriers
 */
export enum CalendarErrorCodes {
  // Erreurs de recherche
  NOT_FOUND = 'CALENDAR_NOT_FOUND',
  LIST_FAILED = 'CALENDAR_LIST_FAILED',
  SHOW_FAILED = 'CALENDAR_SHOW_FAILED',

  // Erreurs de création
  CREATE_FAILED = 'CALENDAR_CREATE_FAILED',
  CODE_EXISTS = 'CALENDAR_CODE_EXISTS',
  CAMPAIGN_NOT_FOUND = 'CALENDAR_CAMPAIGN_NOT_FOUND',
  CONVENTION_NOT_FOUND = 'CALENDAR_CONVENTION_NOT_FOUND',
  CONVENTION_REQUIRED = 'CALENDAR_CONVENTION_REQUIRED',
  OPA_NOT_FOUND = 'CALENDAR_OPA_NOT_FOUND',
  OPA_NOT_ACTIVE = 'CALENDAR_OPA_NOT_ACTIVE',
  INVALID_DATE_RANGE = 'CALENDAR_INVALID_DATE_RANGE',
  DATE_OVERLAP = 'CALENDAR_DATE_OVERLAP',
  INVALID_CALENDAR_TYPE = 'CALENDAR_INVALID_CALENDAR_TYPE',

  // Erreurs de mise à jour
  UPDATE_FAILED = 'CALENDAR_UPDATE_FAILED',
  UPDATE_CODE_EXISTS = 'CALENDAR_UPDATE_CODE_EXISTS',
  UPDATE_NOT_AUTHORIZED = 'CALENDAR_UPDATE_NOT_AUTHORIZED',

  // Erreurs de statut
  STATUS_UPDATE_INVALID = 'CALENDAR_STATUS_UPDATE_INVALID',
  STATUS_UPDATE_FAILED = 'CALENDAR_STATUS_UPDATE_FAILED',
  CODE_MISMATCH = 'CALENDAR_CODE_MISMATCH',
  PAST_DATE_STATUS_CHANGE = 'CALENDAR_PAST_DATE_STATUS_CHANGE',

  // Erreurs de suppression
  DELETE_FAILED = 'CALENDAR_DELETE_FAILED',
  DELETE_NOT_AUTHORIZED = 'CALENDAR_DELETE_NOT_AUTHORIZED',

  // Erreurs d'historique
  AUDIT_HISTORY_FAILED = 'CALENDAR_AUDIT_HISTORY_FAILED',

  // Erreurs de synchronisation
  SYNC_FAILED = 'CALENDAR_SYNC_FAILED',
}

/**
 * Messages d'erreur en français pour les calendriers
 */
export const CalendarErrorMessages: Record<CalendarErrorCodes, string> = {
  // Erreurs de recherche
  [CalendarErrorCodes.NOT_FOUND]: 'Calendrier introuvable',
  [CalendarErrorCodes.LIST_FAILED]: 'Erreur lors de la récupération des calendriers',
  [CalendarErrorCodes.SHOW_FAILED]: 'Erreur lors de la récupération du calendrier',

  // Erreurs de création
  [CalendarErrorCodes.CREATE_FAILED]: 'Erreur lors de la création du calendrier',
  [CalendarErrorCodes.CODE_EXISTS]: 'Un calendrier avec ce code existe déjà',
  [CalendarErrorCodes.CAMPAIGN_NOT_FOUND]: 'Campagne introuvable',
  [CalendarErrorCodes.CONVENTION_NOT_FOUND]: 'Convention introuvable',
  [CalendarErrorCodes.CONVENTION_REQUIRED]:
    'Une convention est requise pour les événements de type ENLEVEMENT',
  [CalendarErrorCodes.OPA_NOT_FOUND]: 'OPA introuvable',
  [CalendarErrorCodes.OPA_NOT_ACTIVE]: "L'OPA sélectionné n'est pas actif",
  [CalendarErrorCodes.INVALID_DATE_RANGE]:
    'La date de fin doit être postérieure à la date de début',
  [CalendarErrorCodes.DATE_OVERLAP]:
    'Les dates du calendrier se chevauchent avec un événement existant',
  [CalendarErrorCodes.INVALID_CALENDAR_TYPE]:
    'Cette action est uniquement disponible pour les calendriers de type MARCHE',

  // Erreurs de mise à jour
  [CalendarErrorCodes.UPDATE_FAILED]: 'Erreur lors de la mise à jour du calendrier',
  [CalendarErrorCodes.UPDATE_CODE_EXISTS]: 'Un autre calendrier utilise déjà ce code',
  [CalendarErrorCodes.UPDATE_NOT_AUTHORIZED]: "Vous n'êtes pas autorisé à modifier ce calendrier",

  // Erreurs de statut
  [CalendarErrorCodes.STATUS_UPDATE_INVALID]: 'Statut invalide',
  [CalendarErrorCodes.STATUS_UPDATE_FAILED]: 'Erreur lors de la mise à jour du statut',
  [CalendarErrorCodes.CODE_MISMATCH]: 'Le code du calendrier saisi ne correspond pas',
  [CalendarErrorCodes.PAST_DATE_STATUS_CHANGE]:
    "Impossible de modifier le statut d'un calendrier dont la date de début est dans le passé",

  // Erreurs de suppression
  [CalendarErrorCodes.DELETE_FAILED]: 'Erreur lors de la suppression du calendrier',
  [CalendarErrorCodes.DELETE_NOT_AUTHORIZED]: "Vous n'êtes pas autorisé à supprimer ce calendrier",

  // Erreurs d'historique
  [CalendarErrorCodes.AUDIT_HISTORY_FAILED]:
    "Erreur lors de la récupération de l'historique d'audit",

  // Erreurs de synchronisation
  [CalendarErrorCodes.SYNC_FAILED]: 'Erreur lors de la synchronisation des calendriers',
}

/**
 * Codes de succès pour la gestion des calendriers
 */
export enum CalendarSuccessCodes {
  CREATED = 'CALENDAR_CREATED',
  UPDATED = 'CALENDAR_UPDATED',
  STATUS_UPDATED = 'CALENDAR_STATUS_UPDATED',
  EXPECTED_SALES_COUNT_UPDATED = 'CALENDAR_EXPECTED_SALES_COUNT_UPDATED',
  DELETED = 'CALENDAR_DELETED',
  LIST_SUCCESS = 'CALENDAR_LIST_SUCCESS',
  DETAILS_SUCCESS = 'CALENDAR_DETAILS_SUCCESS',
  AUDIT_HISTORY_SUCCESS = 'CALENDAR_AUDIT_HISTORY_SUCCESS',
  SYNC_SUCCESS = 'CALENDAR_SYNC_SUCCESS',
}

/**
 * Messages de succès en français pour les calendriers
 */
export const CalendarSuccessMessages: Record<CalendarSuccessCodes, string> = {
  [CalendarSuccessCodes.CREATED]: 'Calendrier créé avec succès',
  [CalendarSuccessCodes.UPDATED]: 'Calendrier mis à jour avec succès',
  [CalendarSuccessCodes.STATUS_UPDATED]: 'Statut du calendrier mis à jour avec succès',
  [CalendarSuccessCodes.EXPECTED_SALES_COUNT_UPDATED]:
    'Nombre de ventes attendues mis à jour avec succès',
  [CalendarSuccessCodes.DELETED]: 'Calendrier supprimé avec succès',
  [CalendarSuccessCodes.LIST_SUCCESS]: 'Liste des calendriers récupérée avec succès',
  [CalendarSuccessCodes.DETAILS_SUCCESS]: 'Détails du calendrier récupérés avec succès',
  [CalendarSuccessCodes.AUDIT_HISTORY_SUCCESS]: "Historique d'audit récupéré avec succès",
  [CalendarSuccessCodes.SYNC_SUCCESS]: 'Calendriers synchronisés avec succès',
}
