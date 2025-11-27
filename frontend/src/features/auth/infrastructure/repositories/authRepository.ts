/**
 * Repository d'authentification moderne pour ONCC
 * Utilise le client API standardisé avec gestion des codes d'erreur
 */

import { SystemErrorCodes } from "@/core/domain/error-codes";
import { apiClient, ApiError } from "@/core/infrastructure/api/client";
import { ApiResponse } from "@/core/infrastructure/types/api.type";
import "reflect-metadata";
import { injectable } from "tsyringe";
import { IAuthRepository } from "../../domain/IAuthRepository";
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
} from "../../domain/types";
import { ForgotUsernameRequest } from "../../domain/types/request";
import { ForgotUsernameResponse } from "../../domain/types/response";

/**
 * Repository d'authentification
 */
@injectable()
export class AuthRepository implements IAuthRepository {
  /**
   * Connexion utilisateur
   */
  async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    try {
      const response = await apiClient.post<LoginResponse>(
        "/login",
        credentials
      );
      return response;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        SystemErrorCodes.INTERNAL_ERROR,
        "auth:messages.loginError"
      );
    }
  }

  /**
   * Vérification du code OTP
   */
  async verifyOtp(
    otpData: OtpVerificationRequest
  ): Promise<ApiResponse<OtpResponse>> {
    try {
      const response = await apiClient.post<OtpResponse>(
        "/verify-otp",
        otpData
      );
      return response;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        SystemErrorCodes.INTERNAL_ERROR,
        "auth:messages.otpVerificationError"
      );
    }
  }

  /**
   * Renvoi du code OTP
   */
  async resendOtp(
    otpData: ResendOtpRequest
  ): Promise<ApiResponse<ResendOtpResponse>> {
    try {
      const response = await apiClient.post<ResendOtpResponse>(
        "/resend-otp",
        otpData
      );
      return response;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        SystemErrorCodes.INTERNAL_ERROR,
        "auth:messages.otpResendError"
      );
    }
  }

  /**
   * Déconnexion
   */
  async logout(): Promise<ApiResponse<LogoutResponse>> {
    try {
      const response = await apiClient.post<LogoutResponse>("/logout");

      // Nettoyer le token local
      apiClient.setToken(null);

      return response;
    } catch (error) {
      // Même en cas d'erreur, on nettoie le token local
      apiClient.setToken(null);

      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        SystemErrorCodes.INTERNAL_ERROR,
        "auth:messages.logoutError"
      );
    }
  }

  /**
   * Changement de mot de passe
   */
  async changePassword(
    passwordData: ChangePasswordRequest
  ): Promise<ApiResponse<ChangePasswordResponse>> {
    try {
      const response = await apiClient.post<ChangePasswordResponse>(
        "/change-password",
        passwordData
      );
      return response;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        SystemErrorCodes.INTERNAL_ERROR,
        "auth:messages.passwordChangeError"
      );
    }
  }

  /**
   * Récupération de pseudo
   */
  async forgotUsername(
    emailData: ForgotUsernameRequest
  ): Promise<ApiResponse<ForgotUsernameResponse>> {
    try {
      const response = await apiClient.post<ForgotUsernameResponse>(
        "/forgot-username",
        emailData
      );
      return response;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        SystemErrorCodes.INTERNAL_ERROR,
        "auth:messages.usernameRecoveryError"
      );
    }
  }

  /**
   * Récupération de mot de passe
   */
  async forgotPassword(
    emailData: ForgotPasswordRequest
  ): Promise<ApiResponse<ForgotPasswordResponse>> {
    try {
      const response = await apiClient.post<ForgotPasswordResponse>(
        "/forgot-password",
        emailData
      );
      return response;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        SystemErrorCodes.INTERNAL_ERROR,
        "auth:messages.passwordRecoveryError"
      );
    }
  }

  /**
   * Récupération des questions de sécurité par token de réinitialisation
   */
  async getSecurityQuestionsByToken(
    resetToken: string
  ): Promise<ApiResponse<SecurityQuestionsByTokenResponse>> {
    try {
      const response = await apiClient.post<SecurityQuestionsByTokenResponse>(
        "/get-security-questions",
        { resetToken }
      );
      return response;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        SystemErrorCodes.INTERNAL_ERROR,
        "auth:messages.securityQuestionsRetrievalError"
      );
    }
  }

  /**
   * Vérification des réponses aux questions de sécurité
   */
  async verifySecurityAnswers(
    data: VerifySecurityAnswersRequest
  ): Promise<ApiResponse<VerifySecurityAnswersResponse>> {
    try {
      const response = await apiClient.post<VerifySecurityAnswersResponse>(
        "/verify-security-answers",
        data
      );
      return response;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        SystemErrorCodes.INTERNAL_ERROR,
        "auth:messages.securityAnswersVerificationError"
      );
    }
  }

  /**
   * Réinitialisation du mot de passe avec questions de sécurité
   */
  async resetPasswordWithSecurity(
    data: ResetPasswordWithSecurityRequest
  ): Promise<ApiResponse<ResetPasswordWithSecurityResponse>> {
    try {
      const response = await apiClient.post<ResetPasswordWithSecurityResponse>(
        "/reset-password",
        data
      );
      return response;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        SystemErrorCodes.INTERNAL_ERROR,
        "auth:messages.passwordResetError"
      );
    }
  }

  /**
   * Initialisation de compte (première connexion)
   */
  async initializeAccount(
    initData: AccountInitializationRequest
  ): Promise<ApiResponse<AccountInitializationResponse>> {
    try {
      const response = await apiClient.post<AccountInitializationResponse>(
        "/initialize-account",
        initData
      );
      return response;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        SystemErrorCodes.INTERNAL_ERROR,
        "auth:messages.accountInitializationError"
      );
    }
  }

  /**
   * Récupération des informations utilisateur actuel
   */
  async getCurrentUser(): Promise<ApiResponse<UserInfoResponse>> {
    try {
      const response = await apiClient.get<UserInfoResponse>("/me");
      return response;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        SystemErrorCodes.INTERNAL_ERROR,
        "auth:messages.userInfoRetrievalError"
      );
    }
  }

  /**
   * Définit le token d'authentification
   */
  setAuthToken(token: string | null) {
    apiClient.setToken(token);
  }

  /**
   * Récupère le token d'authentification
   */
  getAuthToken(): string | null {
    return apiClient.getToken();
  }
}

/**
 * Instance singleton du repository d'authentification
 */
export const authRepository = new AuthRepository();
