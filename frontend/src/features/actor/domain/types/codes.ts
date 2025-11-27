// ===== ACTORS =====
export const ActorErrorCodes = {
  ACTOR_NOT_FOUND: "ACTOR_NOT_FOUND",
  ACTOR_LIST_FAILED: "ACTOR_LIST_FAILED",
  ACTOR_CREATION_FAILED: "ACTOR_CREATION_FAILED",
  ACTOR_UPDATE_FAILED: "ACTOR_UPDATE_FAILED",
  ACTOR_DELETION_FAILED: "ACTOR_DELETION_FAILED",
  ACTOR_ACTIVATION_FAILED: "ACTOR_ACTIVATION_FAILED",
  ACTOR_DEACTIVATION_FAILED: "ACTOR_DEACTIVATION_FAILED",
  ACTOR_STATUS_UPDATE_FAILED: "ACTOR_STATUS_UPDATE_FAILED",
  ACTOR_NOT_AUTHORIZED: "ACTOR_NOT_AUTHORIZED",
  ACTOR_ONCC_ID_EXISTS: "ACTOR_ONCC_ID_EXISTS",
  ACTOR_IDENTIFIANT_EXISTS: "ACTOR_IDENTIFIANT_EXISTS",
  ACTOR_ALREADY_ACTIVE: "ACTOR_ALREADY_ACTIVE",
  ACTOR_ALREADY_INACTIVE: "ACTOR_ALREADY_INACTIVE",
  ACTOR_HAS_USERS: "ACTOR_HAS_USERS",
  ACTOR_MANAGER_INFO_REQUIRED: "ACTOR_MANAGER_INFO_REQUIRED",
  ACTOR_INVALID_STATUS: "ACTOR_INVALID_STATUS",
  ACTOR_EMAIL_OR_PHONE_REQUIRED: "ACTOR_EMAIL_OR_PHONE_REQUIRED",
} as const;

export const ActorSuccessCodes = {
  ACTOR_LIST_SUCCESS: "ACTOR_LIST_SUCCESS",
  ACTOR_FETCH_SUCCESS: "ACTOR_FETCH_SUCCESS",
  ACTOR_CREATED: "ACTOR_CREATED",
  ACTOR_UPDATED: "ACTOR_UPDATED",
  ACTOR_DELETED: "ACTOR_DELETED",
  ACTOR_ACTIVATED: "ACTOR_ACTIVATED",
  ACTOR_DEACTIVATED: "ACTOR_DEACTIVATED",
  ACTOR_STATUS_UPDATED: "ACTOR_STATUS_UPDATED",
} as const;

// ===== PARCELS =====
export const ParcelErrorCodes = {
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
} as const;

export const ParcelSuccessCodes = {
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


export type ActorErrorCode = keyof typeof ActorErrorCodes;
export type ActorSuccessCode = keyof typeof ActorSuccessCodes;

export type ParcelErrorCode = keyof typeof ParcelErrorCodes;
export type ParcelSuccessCode = keyof typeof ParcelSuccessCodes;

/**
 * Messages d'erreur en français pour les acteurs
 */
export const ActorErrorMessages: Record<ActorErrorCode, string> = {
  ACTOR_NOT_FOUND: "L'acteur est introuvable",
  ACTOR_LIST_FAILED: "Échec de la récupération de la liste des acteurs",
  ACTOR_CREATION_FAILED: "Échec de la création de l'acteur",
  ACTOR_UPDATE_FAILED: "Échec de la mise à jour de l'acteur",
  ACTOR_DELETION_FAILED: "Échec de la suppression de l'acteur",
  ACTOR_ACTIVATION_FAILED: "Échec de l'activation de l'acteur",
  ACTOR_DEACTIVATION_FAILED: "Échec de la désactivation de l'acteur",
  ACTOR_STATUS_UPDATE_FAILED: "Échec de la mise à jour du statut de l'acteur",
  ACTOR_NOT_AUTHORIZED: "Vous n'êtes pas autorisé à accéder à cet acteur",
  ACTOR_ONCC_ID_EXISTS: "Un acteur avec cet identifiant ONCC existe déjà",
  ACTOR_IDENTIFIANT_EXISTS: "Un acteur avec cet identifiant unique existe déjà",
  ACTOR_ALREADY_ACTIVE: "L'acteur est déjà actif",
  ACTOR_ALREADY_INACTIVE: "L'acteur est déjà inactif",
  ACTOR_HAS_USERS: "Impossible de supprimer cet acteur car il a des utilisateurs associés",
  ACTOR_MANAGER_INFO_REQUIRED: "Les informations du gestionnaire sont requises",
  ACTOR_INVALID_STATUS: "Statut d'acteur invalide",
  ACTOR_EMAIL_OR_PHONE_REQUIRED: "Au moins l'email ou le numéro de téléphone doit être renseigné",
};

/**
 * Messages de succès en français pour les acteurs
 */
export const ActorSuccessMessages: Record<ActorSuccessCode, string> = {
  ACTOR_LIST_SUCCESS: "Liste des acteurs récupérée avec succès",
  ACTOR_FETCH_SUCCESS: "Détails de l'acteur récupérés avec succès",
  ACTOR_CREATED: "Acteur créé avec succès",
  ACTOR_UPDATED: "Acteur mis à jour avec succès",
  ACTOR_DELETED: "Acteur supprimé avec succès",
  ACTOR_ACTIVATED: "Acteur activé avec succès",
  ACTOR_DEACTIVATED: "Acteur désactivé avec succès",
  ACTOR_STATUS_UPDATED: "Statut de l'acteur mis à jour avec succès",
};