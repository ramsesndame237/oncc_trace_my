/**
 * Codes d'erreur spécifiques à l'authentification
 */
export enum AuthErrorCodes {
  // Connexion
  LOGIN_INVALID_CREDENTIALS = 'AUTH_LOGIN_INVALID_CREDENTIALS',
  LOGIN_ACCOUNT_INACTIVE = 'AUTH_LOGIN_ACCOUNT_INACTIVE',
  LOGIN_ACCOUNT_BLOCKED = 'AUTH_LOGIN_ACCOUNT_BLOCKED',
  LOGIN_ACTOR_INACTIVE = 'AUTH_LOGIN_ACTOR_INACTIVE',
  LOGIN_DEFAULT_PASSWORD = 'AUTH_LOGIN_DEFAULT_PASSWORD',
  LOGIN_FAILED = 'AUTH_LOGIN_FAILED',

  // OTP
  OTP_INVALID = 'AUTH_OTP_INVALID',
  OTP_EXPIRED = 'AUTH_OTP_EXPIRED',
  OTP_SESSION_INVALID = 'AUTH_OTP_SESSION_INVALID',
  OTP_SEND_FAILED = 'AUTH_OTP_SEND_FAILED',
  OTP_VERIFY_FAILED = 'AUTH_OTP_VERIFY_FAILED',

  // Mot de passe
  PASSWORD_CHANGE_CURRENT_INVALID = 'AUTH_PASSWORD_CHANGE_CURRENT_INVALID',
  PASSWORD_CHANGE_FAILED = 'AUTH_PASSWORD_CHANGE_FAILED',
  PASSWORD_RESET_TOKEN_INVALID = 'AUTH_PASSWORD_RESET_TOKEN_INVALID',
  PASSWORD_RESET_TOKEN_EXPIRED = 'AUTH_PASSWORD_RESET_TOKEN_EXPIRED',
  PASSWORD_RESET_FAILED = 'AUTH_PASSWORD_RESET_FAILED',
  PASSWORD_FORGOT_EMAIL_NOT_FOUND = 'AUTH_PASSWORD_FORGOT_EMAIL_NOT_FOUND',
  PASSWORD_FORGOT_SEND_FAILED = 'AUTH_PASSWORD_FORGOT_SEND_FAILED',

  // Questions de sécurité
  SECURITY_QUESTIONS_INVALID_ANSWERS = 'AUTH_SECURITY_QUESTIONS_INVALID_ANSWERS',
  SECURITY_QUESTIONS_NOT_FOUND = 'AUTH_SECURITY_QUESTIONS_NOT_FOUND',
  SECURITY_QUESTIONS_SETUP_FAILED = 'AUTH_SECURITY_QUESTIONS_SETUP_FAILED',

  // Initialisation de compte
  INIT_TOKEN_INVALID = 'AUTH_INIT_TOKEN_INVALID',
  INIT_TOKEN_EXPIRED = 'AUTH_INIT_TOKEN_EXPIRED',
  INIT_FAILED = 'AUTH_INIT_FAILED',

  // Session
  SESSION_EXPIRED = 'AUTH_SESSION_EXPIRED',
  SESSION_INVALID = 'AUTH_SESSION_INVALID',
  TOKEN_INVALID = 'AUTH_TOKEN_INVALID',
  TOKEN_EXPIRED = 'AUTH_TOKEN_EXPIRED',
  LOGOUT_FAILED = 'AUTH_LOGOUT_FAILED',
}

/**
 * Messages d'erreur en français pour l'authentification
 */
export const AuthErrorMessages: Record<AuthErrorCodes, string> = {
  // Connexion
  [AuthErrorCodes.LOGIN_INVALID_CREDENTIALS]: 'Identifiants invalides',
  [AuthErrorCodes.LOGIN_ACCOUNT_INACTIVE]: 'Votre compte utilisateur est désactivé. Contactez un administrateur',
  [AuthErrorCodes.LOGIN_ACCOUNT_BLOCKED]: 'Compte bloqué. Contactez un administrateur',
  [AuthErrorCodes.LOGIN_ACTOR_INACTIVE]: 'Votre organisation est désactivée. Vous ne pouvez pas vous connecter',
  [AuthErrorCodes.LOGIN_DEFAULT_PASSWORD]:
    'Mot de passe par défaut utilisé, veuillez initialiser votre compte',
  [AuthErrorCodes.LOGIN_FAILED]: 'Erreur lors de la connexion',

  // OTP
  [AuthErrorCodes.OTP_INVALID]: 'Code de vérification invalide',
  [AuthErrorCodes.OTP_EXPIRED]: 'Code de vérification expiré',
  [AuthErrorCodes.OTP_SESSION_INVALID]: 'Session invalide, veuillez vous reconnecter',
  [AuthErrorCodes.OTP_SEND_FAILED]: "Erreur lors de l'envoi du code de vérification",
  [AuthErrorCodes.OTP_VERIFY_FAILED]: 'Erreur lors de la vérification du code',

  // Mot de passe
  [AuthErrorCodes.PASSWORD_CHANGE_CURRENT_INVALID]: 'Mot de passe actuel incorrect',
  [AuthErrorCodes.PASSWORD_CHANGE_FAILED]: 'Erreur lors du changement de mot de passe',
  [AuthErrorCodes.PASSWORD_RESET_TOKEN_INVALID]: 'Token de réinitialisation invalide',
  [AuthErrorCodes.PASSWORD_RESET_TOKEN_EXPIRED]: 'Token de réinitialisation expiré',
  [AuthErrorCodes.PASSWORD_RESET_FAILED]: 'Erreur lors de la réinitialisation du mot de passe',
  [AuthErrorCodes.PASSWORD_FORGOT_EMAIL_NOT_FOUND]: 'Aucun compte associé à cette adresse email',
  [AuthErrorCodes.PASSWORD_FORGOT_SEND_FAILED]: "Erreur lors de l'envoi de l'email de récupération",

  // Questions de sécurité
  [AuthErrorCodes.SECURITY_QUESTIONS_INVALID_ANSWERS]:
    'Réponses aux questions de sécurité incorrectes',
  [AuthErrorCodes.SECURITY_QUESTIONS_NOT_FOUND]: 'Questions de sécurité non trouvées',
  [AuthErrorCodes.SECURITY_QUESTIONS_SETUP_FAILED]:
    'Erreur lors de la configuration des questions de sécurité',

  // Initialisation
  [AuthErrorCodes.INIT_TOKEN_INVALID]: "Token d'initialisation invalide",
  [AuthErrorCodes.INIT_TOKEN_EXPIRED]: "Token d'initialisation expiré",
  [AuthErrorCodes.INIT_FAILED]: "Erreur lors de l'initialisation du compte",

  // Session
  [AuthErrorCodes.SESSION_EXPIRED]: 'Session expirée, veuillez vous reconnecter',
  [AuthErrorCodes.SESSION_INVALID]: 'Session invalide',
  [AuthErrorCodes.TOKEN_INVALID]: "Token d'accès invalide",
  [AuthErrorCodes.TOKEN_EXPIRED]: "Token d'accès expiré",
  [AuthErrorCodes.LOGOUT_FAILED]: 'Erreur lors de la déconnexion',
}

/**
 * Codes de succès spécifiques à l'authentification
 */
export enum AuthSuccessCodes {
  LOGIN_SUCCESS = 'AUTH_LOGIN_SUCCESS',
  LOGIN_OTP_SENT = 'AUTH_LOGIN_OTP_SENT',
  OTP_VERIFIED = 'AUTH_OTP_VERIFIED',
  LOGOUT_SUCCESS = 'AUTH_LOGOUT_SUCCESS',
  PASSWORD_CHANGED = 'AUTH_PASSWORD_CHANGED',
  PASSWORD_RESET_EMAIL_SENT = 'AUTH_PASSWORD_RESET_EMAIL_SENT',
  PASSWORD_RESET_SUCCESS = 'AUTH_PASSWORD_RESET_SUCCESS',
  ACCOUNT_INITIALIZED = 'AUTH_ACCOUNT_INITIALIZED',
  ACCOUNT_TO_BE_INITIALIZED = 'AUTH_ACCOUNT_TO_BE_INITIALIZED',
  SECURITY_QUESTIONS_SETUP = 'AUTH_SECURITY_QUESTIONS_SETUP',
}

/**
 * Messages de succès en français pour l'authentification
 */
export const AuthSuccessMessages: Record<AuthSuccessCodes, string> = {
  [AuthSuccessCodes.LOGIN_SUCCESS]: 'Connexion réussie',
  [AuthSuccessCodes.LOGIN_OTP_SENT]: 'Code de vérification envoyé par email',
  [AuthSuccessCodes.OTP_VERIFIED]: 'Code de vérification validé avec succès',
  [AuthSuccessCodes.LOGOUT_SUCCESS]: 'Déconnexion réussie',
  [AuthSuccessCodes.PASSWORD_CHANGED]: 'Mot de passe modifié avec succès',
  [AuthSuccessCodes.PASSWORD_RESET_EMAIL_SENT]: 'Email de réinitialisation envoyé',
  [AuthSuccessCodes.PASSWORD_RESET_SUCCESS]: 'Mot de passe réinitialisé avec succès',
  [AuthSuccessCodes.ACCOUNT_INITIALIZED]: 'Compte initialisé avec succès',
  [AuthSuccessCodes.ACCOUNT_TO_BE_INITIALIZED]: 'Compte à initialiser',
  [AuthSuccessCodes.SECURITY_QUESTIONS_SETUP]: 'Questions de sécurité configurées avec succès',
}
