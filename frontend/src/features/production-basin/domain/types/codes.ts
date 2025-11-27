export const ProductionBasinErrorCodes = {
  // Codes spécifiques - Récupération
  PRODUCTION_BASIN_LIST_FAILED: "PRODUCTION_BASIN_LIST_FAILED",
  PRODUCTION_BASIN_NOT_FOUND: "PRODUCTION_BASIN_NOT_FOUND",

  // Codes spécifiques - Création
  PRODUCTION_BASIN_CREATE_NOT_AUTHORIZED: "PRODUCTION_BASIN_CREATE_NOT_AUTHORIZED",
  PRODUCTION_BASIN_CREATE_FAILED: "PRODUCTION_BASIN_CREATE_FAILED",

  // Codes spécifiques - Validation des localisations
  PRODUCTION_BASIN_LOCATION_CONFLICTS: "PRODUCTION_BASIN_LOCATION_CONFLICTS",
  PRODUCTION_BASIN_LOCATION_VALIDATION_FAILED: "PRODUCTION_BASIN_LOCATION_VALIDATION_FAILED",
  PRODUCTION_BASIN_REGION_DEPARTMENT_HIERARCHY_CONFLICT: "PRODUCTION_BASIN_REGION_DEPARTMENT_HIERARCHY_CONFLICT",
  PRODUCTION_BASIN_DEPARTMENT_DISTRICT_HIERARCHY_CONFLICT: "PRODUCTION_BASIN_DEPARTMENT_DISTRICT_HIERARCHY_CONFLICT",

  // Codes spécifiques - Mise à jour
  PRODUCTION_BASIN_UPDATE_FAILED: "PRODUCTION_BASIN_UPDATE_FAILED",

  // Codes spécifiques - Suppression
  PRODUCTION_BASIN_DELETE_NOT_AUTHORIZED: "PRODUCTION_BASIN_DELETE_NOT_AUTHORIZED",
  PRODUCTION_BASIN_DELETE_HAS_USERS: "PRODUCTION_BASIN_DELETE_HAS_USERS",
  PRODUCTION_BASIN_DELETE_FAILED: "PRODUCTION_BASIN_DELETE_FAILED",

  // Codes spécifiques - Assignation des utilisateurs
  PRODUCTION_BASIN_ASSIGN_USERS_NOT_AUTHORIZED: "PRODUCTION_BASIN_ASSIGN_USERS_NOT_AUTHORIZED",
  PRODUCTION_BASIN_ASSIGN_USERS_FAILED: "PRODUCTION_BASIN_ASSIGN_USERS_FAILED",
  PRODUCTION_BASIN_UNASSIGN_USERS_NOT_AUTHORIZED: "PRODUCTION_BASIN_UNASSIGN_USERS_NOT_AUTHORIZED",
  PRODUCTION_BASIN_UNASSIGN_USERS_FAILED: "PRODUCTION_BASIN_UNASSIGN_USERS_FAILED",

  // Codes spécifiques - Statistiques
  PRODUCTION_BASIN_STATS_FAILED: "PRODUCTION_BASIN_STATS_FAILED",
} as const;

export const ProductionBasinSuccessCodes = {
  PRODUCTION_BASIN_LIST_SUCCESS: "PRODUCTION_BASIN_LIST_SUCCESS",
  PRODUCTION_BASIN_CREATED: "PRODUCTION_BASIN_CREATED",
  PRODUCTION_BASIN_UPDATED: "PRODUCTION_BASIN_UPDATED",
  PRODUCTION_BASIN_DELETED: "PRODUCTION_BASIN_DELETED",
  PRODUCTION_BASIN_USERS_ASSIGNED: "PRODUCTION_BASIN_USERS_ASSIGNED",
  PRODUCTION_BASIN_USERS_UNASSIGNED: "PRODUCTION_BASIN_USERS_UNASSIGNED",
  PRODUCTION_BASIN_STATS_SUCCESS: "PRODUCTION_BASIN_STATS_SUCCESS",
} as const;

// Messages d'erreur en français
export const ProductionBasinErrorMessages: Record<string, string> = {
  [ProductionBasinErrorCodes.PRODUCTION_BASIN_LIST_FAILED]: "Erreur lors de la récupération des bassins de production",
  [ProductionBasinErrorCodes.PRODUCTION_BASIN_NOT_FOUND]: "Bassin de production introuvable",
  [ProductionBasinErrorCodes.PRODUCTION_BASIN_CREATE_NOT_AUTHORIZED]: "Vous n'êtes pas autorisé à créer des bassins de production",
  [ProductionBasinErrorCodes.PRODUCTION_BASIN_CREATE_FAILED]: "Erreur lors de la création du bassin de production",
  [ProductionBasinErrorCodes.PRODUCTION_BASIN_LOCATION_CONFLICTS]: "Certaines localisations sont déjà associées à des bassins de production",
  [ProductionBasinErrorCodes.PRODUCTION_BASIN_LOCATION_VALIDATION_FAILED]: "Erreur lors de la validation des localisations",
  [ProductionBasinErrorCodes.PRODUCTION_BASIN_REGION_DEPARTMENT_HIERARCHY_CONFLICT]: "Impossible d'associer cette région car l'un de ses départements est déjà associé à un autre bassin",
  [ProductionBasinErrorCodes.PRODUCTION_BASIN_DEPARTMENT_DISTRICT_HIERARCHY_CONFLICT]: "Impossible d'associer ce département car l'un de ses districts est déjà associé à un autre bassin",
  [ProductionBasinErrorCodes.PRODUCTION_BASIN_UPDATE_FAILED]: "Erreur lors de la mise à jour du bassin de production",
  [ProductionBasinErrorCodes.PRODUCTION_BASIN_DELETE_NOT_AUTHORIZED]: "Vous n'êtes pas autorisé à supprimer ce bassin de production",
  [ProductionBasinErrorCodes.PRODUCTION_BASIN_DELETE_HAS_USERS]: "Impossible de supprimer un bassin de production ayant des utilisateurs assignés",
  [ProductionBasinErrorCodes.PRODUCTION_BASIN_DELETE_FAILED]: "Erreur lors de la suppression du bassin de production",
  [ProductionBasinErrorCodes.PRODUCTION_BASIN_ASSIGN_USERS_NOT_AUTHORIZED]: "Vous n'êtes pas autorisé à assigner des utilisateurs à ce bassin",
  [ProductionBasinErrorCodes.PRODUCTION_BASIN_ASSIGN_USERS_FAILED]: "Erreur lors de l'assignation des utilisateurs",
  [ProductionBasinErrorCodes.PRODUCTION_BASIN_UNASSIGN_USERS_NOT_AUTHORIZED]: "Vous n'êtes pas autorisé à désassigner des utilisateurs de ce bassin",
  [ProductionBasinErrorCodes.PRODUCTION_BASIN_UNASSIGN_USERS_FAILED]: "Erreur lors de la désassignation des utilisateurs",
  [ProductionBasinErrorCodes.PRODUCTION_BASIN_STATS_FAILED]: "Erreur lors de la récupération des statistiques des bassins de production",
};

// Messages de succès en français
export const ProductionBasinSuccessMessages: Record<string, string> = {
  [ProductionBasinSuccessCodes.PRODUCTION_BASIN_LIST_SUCCESS]: "Liste des bassins de production récupérée avec succès",
  [ProductionBasinSuccessCodes.PRODUCTION_BASIN_CREATED]: "Bassin de production créé avec succès",
  [ProductionBasinSuccessCodes.PRODUCTION_BASIN_UPDATED]: "Bassin de production mis à jour avec succès",
  [ProductionBasinSuccessCodes.PRODUCTION_BASIN_DELETED]: "Bassin de production supprimé avec succès",
  [ProductionBasinSuccessCodes.PRODUCTION_BASIN_USERS_ASSIGNED]: "Utilisateurs assignés au bassin avec succès",
  [ProductionBasinSuccessCodes.PRODUCTION_BASIN_USERS_UNASSIGNED]: "Utilisateurs désassignés du bassin avec succès",
  [ProductionBasinSuccessCodes.PRODUCTION_BASIN_STATS_SUCCESS]: "Statistiques des bassins récupérées avec succès",
};

export type ProductionBasinErrorCode = keyof typeof ProductionBasinErrorCodes;
export type ProductionBasinSuccessCode = keyof typeof ProductionBasinSuccessCodes;
