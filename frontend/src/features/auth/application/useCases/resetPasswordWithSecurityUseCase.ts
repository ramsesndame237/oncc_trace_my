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
import type {
  ResetPasswordWithSecurityRequest,
  ResetPasswordWithSecurityResponse,
} from "../../domain/types";

export interface IResetPasswordWithSecurityUseCase {
  execute(
    input: ResetPasswordWithSecurityRequest
  ): Promise<ApiResponse<ResetPasswordWithSecurityResponse>>;
}

@injectable()
export class ResetPasswordWithSecurityUseCase
  implements IResetPasswordWithSecurityUseCase
{
  constructor(
    @inject(DI_TOKENS.IAuthRepository)
    private readonly authRepository: IAuthRepository
  ) {}

  async execute(
    input: ResetPasswordWithSecurityRequest
  ): Promise<ApiResponse<ResetPasswordWithSecurityResponse>> {
    try {
      // Validation des entrées
      if (!input.resetToken || input.resetToken.trim().length === 0) {
        throw new ApiError(
          ValidationErrorCodes.INVALID_FORMAT,
          "auth:validation.resetTokenRequired"
        );
      }

      if (!input.newPassword || input.newPassword.trim().length === 0) {
        throw new ApiError(
          ValidationErrorCodes.INVALID_FORMAT,
          "auth:validation.passwordRequired"
        );
      }

      if (
        !input.newPassword_confirmation ||
        input.newPassword_confirmation.trim().length === 0
      ) {
        throw new ApiError(
          ValidationErrorCodes.INVALID_FORMAT,
          "auth:validation.passwordConfirmationRequired"
        );
      }

      if (input.newPassword !== input.newPassword_confirmation) {
        throw new ApiError(
          ValidationErrorCodes.INVALID_FORMAT,
          "auth:validation.passwordMismatch"
        );
      }

      if (!input.answers || input.answers.length === 0) {
        throw new ApiError(
          ValidationErrorCodes.INVALID_FORMAT,
          "auth:validation.answersRequired"
        );
      }

      // Validation des réponses
      for (const answer of input.answers) {
        if (!answer.answer || answer.answer.trim().length === 0) {
          throw new ApiError(
            ValidationErrorCodes.INVALID_FORMAT,
            "auth:validation.allAnswersRequired"
          );
        }
      }

      return await this.authRepository.resetPasswordWithSecurity(input);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        SystemErrorCodes.INTERNAL_ERROR,
        "auth:messages.unexpectedError"
      );
    }
  }
}
