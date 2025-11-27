import {
  SystemErrorCodes,
  ValidationErrorCodes,
} from "@/core/domain/error-codes";
import { ApiResponse } from "@/core/infrastructure/api";
import { ApiError } from "@/core/infrastructure/api/client";
import { DI_TOKENS } from "@/core/infrastructure/di/tokens";
import "reflect-metadata";
import { inject, injectable } from "tsyringe";
import type { IAuthRepository } from "../../domain/IAuthRepository";
import { GetSecurityQuestionsByTokenRequest } from "../../domain/types/request";
import type { SecurityQuestionsByTokenResponse } from "../../domain/types/response";

export interface IGetSecurityQuestionsByTokenUseCase {
  execute(
    input: GetSecurityQuestionsByTokenRequest
  ): Promise<ApiResponse<SecurityQuestionsByTokenResponse>>;
}

@injectable()
export class GetSecurityQuestionsByTokenUseCase
  implements IGetSecurityQuestionsByTokenUseCase
{
  constructor(
    @inject(DI_TOKENS.IAuthRepository)
    private readonly authRepository: IAuthRepository
  ) {}

  async execute(
    input: GetSecurityQuestionsByTokenRequest
  ): Promise<ApiResponse<SecurityQuestionsByTokenResponse>> {
    try {
      // Validation des entrées
      if (!input.resetToken || input.resetToken.trim().length === 0) {
        throw new ApiError(
          ValidationErrorCodes.REQUIRED_FIELD_MISSING,
          "auth:validation.resetTokenRequired"
        );
      }

      // Appel du repository injecté pour récupérer les questions de sécurité par token
      const result = await this.authRepository.getSecurityQuestionsByToken(
        input.resetToken.trim()
      );

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
