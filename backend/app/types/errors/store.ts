/**
 * Codes d'erreur spécifiques aux magasins
 */
export enum StoreErrorCodes {
  STORE_NOT_FOUND = 'STORE_NOT_FOUND',
  STORE_ID_REQUIRED = 'STORE_ID_REQUIRED',
  STORES_LIST_FAILED = 'STORES_LIST_FAILED',
  STORE_DETAILS_FAILED = 'STORE_DETAILS_FAILED',
  STORE_STATS_FAILED = 'STORE_STATS_FAILED',
  STORE_CREATE_FAILED = 'STORE_CREATE_FAILED',
  STORE_UPDATE_FAILED = 'STORE_UPDATE_FAILED',
  STORE_DELETE_FAILED = 'STORE_DELETE_FAILED',
  STORE_CODE_EXISTS = 'STORE_CODE_EXISTS',
  STORE_NOT_AUTHORIZED = 'STORE_NOT_AUTHORIZED',
  STORE_ACTIVATION_FAILED = 'STORE_ACTIVATION_FAILED',
  STORE_DEACTIVATION_FAILED = 'STORE_DEACTIVATION_FAILED',
  STORE_ALREADY_ACTIVE = 'STORE_ALREADY_ACTIVE',
  STORE_ALREADY_INACTIVE = 'STORE_ALREADY_INACTIVE',
  LOCATION_NOT_FOUND = 'LOCATION_NOT_FOUND',
  STORE_OCCUPANT_ADD_FAILED = 'STORE_OCCUPANT_ADD_FAILED',
  STORE_OCCUPANT_REMOVE_FAILED = 'STORE_OCCUPANT_REMOVE_FAILED',
  STORE_OCCUPANTS_FETCH_FAILED = 'STORE_OCCUPANTS_FETCH_FAILED',
}

/**
 * Messages d'erreur en français pour les magasins
 */
export const StoreErrorMessages: Record<StoreErrorCodes, string> = {
  [StoreErrorCodes.STORE_NOT_FOUND]: 'Le magasin est introuvable.',
  [StoreErrorCodes.STORE_ID_REQUIRED]: "L'identifiant du magasin est requis.",
  [StoreErrorCodes.STORES_LIST_FAILED]: 'Échec de la récupération de la liste des magasins.',
  [StoreErrorCodes.STORE_DETAILS_FAILED]: 'Échec de la récupération des détails du magasin.',
  [StoreErrorCodes.STORE_STATS_FAILED]: 'Échec de la récupération des statistiques des magasins.',
  [StoreErrorCodes.STORE_CREATE_FAILED]: 'Échec de la création du magasin.',
  [StoreErrorCodes.STORE_UPDATE_FAILED]: 'Échec de la mise à jour du magasin.',
  [StoreErrorCodes.STORE_DELETE_FAILED]: 'Échec de la suppression du magasin.',
  [StoreErrorCodes.STORE_CODE_EXISTS]: 'Ce code de magasin existe déjà.',
  [StoreErrorCodes.STORE_NOT_AUTHORIZED]:
    "Vous n'êtes pas autorisé à effectuer cette action sur ce magasin.",
  [StoreErrorCodes.STORE_ACTIVATION_FAILED]: "Échec de l'activation du magasin.",
  [StoreErrorCodes.STORE_DEACTIVATION_FAILED]: 'Échec de la désactivation du magasin.',
  [StoreErrorCodes.STORE_ALREADY_ACTIVE]: 'Le magasin est déjà actif pour cette campagne.',
  [StoreErrorCodes.STORE_ALREADY_INACTIVE]: 'Le magasin est déjà inactif pour cette campagne.',
  [StoreErrorCodes.LOCATION_NOT_FOUND]: 'La localisation est introuvable.',
  [StoreErrorCodes.STORE_OCCUPANT_ADD_FAILED]: "Échec de l'ajout de l'occupant au magasin.",
  [StoreErrorCodes.STORE_OCCUPANT_REMOVE_FAILED]: "Échec du retrait de l'occupant du magasin.",
  [StoreErrorCodes.STORE_OCCUPANTS_FETCH_FAILED]:
    'Échec de la récupération des occupants du magasin.',
}

/**
 * Codes de succès spécifiques aux magasins
 */
export enum StoreSuccessCodes {
  STORES_LIST_SUCCESS = 'STORES_LIST_SUCCESS',
  STORE_DETAILS_SUCCESS = 'STORE_DETAILS_SUCCESS',
  STORE_STATS_SUCCESS = 'STORE_STATS_SUCCESS',
  STORE_CREATED = 'STORE_CREATED',
  STORE_UPDATED = 'STORE_UPDATED',
  STORE_DELETED = 'STORE_DELETED',
  STORE_STATUS_UPDATED = 'STORE_STATUS_UPDATED',
  STORE_ACTIVATED = 'STORE_ACTIVATED',
  STORE_DEACTIVATED = 'STORE_DEACTIVATED',
  STORE_OCCUPANT_ADDED = 'STORE_OCCUPANT_ADDED',
  STORE_OCCUPANT_REMOVED = 'STORE_OCCUPANT_REMOVED',
  STORE_OCCUPANTS_FETCH_SUCCESS = 'STORE_OCCUPANTS_FETCH_SUCCESS',
}

/**
 * Messages de succès en français pour les magasins
 */
export const StoreSuccessMessages: Record<StoreSuccessCodes, string> = {
  [StoreSuccessCodes.STORES_LIST_SUCCESS]: 'Liste des magasins récupérée avec succès.',
  [StoreSuccessCodes.STORE_DETAILS_SUCCESS]: 'Détails du magasin récupérés avec succès.',
  [StoreSuccessCodes.STORE_STATS_SUCCESS]: 'Statistiques des magasins récupérées avec succès.',
  [StoreSuccessCodes.STORE_CREATED]: 'Magasin créé avec succès.',
  [StoreSuccessCodes.STORE_UPDATED]: 'Magasin mis à jour avec succès.',
  [StoreSuccessCodes.STORE_DELETED]: 'Magasin supprimé avec succès.',
  [StoreSuccessCodes.STORE_STATUS_UPDATED]: 'Statut du magasin mis à jour avec succès.',
  [StoreSuccessCodes.STORE_ACTIVATED]: 'Magasin activé avec succès pour la campagne en cours.',
  [StoreSuccessCodes.STORE_DEACTIVATED]: 'Magasin désactivé avec succès pour la campagne en cours.',
  [StoreSuccessCodes.STORE_OCCUPANT_ADDED]: 'Occupant ajouté avec succès au magasin.',
  [StoreSuccessCodes.STORE_OCCUPANT_REMOVED]: 'Occupant retiré avec succès du magasin.',
  [StoreSuccessCodes.STORE_OCCUPANTS_FETCH_SUCCESS]:
    'Liste des occupants récupérée avec succès.',
}
