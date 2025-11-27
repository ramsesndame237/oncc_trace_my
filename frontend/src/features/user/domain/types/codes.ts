export const UserErrorCodes = {
  // Codes génériques
  USER_NOT_FOUND: "USER_NOT_FOUND",
  USER_LIST_ERROR: "USER_LIST_ERROR",
  USER_CREATE_ERROR: "USER_CREATE_ERROR",
  USER_UPDATE_ERROR: "USER_UPDATE_ERROR",
  USER_DELETE_ERROR: "USER_DELETE_ERROR",
  USER_FETCH_ERROR: "USER_FETCH_ERROR",
  USER_VALIDATION_ERROR: "USER_VALIDATION_ERROR",
  USER_PERMISSION_ERROR: "USER_PERMISSION_ERROR",

  // Codes spécifiques - Création
  USER_CREATE_EMAIL_EXISTS: "USER_CREATE_EMAIL_EXISTS",
  USER_CREATE_PSEUDO_EXISTS: "USER_CREATE_PSEUDO_EXISTS",
  USER_CREATE_BASSIN_NOT_FOUND: "USER_CREATE_BASSIN_NOT_FOUND",
  USER_CREATE_BASSIN_REQUIRED: "USER_CREATE_BASSIN_REQUIRED",
  USER_CREATE_EMAIL_SEND_FAILED: "USER_CREATE_EMAIL_SEND_FAILED",
  USER_CREATE_FAILED: "USER_CREATE_FAILED",

  // Codes spécifiques - Récupération
  USER_LIST_FAILED: "USER_LIST_FAILED",

  // Codes spécifiques - Mise à jour
  USER_UPDATE_EMAIL_EXISTS: "USER_UPDATE_EMAIL_EXISTS",
  USER_UPDATE_PSEUDO_EXISTS: "USER_UPDATE_PSEUDO_EXISTS",
  USER_UPDATE_NOT_AUTHORIZED: "USER_UPDATE_NOT_AUTHORIZED",
  USER_UPDATE_FAILED: "USER_UPDATE_FAILED",

  // Codes spécifiques - Statut
  USER_STATUS_UPDATE_INVALID: "USER_STATUS_UPDATE_INVALID",
  USER_STATUS_UPDATE_FAILED: "USER_STATUS_UPDATE_FAILED",

  // Codes spécifiques - Suppression
  USER_DELETE_NOT_AUTHORIZED: "USER_DELETE_NOT_AUTHORIZED",
  USER_DELETE_FAILED: "USER_DELETE_FAILED",

  // Codes spécifiques - Réinitialisation mot de passe
  USER_PASSWORD_RESET_FAILED: "USER_PASSWORD_RESET_FAILED",
  USER_PASSWORD_RESET_EMAIL_SEND_FAILED: "USER_PASSWORD_RESET_EMAIL_SEND_FAILED",

  // Codes spécifiques - Audit
  USER_AUDIT_HISTORY_FAILED: "USER_AUDIT_HISTORY_FAILED",
} as const;

export const UserSuccessCodes = {
  USER_LIST_SUCCESS: "USER_LIST_SUCCESS",
  USER_FETCH_SUCCESS: "USER_FETCH_SUCCESS",
  USER_CREATE_SUCCESS: "USER_CREATE_SUCCESS",
  USER_UPDATE_SUCCESS: "USER_UPDATE_SUCCESS",
  USER_DELETE_SUCCESS: "USER_DELETE_SUCCESS",
  USER_CREATED: "USER_CREATED",
  USER_UPDATED: "USER_UPDATED",
  USER_STATUS_UPDATED: "USER_STATUS_UPDATED",
  USER_PASSWORD_RESET: "USER_PASSWORD_RESET",
  USER_DELETED: "USER_DELETED",
  USER_DETAILS_SUCCESS: "USER_DETAILS_SUCCESS",
  USER_AUDIT_HISTORY_SUCCESS: "USER_AUDIT_HISTORY_SUCCESS",
} as const;

// Messages d'erreur en français
export const UserErrorMessages: Record<string, string> = {
  // Codes génériques
  [UserErrorCodes.USER_NOT_FOUND]: "Utilisateur introuvable",
  [UserErrorCodes.USER_LIST_ERROR]: "Erreur lors de la récupération des utilisateurs",
  [UserErrorCodes.USER_CREATE_ERROR]: "Erreur lors de la création de l'utilisateur",
  [UserErrorCodes.USER_UPDATE_ERROR]: "Erreur lors de la mise à jour de l'utilisateur",
  [UserErrorCodes.USER_DELETE_ERROR]: "Erreur lors de la suppression de l'utilisateur",
  [UserErrorCodes.USER_FETCH_ERROR]: "Erreur lors de la récupération de l'utilisateur",
  [UserErrorCodes.USER_VALIDATION_ERROR]: "Erreur de validation",
  [UserErrorCodes.USER_PERMISSION_ERROR]: "Permissions insuffisantes",

  // Codes spécifiques - Création
  [UserErrorCodes.USER_CREATE_EMAIL_EXISTS]: "Un utilisateur avec cet email existe déjà",
  [UserErrorCodes.USER_CREATE_PSEUDO_EXISTS]: "Un utilisateur avec ce pseudo existe déjà",
  [UserErrorCodes.USER_CREATE_BASSIN_NOT_FOUND]: "Bassin de production introuvable",
  [UserErrorCodes.USER_CREATE_BASSIN_REQUIRED]: "Un bassin de production est requis pour ce rôle",
  [UserErrorCodes.USER_CREATE_EMAIL_SEND_FAILED]: "Erreur lors de l'envoi de l'email de bienvenue",
  [UserErrorCodes.USER_CREATE_FAILED]: "Erreur lors de la création de l'utilisateur",

  // Codes spécifiques - Récupération
  [UserErrorCodes.USER_LIST_FAILED]: "Erreur lors de la récupération des utilisateurs",

  // Codes spécifiques - Mise à jour
  [UserErrorCodes.USER_UPDATE_EMAIL_EXISTS]: "Un autre utilisateur utilise déjà cet email",
  [UserErrorCodes.USER_UPDATE_PSEUDO_EXISTS]: "Un autre utilisateur utilise déjà ce pseudo",
  [UserErrorCodes.USER_UPDATE_NOT_AUTHORIZED]: "Vous n'êtes pas autorisé à modifier cet utilisateur",
  [UserErrorCodes.USER_UPDATE_FAILED]: "Erreur lors de la mise à jour de l'utilisateur",

  // Codes spécifiques - Statut
  [UserErrorCodes.USER_STATUS_UPDATE_INVALID]: "Statut invalide",
  [UserErrorCodes.USER_STATUS_UPDATE_FAILED]: "Erreur lors de la mise à jour du statut",

  // Codes spécifiques - Suppression
  [UserErrorCodes.USER_DELETE_NOT_AUTHORIZED]: "Vous n'êtes pas autorisé à supprimer cet utilisateur",
  [UserErrorCodes.USER_DELETE_FAILED]: "Erreur lors de la suppression de l'utilisateur",

  // Codes spécifiques - Réinitialisation mot de passe
  [UserErrorCodes.USER_PASSWORD_RESET_FAILED]: "Erreur lors de la réinitialisation du mot de passe",
  [UserErrorCodes.USER_PASSWORD_RESET_EMAIL_SEND_FAILED]: "Erreur lors de l'envoi de l'email de réinitialisation",

  // Codes spécifiques - Audit
  [UserErrorCodes.USER_AUDIT_HISTORY_FAILED]: "Erreur lors de la récupération de l'historique d'audit",
};

// Messages de succès en français
export const UserSuccessMessages: Record<string, string> = {
  [UserSuccessCodes.USER_LIST_SUCCESS]: "Liste des utilisateurs récupérée avec succès",
  [UserSuccessCodes.USER_FETCH_SUCCESS]: "Utilisateur récupéré avec succès",
  [UserSuccessCodes.USER_CREATE_SUCCESS]: "Utilisateur créé avec succès",
  [UserSuccessCodes.USER_UPDATE_SUCCESS]: "Utilisateur mis à jour avec succès",
  [UserSuccessCodes.USER_DELETE_SUCCESS]: "Utilisateur supprimé avec succès",
  [UserSuccessCodes.USER_CREATED]: "Utilisateur créé avec succès",
  [UserSuccessCodes.USER_UPDATED]: "Utilisateur mis à jour avec succès",
  [UserSuccessCodes.USER_STATUS_UPDATED]: "Statut utilisateur mis à jour avec succès",
  [UserSuccessCodes.USER_PASSWORD_RESET]: "Mot de passe utilisateur réinitialisé avec succès",
  [UserSuccessCodes.USER_DELETED]: "Utilisateur supprimé avec succès",
  [UserSuccessCodes.USER_DETAILS_SUCCESS]: "Détails de l'utilisateur récupérés avec succès",
  [UserSuccessCodes.USER_AUDIT_HISTORY_SUCCESS]: "Historique d'audit récupéré avec succès",
};

export type UserErrorCode = keyof typeof UserErrorCodes;
export type UserSuccessCode = keyof typeof UserSuccessCodes;