/**
 * Interface du repository d'authentification
 * Contrat définissant toutes les opérations d'authentification
 * Appartient à la couche Domain (contrat métier)
 */
import { ApiResponse } from "@/core/infrastructure/types/api.type";
import type {
  AccountInitializationRequest,
  AccountInitializationResponse,
  ChangePasswordRequest,
  ChangePasswordResponse,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  LoginRequest,
  LoginResponse,
  LogoutResponse,
  OtpResponse,
  OtpVerificationRequest,
  ResendOtpRequest,
  ResendOtpResponse,
  ResetPasswordWithSecurityRequest,
  ResetPasswordWithSecurityResponse,
  SecurityQuestionsByTokenResponse,
  UserInfoResponse,
  VerifySecurityAnswersRequest,
  VerifySecurityAnswersResponse,
} from "./types";
import { ForgotUsernameRequest } from "./types/request";
import { ForgotUsernameResponse } from "./types/response";

export interface IAuthRepository {
  /**
   * Connexion utilisateur
   */
  login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>>;

  /**
   * Vérification du code OTP
   */
  verifyOtp(otpData: OtpVerificationRequest): Promise<ApiResponse<OtpResponse>>;

  /**
   * Renvoi du code OTP
   */
  resendOtp(otpData: ResendOtpRequest): Promise<ApiResponse<ResendOtpResponse>>;

  /**
   * Déconnexion
   */
  logout(): Promise<LogoutResponse>;

  /**
   * Changement de mot de passe
   */
  changePassword(
    passwordData: ChangePasswordRequest
  ): Promise<ChangePasswordResponse>;

  /**
   * Récupération de pseudo
   */
  forgotUsername(
    emailData: ForgotUsernameRequest
  ): Promise<ApiResponse<ForgotUsernameResponse>>;

  /**
   * Récupération de mot de passe
   */
  forgotPassword(
    emailData: ForgotPasswordRequest
  ): Promise<ApiResponse<ForgotPasswordResponse>>;

  /**
   * Récupération des questions de sécurité par token de réinitialisation
   */
  getSecurityQuestionsByToken(
    resetToken: string
  ): Promise<ApiResponse<SecurityQuestionsByTokenResponse>>;

  /**
   * Vérification des réponses aux questions de sécurité
   */
  verifySecurityAnswers(
    data: VerifySecurityAnswersRequest
  ): Promise<ApiResponse<VerifySecurityAnswersResponse>>;

  /**
   * Réinitialisation du mot de passe avec questions de sécurité
   */
  resetPasswordWithSecurity(
    data: ResetPasswordWithSecurityRequest
  ): Promise<ApiResponse<ResetPasswordWithSecurityResponse>>;

  /**
   * Initialisation de compte (première connexion)
   */
  initializeAccount(
    initData: AccountInitializationRequest
  ): Promise<ApiResponse<AccountInitializationResponse>>;

  /**
   * Récupération des informations utilisateur actuel
   */
  getCurrentUser(): Promise<ApiResponse<UserInfoResponse>>;

  /**
   * Définit le token d'authentification
   */
  setAuthToken(token: string | null): void;

  /**
   * Récupère le token d'authentification
   */
  getAuthToken(): string | null;
}
