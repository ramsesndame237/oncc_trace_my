import {
  SystemErrorCodes,
  ValidationErrorCodes,
} from "@/core/domain/error-codes";
import { ApiError } from "@/core/infrastructure/api/client";
import { DI_TOKENS } from "@/core/infrastructure/di/tokens";
import { ApiResponse } from "@/core/infrastructure/types/api.type";
import "reflect-metadata";
import { inject, injectable } from "tsyringe";
import type { IAuthRepository } from "../../domain/IAuthRepository";
import type { ResendOtpRequest, ResendOtpResponse } from "../../domain/types";

export interface IResendOtpUseCase {
  execute(input: ResendOtpRequest): Promise<ApiResponse<ResendOtpResponse>>;
}

@injectable()
export class ResendOtpUseCase implements IResendOtpUseCase {
  constructor(
    @inject(DI_TOKENS.IAuthRepository)
    private readonly authRepository: IAuthRepository
  ) {}

  async execute(
    input: ResendOtpRequest
  ): Promise<ApiResponse<ResendOtpResponse>> {
    try {
      // Validation des entrées
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

      const resendData: ResendOtpRequest = {
        sessionToken: input.sessionToken.trim(),
        userId: input.userId,
      };

      // Appel du repository injecté
      const result = await this.authRepository.resendOtp(resendData);

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
