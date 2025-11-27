/**
 * Codes d'erreur et de succès pour la feature Parcel
 * Alignés avec les codes backend dans /backend/app/types/errors/parcel.ts
 */

export const ParcelErrorCodes = {
  // Codes d'erreur alignés avec le backend
  PARCEL_NOT_FOUND: "PARCEL_NOT_FOUND",
  PARCEL_LIST_FAILED: "PARCEL_LIST_FAILED",
  PARCEL_CREATION_FAILED: "PARCEL_CREATION_FAILED",
  PARCEL_UPDATE_FAILED: "PARCEL_UPDATE_FAILED",
  PARCEL_DELETION_FAILED: "PARCEL_DELETION_FAILED",
  PARCEL_ACTIVATION_FAILED: "PARCEL_ACTIVATION_FAILED",
  PARCEL_DEACTIVATION_FAILED: "PARCEL_DEACTIVATION_FAILED",
  PARCEL_NOT_AUTHORIZED: "PARCEL_NOT_AUTHORIZED",
  PARCEL_ONCC_ID_EXISTS: "PARCEL_ONCC_ID_EXISTS",
  PARCEL_IDENTIFICATION_ID_EXISTS: "PARCEL_IDENTIFICATION_ID_EXISTS",
  PARCEL_COORDINATES_FAILED: "PARCEL_COORDINATES_FAILED",
  PARCEL_COORDINATES_INVALID: "PARCEL_COORDINATES_INVALID",
  PARCEL_STATS_FAILED: "PARCEL_STATS_FAILED",
  PARCEL_PRODUCER_NOT_FOUND: "PARCEL_PRODUCER_NOT_FOUND",
  PARCEL_PRODUCER_INVALID: "PARCEL_PRODUCER_INVALID",
  PARCEL_VALIDATION_FAILED: "PARCEL_VALIDATION_FAILED",
  PARCEL_DUPLICATE_IDENTIFIERS: "PARCEL_DUPLICATE_IDENTIFIERS",
  PARCEL_REQUIRED_FOR_PRODUCER: "PARCEL_REQUIRED_FOR_PRODUCER",
} as const;

export const ParcelSuccessCodes = {
  // Codes de succès alignés avec le backend
  PARCEL_LIST_SUCCESS: "PARCEL_LIST_SUCCESS",
  PARCEL_FETCH_SUCCESS: "PARCEL_FETCH_SUCCESS",
  PARCEL_CREATED: "PARCEL_CREATED",
  PARCEL_UPDATED: "PARCEL_UPDATED",
  PARCEL_DELETED: "PARCEL_DELETED",
  PARCEL_ACTIVATED: "PARCEL_ACTIVATED",
  PARCEL_DEACTIVATED: "PARCEL_DEACTIVATED",
  PARCEL_COORDINATES_ADDED: "PARCEL_COORDINATES_ADDED",
  PARCEL_COORDINATES_UPDATED: "PARCEL_COORDINATES_UPDATED",
  PARCEL_COORDINATES_REMOVED: "PARCEL_COORDINATES_REMOVED",
  PARCEL_STATS_SUCCESS: "PARCEL_STATS_SUCCESS",
} as const;

export type ParcelErrorCode = keyof typeof ParcelErrorCodes;
export type ParcelSuccessCode = keyof typeof ParcelSuccessCodes;

/**
 * Messages d'erreur en français pour les parcelles
 */
export const ParcelErrorMessages: Record<ParcelErrorCode, string> = {
  PARCEL_NOT_FOUND: "Parcelle non trouvée",
  PARCEL_LIST_FAILED: "Échec de la récupération de la liste des parcelles",
  PARCEL_CREATION_FAILED: "Échec de la création de la parcelle",
  PARCEL_UPDATE_FAILED: "Échec de la mise à jour de la parcelle",
  PARCEL_DELETION_FAILED: "Échec de la suppression de la parcelle",
  PARCEL_ACTIVATION_FAILED: "Échec de l'activation de la parcelle",
  PARCEL_DEACTIVATION_FAILED: "Échec de la désactivation de la parcelle",
  PARCEL_NOT_AUTHORIZED: "Action non autorisée sur cette parcelle",
  PARCEL_ONCC_ID_EXISTS: "Un ID ONCC existe déjà",
  PARCEL_IDENTIFICATION_ID_EXISTS: "Un ID d'identification existe déjà",
  PARCEL_COORDINATES_FAILED: "Échec de la gestion des coordonnées",
  PARCEL_COORDINATES_INVALID: "Coordonnées GPS invalides",
  PARCEL_STATS_FAILED: "Échec de la récupération des statistiques",
  PARCEL_PRODUCER_NOT_FOUND: "Producteur non trouvé",
  PARCEL_PRODUCER_INVALID: "Producteur invalide pour cette parcelle",
  PARCEL_VALIDATION_FAILED: "Échec de la validation des parcelles",
  PARCEL_DUPLICATE_IDENTIFIERS:
    "Certaines parcelles utilisent des identifiants déjà existants",
  PARCEL_REQUIRED_FOR_PRODUCER:
    "Un producteur doit avoir au moins une parcelle",
};

/**
 * Messages de succès en français pour les parcelles
 */
export const ParcelSuccessMessages: Record<ParcelSuccessCode, string> = {
  PARCEL_LIST_SUCCESS: "Liste des parcelles récupérée avec succès",
  PARCEL_FETCH_SUCCESS: "Détails de la parcelle récupérés avec succès",
  PARCEL_CREATED: "Parcelle créée avec succès",
  PARCEL_UPDATED: "Parcelle mise à jour avec succès",
  PARCEL_DELETED: "Parcelle supprimée avec succès",
  PARCEL_ACTIVATED: "Parcelle activée avec succès",
  PARCEL_DEACTIVATED: "Parcelle désactivée avec succès",
  PARCEL_COORDINATES_ADDED: "Coordonnées ajoutées avec succès",
  PARCEL_COORDINATES_UPDATED: "Coordonnées mises à jour avec succès",
  PARCEL_COORDINATES_REMOVED: "Coordonnées supprimées avec succès",
  PARCEL_STATS_SUCCESS: "Statistiques des parcelles récupérées avec succès",
};
