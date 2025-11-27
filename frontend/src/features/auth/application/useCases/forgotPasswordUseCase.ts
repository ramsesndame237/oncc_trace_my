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
import type { ForgotPasswordRequest } from "../../domain/types/request";
import type { ForgotPasswordResponse } from "../../domain/types/response";

export interface ForgotPasswordInput {
  email: string;
}

export interface IForgotPasswordUseCase {
  execute(
    input: ForgotPasswordInput
  ): Promise<ApiResponse<ForgotPasswordResponse>>;
}

@injectable()
export class ForgotPasswordUseCase implements IForgotPasswordUseCase {
  constructor(
    @inject(DI_TOKENS.IAuthRepository)
    private readonly authRepository: IAuthRepository
  ) {}

  async execute(
    input: ForgotPasswordInput
  ): Promise<ApiResponse<ForgotPasswordResponse>> {
    try {
      // Validation des entrées
      if (!input.email || input.email.trim().length === 0) {
        throw new ApiError(
          ValidationErrorCodes.REQUIRED_FIELD_MISSING,
          "auth:validation.emailRequired"
        );
      }

      // Validation basique du format email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(input.email.trim())) {
        throw new ApiError(
          ValidationErrorCodes.INVALID_FORMAT,
          "auth:validation.emailInvalid"
        );
      }

      const emailData: ForgotPasswordRequest = {
        email: input.email.trim().toLowerCase(),
      };

      // Appel du repository injecté
      const result = await this.authRepository.forgotPassword(emailData);

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
