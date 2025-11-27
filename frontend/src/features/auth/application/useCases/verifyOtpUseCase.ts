import {
  SystemErrorCodes,
  ValidationErrorCodes,
} from "@/core/domain/error-codes";
import { ApiError } from "@/core/infrastructure/api/client";
import { DI_TOKENS } from "@/core/infrastructure/di/tokens";
import { ApiResponse } from "@/core/infrastructure/types/api.type";
import { AuthErrorCodes } from "@/features/auth/domain/types/auth-codes";
import "reflect-metadata";
import { inject, injectable } from "tsyringe";
import type { IAuthRepository } from "../../domain/IAuthRepository";
import type { OtpResponse, OtpVerificationRequest } from "../../domain/types";

export interface VerifyOtpOutput {
  success: boolean;
  session?: {
    token: string;
    user: {
      id: number;
      username: string;
      email: string;
    };
  };
  error?: string;
}

export interface IVerifyOtpUseCase {
  execute(input: OtpVerificationRequest): Promise<ApiResponse<OtpResponse>>;
}

@injectable()
export class VerifyOtpUseCase implements IVerifyOtpUseCase {
  constructor(
    @inject(DI_TOKENS.IAuthRepository)
    private readonly authRepository: IAuthRepository
  ) {}

  async execute(
    input: OtpVerificationRequest
  ): Promise<ApiResponse<OtpResponse>> {
    try {
      // Validation des entrées
      if (!input.otp || input.otp.trim().length === 0) {
        throw new ApiError(
          ValidationErrorCodes.REQUIRED_FIELD_MISSING,
          "auth:validation.otpRequired"
        );
      }

      if (!input.sessionToken || input.sessionToken.trim().length === 0) {
        throw new ApiError(
          ValidationErrorCodes.REQUIRED_FIELD_MISSING,
          "auth:messages.sessionMissing"
        );
      }

      if (!input.userId) {
        throw new ApiError(
          ValidationErrorCodes.REQUIRED_FIELD_MISSING,
          "auth:validation.userIdRequired"
        );
      }

      // Validation du format OTP (6 chiffres)
      const otpRegex = /^\d{6}$/;
      if (!otpRegex.test(input.otp)) {
        throw new ApiError(
          AuthErrorCodes.OTP_INVALID,
          "auth:validation.otpInvalid"
        );
      }

      const verification: OtpVerificationRequest = {
        otp: input.otp.trim(),
        sessionToken: input.sessionToken.trim(),
        userId: input.userId,
      };

      // Appel du repository injecté
      const result = await this.authRepository.verifyOtp(verification);

      return result;
    } catch (error) {
      // Si c'est déjà une ApiError, on la relance
      if (error instanceof ApiError) {
        throw error;
      }

      // Sinon, on crée une nouvelle ApiError
      throw new ApiError(
        SystemErrorCodes.INTERNAL_ERROR,
        "auth:messages.unexpectedError"
      );
    }
  }
}
