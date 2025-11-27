/**
 * Codes d'erreur spécifiques aux magasins
 */
export enum StoreErrorCodes {
  // Erreurs de récupération des données
  STORES_LIST_FAILED = 'STORES_LIST_FAILED',
  STORE_NOT_FOUND = 'STORE_NOT_FOUND',
  STORE_ID_REQUIRED = 'STORE_ID_REQUIRED',
  STORE_DETAILS_FAILED = 'STORE_DETAILS_FAILED',
  STORE_STATS_FAILED = 'STORE_STATS_FAILED',
  
  // Erreurs de manipulation des données
  STORE_CREATE_FAILED = 'STORE_CREATE_FAILED',
  STORE_UPDATE_FAILED = 'STORE_UPDATE_FAILED',
  STORE_DELETE_FAILED = 'STORE_DELETE_FAILED',
  STORE_CODE_EXISTS = 'STORE_CODE_EXISTS',
  
  // Erreurs d'autorisation
  STORE_NOT_AUTHORIZED = 'STORE_NOT_AUTHORIZED',
  
  // Erreurs d'activation/désactivation
  STORE_ACTIVATION_FAILED = 'STORE_ACTIVATION_FAILED',
  STORE_DEACTIVATION_FAILED = 'STORE_DEACTIVATION_FAILED',
  STORE_ALREADY_ACTIVE = 'STORE_ALREADY_ACTIVE',
  STORE_ALREADY_INACTIVE = 'STORE_ALREADY_INACTIVE',
  
  // Erreurs de synchronisation
  STORE_SYNC_FAILED = 'STORE_SYNC_FAILED',
  STORE_OFFLINE_CONFLICT = 'STORE_OFFLINE_CONFLICT',
}

/**
 * Codes de succès spécifiques aux magasins
 */
export enum StoreSuccessCodes {
  // Succès de récupération des données
  STORES_LIST_SUCCESS = 'STORES_LIST_SUCCESS',
  STORE_DETAILS_SUCCESS = 'STORE_DETAILS_SUCCESS',
  STORE_STATS_SUCCESS = 'STORE_STATS_SUCCESS',
  
  // Succès de manipulation des données
  STORE_CREATED = 'STORE_CREATED',
  STORE_UPDATED = 'STORE_UPDATED',
  STORE_DELETED = 'STORE_DELETED',
  STORE_STATUS_UPDATED = 'STORE_STATUS_UPDATED',
  
  // Succès d'activation/désactivation
  STORE_ACTIVATED = 'STORE_ACTIVATED',
  STORE_DEACTIVATED = 'STORE_DEACTIVATED',
  
  // Succès de synchronisation
  STORES_SYNC_SUCCESS = 'STORES_SYNC_SUCCESS',
}


// ======================= MESSAGES D'ERREUR =======================

/**
 * Messages d'erreur en français pour les magasins
 */
export const StoreErrorMessages: Record<StoreErrorCodes, string> = {
  // Erreurs de récupération des données
  [StoreErrorCodes.STORES_LIST_FAILED]: "Échec de la récupération de la liste des magasins.",
  [StoreErrorCodes.STORE_NOT_FOUND]: "Le magasin est introuvable.",
  [StoreErrorCodes.STORE_ID_REQUIRED]: "L'identifiant du magasin est requis.",
  [StoreErrorCodes.STORE_DETAILS_FAILED]: "Échec de la récupération des détails du magasin.",
  [StoreErrorCodes.STORE_STATS_FAILED]: "Échec de la récupération des statistiques des magasins.",
  
  // Erreurs de manipulation des données
  [StoreErrorCodes.STORE_CREATE_FAILED]: "Échec de la création du magasin.",
  [StoreErrorCodes.STORE_UPDATE_FAILED]: "Échec de la mise à jour du magasin.",
  [StoreErrorCodes.STORE_DELETE_FAILED]: "Échec de la suppression du magasin.",
  [StoreErrorCodes.STORE_CODE_EXISTS]: "Ce code de magasin existe déjà.",
  
  // Erreurs d'autorisation
  [StoreErrorCodes.STORE_NOT_AUTHORIZED]: "Vous n'êtes pas autorisé à effectuer cette action sur ce magasin.",
  
  // Erreurs d'activation/désactivation
  [StoreErrorCodes.STORE_ACTIVATION_FAILED]: "Échec de l'activation du magasin.",
  [StoreErrorCodes.STORE_DEACTIVATION_FAILED]: "Échec de la désactivation du magasin.",
  [StoreErrorCodes.STORE_ALREADY_ACTIVE]: "Le magasin est déjà actif pour cette campagne.",
  [StoreErrorCodes.STORE_ALREADY_INACTIVE]: "Le magasin est déjà inactif pour cette campagne.",
  
  // Erreurs de synchronisation
  [StoreErrorCodes.STORE_SYNC_FAILED]: "Échec de la synchronisation du magasin.",
  [StoreErrorCodes.STORE_OFFLINE_CONFLICT]: "Conflit de données hors ligne pour le magasin.",
};

/**
 * Messages de succès en français pour les magasins
 */
export const StoreSuccessMessages: Record<StoreSuccessCodes, string> = {
  // Succès de récupération des données
  [StoreSuccessCodes.STORES_LIST_SUCCESS]: "Liste des magasins récupérée avec succès.",
  [StoreSuccessCodes.STORE_DETAILS_SUCCESS]: "Détails du magasin récupérés avec succès.",
  [StoreSuccessCodes.STORE_STATS_SUCCESS]: "Statistiques des magasins récupérées avec succès.",
  
  // Succès de manipulation des données
  [StoreSuccessCodes.STORE_CREATED]: "Magasin créé avec succès.",
  [StoreSuccessCodes.STORE_UPDATED]: "Magasin mis à jour avec succès.",
  [StoreSuccessCodes.STORE_DELETED]: "Magasin supprimé avec succès.",
  [StoreSuccessCodes.STORE_STATUS_UPDATED]: "Statut du magasin mis à jour avec succès.",
  
  // Succès d'activation/désactivation
  [StoreSuccessCodes.STORE_ACTIVATED]: "Magasin activé avec succès pour la campagne en cours.",
  [StoreSuccessCodes.STORE_DEACTIVATED]: "Magasin désactivé avec succès pour la campagne en cours.",
  
  // Succès de synchronisation
  [StoreSuccessCodes.STORES_SYNC_SUCCESS]: "Synchronisation des magasins réussie.",
};

/**
 * Union de tous les codes d'erreur du domaine Store
 */
export type StoreRelatedErrorCodes = StoreErrorCodes;

/**
 * Union de tous les codes de succès du domaine Store
 */
export type StoreRelatedSuccessCodes = StoreSuccessCodes;