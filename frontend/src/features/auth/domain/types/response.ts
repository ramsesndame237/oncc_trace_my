import { User } from "@/core/domain/user.types";
import { ApiResponse } from "@/core/infrastructure/types/api.type";

export interface AuthToken {
  type: string;
  value: string;
  expiresAt: string;
}

/**
 *
 * les types de réponse de connexion venant du backend
 *
 */
export interface LoginSuccessData {
  user?: User;
  requiresInitialization?: boolean;
  sessionToken?: string;
}

export interface LoginInitializationData {
  user?: User;
  requiresInitialization: boolean;
  sessionToken: string;
}

export interface LoginOtpData {
  user?: User;
  requiresInitialization: boolean;
  sessionToken: string;
}

/**
 * Réponse de connexion - peut être un succès direct ou nécessiter une OTP
 */
export type LoginResponse =
  | LoginSuccessData
  | LoginOtpData
  | LoginInitializationData;

/**
 * Réponse de vérification OTP
 */
export type OtpResponse = {
  user: User;
  token: AuthToken;
};

/**
 * Réponse de renvoi OTP
 */
export type ResendOtpResponse = {
  message: string;
  user: User;
};

/**
 * Réponse des questions de sécurité avec token et informations utilisateur
 */
export type SecurityQuestionsByTokenResponse = {
  securityQuestions: Array<{ id: number; question: string }>;
  userInfo: {
    username: string;
    email: string;
    givenName: string;
    familyName: string;
  };
};

/**
 * Réponse de récupération de pseudo
 */
export type ForgotUsernameResponse = {
  emailSent: boolean;
};

/**
 * Réponse de récupération de mot de passe
 */
export type ForgotPasswordResponse = {
  emailSent: boolean;
};

/**
 * Réponse de vérification des réponses aux questions de sécurité
 */
export type VerifySecurityAnswersResponse = {
  verified: boolean;
  userInfo: {
    username: string;
    email: string;
    givenName: string;
    familyName: string;
  };
};

/**
 * Réponse de réinitialisation de mot de passe
 */
export type ResetPasswordWithSecurityResponse = {
  success: boolean;
  message?: string;
};

/**
 * Réponse de changement de mot de passe
 */
export type ChangePasswordResponse = {
  success: boolean;
};

/**
 * Réponse de déconnexion
 */
export type LogoutResponse = {
  success: boolean;
};

/**
 * Réponse d'initialisation de compte
 */
export type AccountInitializationResponse = {
  user: User;
};

/**
 * Réponse d'informations utilisateur
 */
export type UserInfoResponse = ApiResponse<User>;
