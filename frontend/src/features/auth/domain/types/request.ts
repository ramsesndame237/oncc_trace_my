export interface LoginRequest {
  username: string;
  password: string;
}

export interface OtpVerificationRequest {
  otp: string;
  sessionToken: string;
  userId: string;
}

export interface ResendOtpRequest {
  sessionToken: string;
  userId: string;
}

/**
 * Requête d'initialisation de compte
 */
export interface AccountInitializationRequest {
  userId: string;
  newPassword: string;
  sessionToken: string;
  securityQuestion1: string;
  securityAnswer1: string;
  securityQuestion2: string;
  securityAnswer2: string;
  securityQuestion3: string;
  securityAnswer3: string;
}

/**
 * Requête de changement de mot de passe
 */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ForgotUsernameRequest {
  email: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

/**
 * Requête de vérification des réponses aux questions de sécurité
 */
export interface VerifySecurityAnswersRequest {
  resetToken: string;
  answers: Array<{
    id: number;
    answer: string;
  }>;
}

/**
 * Requête de réinitialisation de mot de passe avec questions de sécurité
 */
export interface ResetPasswordWithSecurityRequest {
  resetToken: string;
  answers: Array<{
    id: number;
    answer: string;
  }>;
  newPassword: string;
  newPassword_confirmation: string;
}

/**
 * Requête de récupération des questions de sécurité par token
 */
export interface GetSecurityQuestionsByTokenRequest {
  resetToken: string;
}
