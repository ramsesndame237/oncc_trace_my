/**
 * Codes d'erreur pour la gestion des parcelles
 */
export enum ParcelErrorCodes {
  PARCEL_NOT_FOUND = 'PARCEL_NOT_FOUND',
  PARCEL_LIST_FAILED = 'PARCEL_LIST_FAILED',
  PARCEL_CREATION_FAILED = 'PARCEL_CREATION_FAILED',
  PARCEL_UPDATE_FAILED = 'PARCEL_UPDATE_FAILED',
  PARCEL_DELETION_FAILED = 'PARCEL_DELETION_FAILED',
  PARCEL_ACTIVATION_FAILED = 'PARCEL_ACTIVATION_FAILED',
  PARCEL_DEACTIVATION_FAILED = 'PARCEL_DEACTIVATION_FAILED',
  PARCEL_NOT_AUTHORIZED = 'PARCEL_NOT_AUTHORIZED',
  PARCEL_ONCC_ID_EXISTS = 'PARCEL_ONCC_ID_EXISTS',
  PARCEL_IDENTIFICATION_ID_EXISTS = 'PARCEL_IDENTIFICATION_ID_EXISTS',
  PARCEL_COORDINATES_FAILED = 'PARCEL_COORDINATES_FAILED',
  PARCEL_COORDINATES_INVALID = 'PARCEL_COORDINATES_INVALID',
  PARCEL_STATS_FAILED = 'PARCEL_STATS_FAILED',
  PARCEL_PRODUCER_NOT_FOUND = 'PARCEL_PRODUCER_NOT_FOUND',
  PARCEL_PRODUCER_INVALID = 'PARCEL_PRODUCER_INVALID',
  PARCEL_VALIDATION_FAILED = 'PARCEL_VALIDATION_FAILED',
  PARCEL_DUPLICATE_IDENTIFIERS = 'PARCEL_DUPLICATE_IDENTIFIERS',
  PARCEL_REQUIRED_FOR_PRODUCER = 'PARCEL_REQUIRED_FOR_PRODUCER',
}

/**
 * Messages d'erreur pour les parcelles
 */
export const ParcelErrorMessages: Record<ParcelErrorCodes, string> = {
  [ParcelErrorCodes.PARCEL_NOT_FOUND]: 'Parcelle non trouvée',
  [ParcelErrorCodes.PARCEL_LIST_FAILED]: 'Échec de la récupération de la liste des parcelles',
  [ParcelErrorCodes.PARCEL_CREATION_FAILED]: 'Échec de la création de la parcelle',
  [ParcelErrorCodes.PARCEL_UPDATE_FAILED]: 'Échec de la mise à jour de la parcelle',
  [ParcelErrorCodes.PARCEL_DELETION_FAILED]: 'Échec de la suppression de la parcelle',
  [ParcelErrorCodes.PARCEL_ACTIVATION_FAILED]: "Échec de l'activation de la parcelle",
  [ParcelErrorCodes.PARCEL_DEACTIVATION_FAILED]: 'Échec de la désactivation de la parcelle',
  [ParcelErrorCodes.PARCEL_NOT_AUTHORIZED]: 'Action non autorisée sur cette parcelle',
  [ParcelErrorCodes.PARCEL_ONCC_ID_EXISTS]: 'Un ID ONCC existe déjà pour cette parcelle',
  [ParcelErrorCodes.PARCEL_IDENTIFICATION_ID_EXISTS]:
    "Un ID d'identification existe déjà pour cette parcelle",
  [ParcelErrorCodes.PARCEL_COORDINATES_FAILED]: 'Échec de la gestion des coordonnées',
  [ParcelErrorCodes.PARCEL_COORDINATES_INVALID]: 'Coordonnées GPS invalides',
  [ParcelErrorCodes.PARCEL_STATS_FAILED]: 'Échec de la récupération des statistiques',
  [ParcelErrorCodes.PARCEL_PRODUCER_NOT_FOUND]: 'Producteur non trouvé',
  [ParcelErrorCodes.PARCEL_PRODUCER_INVALID]: 'Producteur invalide pour cette parcelle',
  [ParcelErrorCodes.PARCEL_VALIDATION_FAILED]: 'Échec de la validation des parcelles',
  [ParcelErrorCodes.PARCEL_DUPLICATE_IDENTIFIERS]:
    'Certaines parcelles utilisent des identifiants déjà existants',
  [ParcelErrorCodes.PARCEL_REQUIRED_FOR_PRODUCER]: 'Un producteur doit avoir au moins une parcelle',
}

/**
 * Codes de succès pour la gestion des parcelles
 */
export enum ParcelSuccessCodes {
  PARCEL_LIST_SUCCESS = 'PARCEL_LIST_SUCCESS',
  PARCEL_FETCH_SUCCESS = 'PARCEL_FETCH_SUCCESS',
  PARCEL_CREATED = 'PARCEL_CREATED',
  PARCEL_UPDATED = 'PARCEL_UPDATED',
  PARCEL_DELETED = 'PARCEL_DELETED',
  PARCEL_ACTIVATED = 'PARCEL_ACTIVATED',
  PARCEL_DEACTIVATED = 'PARCEL_DEACTIVATED',
  PARCEL_COORDINATES_ADDED = 'PARCEL_COORDINATES_ADDED',
  PARCEL_COORDINATES_UPDATED = 'PARCEL_COORDINATES_UPDATED',
  PARCEL_COORDINATES_REMOVED = 'PARCEL_COORDINATES_REMOVED',
  PARCEL_STATS_SUCCESS = 'PARCEL_STATS_SUCCESS',
}

/**
 * Messages de succès pour les parcelles
 */
export const ParcelSuccessMessages: Record<ParcelSuccessCodes, string> = {
  [ParcelSuccessCodes.PARCEL_LIST_SUCCESS]: 'Liste des parcelles récupérée avec succès',
  [ParcelSuccessCodes.PARCEL_FETCH_SUCCESS]: 'Détails de la parcelle récupérés avec succès',
  [ParcelSuccessCodes.PARCEL_CREATED]: 'Parcelle créée avec succès',
  [ParcelSuccessCodes.PARCEL_UPDATED]: 'Parcelle mise à jour avec succès',
  [ParcelSuccessCodes.PARCEL_DELETED]: 'Parcelle supprimée avec succès',
  [ParcelSuccessCodes.PARCEL_ACTIVATED]: 'Parcelle activée avec succès',
  [ParcelSuccessCodes.PARCEL_DEACTIVATED]: 'Parcelle désactivée avec succès',
  [ParcelSuccessCodes.PARCEL_COORDINATES_ADDED]: 'Coordonnées ajoutées avec succès',
  [ParcelSuccessCodes.PARCEL_COORDINATES_UPDATED]: 'Coordonnées mises à jour avec succès',
  [ParcelSuccessCodes.PARCEL_COORDINATES_REMOVED]: 'Coordonnées supprimées avec succès',
  [ParcelSuccessCodes.PARCEL_STATS_SUCCESS]: 'Statistiques des parcelles récupérées avec succès',
}
