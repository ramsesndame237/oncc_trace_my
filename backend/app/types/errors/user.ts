/**
 * Codes d'erreur spécifiques aux utilisateurs
 */
export enum UserErrorCodes {
  // Création
  CREATE_EMAIL_EXISTS = 'USER_CREATE_EMAIL_EXISTS',
  CREATE_PSEUDO_EXISTS = 'USER_CREATE_PSEUDO_EXISTS',
  CREATE_BASSIN_NOT_FOUND = 'USER_CREATE_BASSIN_NOT_FOUND',
  CREATE_BASSIN_REQUIRED = 'USER_CREATE_BASSIN_REQUIRED',
  CREATE_EMAIL_SEND_FAILED = 'USER_CREATE_EMAIL_SEND_FAILED',
  CREATE_FAILED = 'USER_CREATE_FAILED',

  // Récupération
  NOT_FOUND = 'USER_NOT_FOUND',
  LIST_FAILED = 'USER_LIST_FAILED',

  // Mise à jour
  UPDATE_EMAIL_EXISTS = 'USER_UPDATE_EMAIL_EXISTS',
  UPDATE_PSEUDO_EXISTS = 'USER_UPDATE_PSEUDO_EXISTS',
  UPDATE_NOT_AUTHORIZED = 'USER_UPDATE_NOT_AUTHORIZED',
  UPDATE_ACTOR_MANAGER_RESTRICTED = 'USER_UPDATE_ACTOR_MANAGER_RESTRICTED',
  UPDATE_FAILED = 'USER_UPDATE_FAILED',

  // Statut
  STATUS_UPDATE_INVALID = 'USER_STATUS_UPDATE_INVALID',
  STATUS_UPDATE_FAILED = 'USER_STATUS_UPDATE_FAILED',

  // Suppression
  DELETE_NOT_AUTHORIZED = 'USER_DELETE_NOT_AUTHORIZED',
  DELETE_FAILED = 'USER_DELETE_FAILED',

  // Réinitialisation mot de passe
  PASSWORD_RESET_FAILED = 'USER_PASSWORD_RESET_FAILED',
  PASSWORD_RESET_EMAIL_SEND_FAILED = 'USER_PASSWORD_RESET_EMAIL_SEND_FAILED',

  // Audit
  AUDIT_HISTORY_FAILED = 'USER_AUDIT_HISTORY_FAILED',
}

/**
 * Messages d'erreur en français pour les utilisateurs
 */
export const UserErrorMessages: Record<UserErrorCodes, string> = {
  // Création
  [UserErrorCodes.CREATE_EMAIL_EXISTS]: 'Un utilisateur avec cet email existe déjà',
  [UserErrorCodes.CREATE_PSEUDO_EXISTS]: 'Un utilisateur avec ce pseudo existe déjà',
  [UserErrorCodes.CREATE_BASSIN_NOT_FOUND]: 'Bassin de production introuvable',
  [UserErrorCodes.CREATE_BASSIN_REQUIRED]: 'Un bassin de production est requis pour ce rôle',
  [UserErrorCodes.CREATE_EMAIL_SEND_FAILED]: "Erreur lors de l'envoi de l'email de bienvenue",
  [UserErrorCodes.CREATE_FAILED]: "Erreur lors de la création de l'utilisateur",

  // Récupération
  [UserErrorCodes.NOT_FOUND]: 'Utilisateur introuvable',
  [UserErrorCodes.LIST_FAILED]: 'Erreur lors de la récupération des utilisateurs',

  // Mise à jour
  [UserErrorCodes.UPDATE_EMAIL_EXISTS]: 'Un autre utilisateur utilise déjà cet email',
  [UserErrorCodes.UPDATE_PSEUDO_EXISTS]: 'Un autre utilisateur utilise déjà ce pseudo',
  [UserErrorCodes.UPDATE_NOT_AUTHORIZED]: "Vous n'êtes pas autorisé à modifier cet utilisateur",
  [UserErrorCodes.UPDATE_ACTOR_MANAGER_RESTRICTED]:
    "Le rôle et la position d'un gestionnaire d'acteur ne peuvent pas être modifiés",
  [UserErrorCodes.UPDATE_FAILED]: "Erreur lors de la mise à jour de l'utilisateur",

  // Statut
  [UserErrorCodes.STATUS_UPDATE_INVALID]: 'Statut invalide',
  [UserErrorCodes.STATUS_UPDATE_FAILED]: 'Erreur lors de la mise à jour du statut',

  // Suppression
  [UserErrorCodes.DELETE_NOT_AUTHORIZED]: "Vous n'êtes pas autorisé à supprimer cet utilisateur",
  [UserErrorCodes.DELETE_FAILED]: "Erreur lors de la suppression de l'utilisateur",

  // Réinitialisation
  [UserErrorCodes.PASSWORD_RESET_FAILED]: 'Erreur lors de la réinitialisation du mot de passe',
  [UserErrorCodes.PASSWORD_RESET_EMAIL_SEND_FAILED]:
    "Erreur lors de l'envoi de l'email de réinitialisation",

  // Audit
  [UserErrorCodes.AUDIT_HISTORY_FAILED]: "Erreur lors de la récupération de l'historique d'audit",
}

/**
 * Codes de succès spécifiques aux utilisateurs
 */
export enum UserSuccessCodes {
  CREATED = 'USER_CREATED',
  UPDATED = 'USER_UPDATED',
  STATUS_UPDATED = 'USER_STATUS_UPDATED',
  PASSWORD_RESET = 'USER_PASSWORD_RESET',
  DELETED = 'USER_DELETED',
  LIST_SUCCESS = 'USER_LIST_SUCCESS',
  DETAILS_SUCCESS = 'USER_DETAILS_SUCCESS',
  AUDIT_HISTORY_SUCCESS = 'USER_AUDIT_HISTORY_SUCCESS',
}

/**
 * Messages de succès en français pour les utilisateurs
 */
export const UserSuccessMessages: Record<UserSuccessCodes, string> = {
  [UserSuccessCodes.CREATED]: 'Utilisateur créé avec succès',
  [UserSuccessCodes.UPDATED]: 'Utilisateur mis à jour avec succès',
  [UserSuccessCodes.STATUS_UPDATED]: 'Statut utilisateur mis à jour avec succès',
  [UserSuccessCodes.PASSWORD_RESET]: 'Mot de passe utilisateur réinitialisé avec succès',
  [UserSuccessCodes.DELETED]: 'Utilisateur supprimé avec succès',
  [UserSuccessCodes.LIST_SUCCESS]: 'Liste des utilisateurs récupérée avec succès',
  [UserSuccessCodes.DETAILS_SUCCESS]: "Détails de l'utilisateur récupérés avec succès",
  [UserSuccessCodes.AUDIT_HISTORY_SUCCESS]: "Historique d'audit récupéré avec succès",
}
