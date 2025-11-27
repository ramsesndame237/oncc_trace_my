import { ensureDIConfigured } from "@/core/infrastructure/di/container";
import { ForgotPasswordUseCase } from "@/features/auth/application/useCases/forgotPasswordUseCase";
import { ForgotUsernameUseCase } from "@/features/auth/application/useCases/forgotUsernameUseCase";
import { GetSecurityQuestionsByTokenUseCase } from "@/features/auth/application/useCases/getSecurityQuestionsByTokenUseCase";
import { InitializeAccountUseCase } from "@/features/auth/application/useCases/initializeAccountUseCase";
import { LoginUseCase } from "@/features/auth/application/useCases/loginUseCase";
import { ResendOtpUseCase } from "@/features/auth/application/useCases/resendOtpUseCase";
import { ResetPasswordWithSecurityUseCase } from "@/features/auth/application/useCases/resetPasswordWithSecurityUseCase";
import { VerifyOtpUseCase } from "@/features/auth/application/useCases/verifyOtpUseCase";
import { VerifySecurityAnswersUseCase } from "@/features/auth/application/useCases/verifySecurityAnswersUseCase";
import { container } from "tsyringe";

/**
 * Service Provider pour les use cases d'authentification
 */
export class AuthServiceProvider {
  /**
   * Récupère une instance du use case InitializeAccount
   */
  static getInitializeAccountUseCase(): InitializeAccountUseCase {
    ensureDIConfigured();
    return container.resolve(InitializeAccountUseCase);
  }

  /**
   * Récupère une instance du use case Login
   */
  static getLoginUseCase(): LoginUseCase {
    ensureDIConfigured();
    return container.resolve(LoginUseCase);
  }

  /**
   * Récupère une instance du use case VerifyOtp
   */
  static getVerifyOtpUseCase(): VerifyOtpUseCase {
    ensureDIConfigured();
    return container.resolve(VerifyOtpUseCase);
  }

  /**
   * Récupère une instance du use case GetSecurityQuestionsByToken
   */
  static getGetSecurityQuestionsByTokenUseCase(): GetSecurityQuestionsByTokenUseCase {
    ensureDIConfigured();
    return container.resolve(GetSecurityQuestionsByTokenUseCase);
  }

  /**
   * Récupère une instance du use case ForgotUsername
   */
  static getForgotUsernameUseCase(): ForgotUsernameUseCase {
    ensureDIConfigured();
    return container.resolve(ForgotUsernameUseCase);
  }

  /**
   * Récupère une instance du use case ForgotPassword
   */
  static getForgotPasswordUseCase(): ForgotPasswordUseCase {
    ensureDIConfigured();
    return container.resolve(ForgotPasswordUseCase);
  }

  /**
   * Récupère une instance du use case VerifySecurityAnswers
   */
  static getVerifySecurityAnswersUseCase(): VerifySecurityAnswersUseCase {
    ensureDIConfigured();
    return container.resolve(VerifySecurityAnswersUseCase);
  }

  /**
   * Récupère une instance du use case ResetPasswordWithSecurity
   */
  static getResetPasswordWithSecurityUseCase(): ResetPasswordWithSecurityUseCase {
    ensureDIConfigured();
    return container.resolve(ResetPasswordWithSecurityUseCase);
  }

  /**
   * Récupère une instance du use case ResendOtp
   */
  static getResendOtpUseCase(): ResendOtpUseCase {
    ensureDIConfigured();
    return container.resolve(ResendOtpUseCase);
  }
}
