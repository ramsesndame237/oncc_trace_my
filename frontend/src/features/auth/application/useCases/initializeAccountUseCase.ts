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
import type {
  AccountInitializationRequest,
  AccountInitializationResponse,
} from "../../domain/types";

export interface IInitializeAccountUseCase {
  execute(
    input: AccountInitializationRequest
  ): Promise<ApiResponse<AccountInitializationResponse>>;
}

@injectable()
export class InitializeAccountUseCase implements IInitializeAccountUseCase {
  constructor(
    @inject(DI_TOKENS.IAuthRepository)
    private readonly authRepository: IAuthRepository
  ) {}

  async execute(
    input: AccountInitializationRequest
  ): Promise<ApiResponse<AccountInitializationResponse>> {
    try {
      // Validation des entrées
      if (!input.userId) {
        throw new ApiError(
          ValidationErrorCodes.REQUIRED_FIELD_MISSING,
          "auth:validation.userIdRequired"
        );
      }

      if (!input.newPassword || input.newPassword.length < 8) {
        throw new ApiError(
          ValidationErrorCodes.INVALID_PASSWORD_FORMAT,
          "auth:validation.passwordMinLength"
        );
      }

      // Préparer les données pour l'API
      const initData: AccountInitializationRequest = {
        userId: input.userId,
        newPassword: input.newPassword,
        sessionToken: input.sessionToken,
        securityQuestion1: input.securityQuestion1,
        securityAnswer1: input.securityAnswer1,
        securityQuestion2: input.securityQuestion2,
        securityAnswer2: input.securityAnswer2,
        securityQuestion3: input.securityQuestion3,
        securityAnswer3: input.securityAnswer3,
      };

      // Appel du repository injecté
      const response = await this.authRepository.initializeAccount(initData);

      return response;
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
