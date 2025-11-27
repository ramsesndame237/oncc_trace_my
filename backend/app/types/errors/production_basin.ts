/**
 * Codes d'erreur spécifiques aux bassins de production
 */
export enum ProductionBasinErrorCodes {
  // Récupération
  LIST_FAILED = 'PRODUCTION_BASIN_LIST_FAILED',
  NOT_FOUND = 'PRODUCTION_BASIN_NOT_FOUND',

  // Création
  CREATE_NOT_AUTHORIZED = 'PRODUCTION_BASIN_CREATE_NOT_AUTHORIZED',
  CREATE_FAILED = 'PRODUCTION_BASIN_CREATE_FAILED',

  // Validation des localisations
  LOCATION_CONFLICTS = 'PRODUCTION_BASIN_LOCATION_CONFLICTS',
  LOCATION_VALIDATION_FAILED = 'PRODUCTION_BASIN_LOCATION_VALIDATION_FAILED',
  REGION_DEPARTMENT_HIERARCHY_CONFLICT = 'PRODUCTION_BASIN_REGION_DEPARTMENT_HIERARCHY_CONFLICT',
  DEPARTMENT_DISTRICT_HIERARCHY_CONFLICT = 'PRODUCTION_BASIN_DEPARTMENT_DISTRICT_HIERARCHY_CONFLICT',
  DISTRICT_PARENT_CONFLICT = 'PRODUCTION_BASIN_DISTRICT_PARENT_CONFLICT', // District → département parent
  DEPARTMENT_PARENT_CONFLICT = 'PRODUCTION_BASIN_DEPARTMENT_PARENT_CONFLICT', // Département → région parente
  DISTRICT_SIBLING_CONFLICT = 'PRODUCTION_BASIN_DISTRICT_SIBLING_CONFLICT', // Deprecated - non utilisé

  // Mise à jour
  UPDATE_FAILED = 'PRODUCTION_BASIN_UPDATE_FAILED',

  // Suppression
  DELETE_NOT_AUTHORIZED = 'PRODUCTION_BASIN_DELETE_NOT_AUTHORIZED',
  DELETE_HAS_USERS = 'PRODUCTION_BASIN_DELETE_HAS_USERS',
  DELETE_FAILED = 'PRODUCTION_BASIN_DELETE_FAILED',

  // Assignation des utilisateurs
  ASSIGN_USERS_NOT_AUTHORIZED = 'PRODUCTION_BASIN_ASSIGN_USERS_NOT_AUTHORIZED',
  ASSIGN_USERS_FAILED = 'PRODUCTION_BASIN_ASSIGN_USERS_FAILED',
  UNASSIGN_USERS_NOT_AUTHORIZED = 'PRODUCTION_BASIN_UNASSIGN_USERS_NOT_AUTHORIZED',
  UNASSIGN_USERS_FAILED = 'PRODUCTION_BASIN_UNASSIGN_USERS_FAILED',

  // Statistiques
  STATS_FAILED = 'PRODUCTION_BASIN_STATS_FAILED',
}

/**
 * Messages d'erreur en français pour les bassins de production
 */
export const ProductionBasinErrorMessages: Record<ProductionBasinErrorCodes, string> = {
  [ProductionBasinErrorCodes.LIST_FAILED]:
    'Erreur lors de la récupération des bassins de production',
  [ProductionBasinErrorCodes.NOT_FOUND]: 'Bassin de production introuvable',
  [ProductionBasinErrorCodes.CREATE_NOT_AUTHORIZED]:
    "Vous n'êtes pas autorisé à créer des bassins de production",
  [ProductionBasinErrorCodes.CREATE_FAILED]: 'Erreur lors de la création du bassin de production',
  [ProductionBasinErrorCodes.LOCATION_CONFLICTS]:
    'Certaines localisations sont déjà associées à des bassins de production',
  [ProductionBasinErrorCodes.LOCATION_VALIDATION_FAILED]:
    'Erreur lors de la validation des localisations',
  [ProductionBasinErrorCodes.REGION_DEPARTMENT_HIERARCHY_CONFLICT]:
    "Impossible d'associer cette région car l'un de ses départements est déjà associé à un autre bassin",
  [ProductionBasinErrorCodes.DEPARTMENT_DISTRICT_HIERARCHY_CONFLICT]:
    "Impossible d'associer ce département car l'un de ses districts est déjà associé à un autre bassin",
  [ProductionBasinErrorCodes.DISTRICT_PARENT_CONFLICT]:
    "Impossible d'associer ce district car son département parent est déjà associé à un autre bassin",
  [ProductionBasinErrorCodes.DEPARTMENT_PARENT_CONFLICT]:
    "Impossible d'associer ce département car sa région parente est déjà associée à un autre bassin",
  [ProductionBasinErrorCodes.DISTRICT_SIBLING_CONFLICT]:
    "Impossible d'associer ce district car son département parent a déjà d'autres districts associés à un autre bassin",
  [ProductionBasinErrorCodes.UPDATE_FAILED]:
    'Erreur lors de la mise à jour du bassin de production',
  [ProductionBasinErrorCodes.DELETE_NOT_AUTHORIZED]:
    "Vous n'êtes pas autorisé à supprimer ce bassin de production",
  [ProductionBasinErrorCodes.DELETE_HAS_USERS]:
    'Impossible de supprimer un bassin de production ayant des utilisateurs assignés',
  [ProductionBasinErrorCodes.DELETE_FAILED]:
    'Erreur lors de la suppression du bassin de production',
  [ProductionBasinErrorCodes.ASSIGN_USERS_NOT_AUTHORIZED]:
    "Vous n'êtes pas autorisé à assigner des utilisateurs à ce bassin",
  [ProductionBasinErrorCodes.ASSIGN_USERS_FAILED]: "Erreur lors de l'assignation des utilisateurs",
  [ProductionBasinErrorCodes.UNASSIGN_USERS_NOT_AUTHORIZED]:
    "Vous n'êtes pas autorisé à désassigner des utilisateurs de ce bassin",
  [ProductionBasinErrorCodes.UNASSIGN_USERS_FAILED]:
    'Erreur lors de la désassignation des utilisateurs',
  [ProductionBasinErrorCodes.STATS_FAILED]:
    'Erreur lors de la récupération des statistiques des bassins de production',
}

/**
 * Codes de succès spécifiques aux bassins de production
 */
export enum ProductionBasinSuccessCodes {
  LIST_SUCCESS = 'PRODUCTION_BASIN_LIST_SUCCESS',
  CREATED = 'PRODUCTION_BASIN_CREATED',
  UPDATED = 'PRODUCTION_BASIN_UPDATED',
  DELETED = 'PRODUCTION_BASIN_DELETED',
  USERS_ASSIGNED = 'PRODUCTION_BASIN_USERS_ASSIGNED',
  USERS_UNASSIGNED = 'PRODUCTION_BASIN_USERS_UNASSIGNED',
  STATS_SUCCESS = 'PRODUCTION_BASIN_STATS_SUCCESS',
}

/**
 * Messages de succès en français pour les bassins de production
 */
export const ProductionBasinSuccessMessages: Record<ProductionBasinSuccessCodes, string> = {
  [ProductionBasinSuccessCodes.LIST_SUCCESS]:
    'Liste des bassins de production récupérée avec succès',
  [ProductionBasinSuccessCodes.CREATED]: 'Bassin de production créé avec succès',
  [ProductionBasinSuccessCodes.UPDATED]: 'Bassin de production mis à jour avec succès',
  [ProductionBasinSuccessCodes.DELETED]: 'Bassin de production supprimé avec succès',
  [ProductionBasinSuccessCodes.USERS_ASSIGNED]: 'Utilisateurs assignés au bassin avec succès',
  [ProductionBasinSuccessCodes.USERS_UNASSIGNED]: 'Utilisateurs désassignés du bassin avec succès',
  [ProductionBasinSuccessCodes.STATS_SUCCESS]: 'Statistiques des bassins récupérées avec succès',
}
