/**
 * Exports publics de la feature d'authentification
 * Version harmonisée avec les codes d'erreur standardisés du backend
 */

// ======================= INFRASTRUCTURE (API) =======================

// Repository d'authentification moderne
export {
  AuthRepository,
  authRepository,
} from "./infrastructure/repositories/authRepository";

// Types de requête API
export type {
  AccountInitializationRequest,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  LoginRequest,
  OtpVerificationRequest,
  ResetPasswordWithSecurityRequest,
  VerifySecurityAnswersRequest,
} from "./domain/types";

// Types de réponse API
export type {
  AccountInitializationResponse,
  ChangePasswordResponse,
  ForgotPasswordResponse,
  LoginResponse,
  OtpResponse,
  ResetPasswordWithSecurityResponse,
  SecurityQuestionsByTokenResponse,
  UserInfoResponse,
  VerifySecurityAnswersResponse,
} from "./domain/types";

// Types d'erreur et succès spécifiques à l'auth
export type { AuthErrorCodes, AuthSuccessCodes } from "./domain/types";

// Configuration NextAuth
export { authConfig } from "./infrastructure/auth.config";

// ======================= DOMAINE (LEGACY) =======================
// Types du domaine (maintenus pour compatibilité)
export type { AuthActions, AuthState, SecurityQuestion, User } from "./domain";

// Classes du domaine (Value Objects)
export { AuthToken } from "./domain";

// Constantes et règles métier
export { SECURITY_QUESTIONS, type SecurityQuestionValue } from "./domain";

// ======================= APPLICATION (USE CASES) =======================
// Cas d'utilisation (interfaces)
export type {
  ForgotPasswordInput,
  ForgotUsernameInput,
  IForgotPasswordUseCase,
  IForgotUsernameUseCase,
  IGetSecurityQuestionsByTokenUseCase,
  IInitializeAccountUseCase,
  ILoginUseCase,
  IResetPasswordWithSecurityUseCase,
  IVerifyOtpUseCase,
  IVerifySecurityAnswersUseCase,
  VerifyOtpOutput,
} from "./application/useCases";

// Cas d'utilisation (implémentations)
export {
  ForgotPasswordUseCase,
  ForgotUsernameUseCase,
  GetSecurityQuestionsByTokenUseCase,
  InitializeAccountUseCase,
  LoginUseCase,
  ResetPasswordWithSecurityUseCase,
  VerifyOtpUseCase,
  VerifySecurityAnswersUseCase,
} from "./application/useCases";

// Store d'authentification
export { useAuthStore } from "./infrastructure/store/authStore";

// Schémas de validation
export {
  createEmailRecoverySchema,
  createLoginSchema,
  createNewPasswordSchema,
  createOtpSchema,
  createPasswordResetSchema,
  createSecurityAnswersSchema,
  createSecurityQuestionsSchema,
} from "./presentation/schemas";

// Types de formulaires
export type {
  EmailRecoveryFormValues,
  LoginFormData,
  NewPasswordFormData,
  OtpFormData,
  PasswordResetFormData,
  SecurityAnswersFormData,
  SecurityQuestionsFormData,
} from "./presentation/schemas";

// ======================= PRESENTATION (COMPOSANTS & HOOKS) =======================
// Composants de présentation
export { ConfirmDetail, LoginForm, StartPage } from "./presentation/components";

// Guards d'authentification
export { AuthGuard } from "./presentation/components/AuthGuard";

// Hooks d'authentification
export { useAuth } from "./presentation/hooks/useAuth";
export type { UseAuthReturn } from "./presentation/hooks/useAuth";
export { useAuthState, useAuthRoutePermissions } from "./presentation/hooks/useAuthState";
export type { CombinedAuthState } from "./presentation/hooks/useAuthState";

// Providers
export { default as NextAuthProvider } from "./presentation/providers/NextAuthProvider";
export { SessionSyncProvider } from "./presentation/providers/SessionSyncProvider";
