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
  VerifySecurityAnswersRequest,
  VerifySecurityAnswersResponse,
} from "../../domain/types";

export interface IVerifySecurityAnswersUseCase {
  execute(
    input: VerifySecurityAnswersRequest
  ): Promise<ApiResponse<VerifySecurityAnswersResponse>>;
}

@injectable()
export class VerifySecurityAnswersUseCase
  implements IVerifySecurityAnswersUseCase
{
  constructor(
    @inject(DI_TOKENS.IAuthRepository)
    private readonly authRepository: IAuthRepository
  ) {}

  async execute(
    input: VerifySecurityAnswersRequest
  ): Promise<ApiResponse<VerifySecurityAnswersResponse>> {
    try {
      // Validation des entrées
      if (!input.resetToken || input.resetToken.trim().length === 0) {
        throw new ApiError(
          ValidationErrorCodes.INVALID_FORMAT,
          "auth:validation.resetTokenRequired"
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

      return await this.authRepository.verifySecurityAnswers(input);
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
