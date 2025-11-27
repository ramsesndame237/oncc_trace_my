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
import type { LoginRequest, LoginResponse } from "../../domain/types";

export interface ILoginUseCase {
  execute(input: LoginRequest): Promise<ApiResponse<LoginResponse>>;
}

@injectable()
export class LoginUseCase implements ILoginUseCase {
  constructor(
    @inject(DI_TOKENS.IAuthRepository)
    private readonly authRepository: IAuthRepository
  ) {}

  async execute(input: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    try {
      // Validation des entrées
      if (!input.username || input.username.trim().length === 0) {
        throw new ApiError(
          ValidationErrorCodes.REQUIRED_FIELD_MISSING,
          "auth:validation.usernameRequired"
        );
      }

      if (!input.password || input.password.trim().length === 0) {
        throw new ApiError(
          ValidationErrorCodes.REQUIRED_FIELD_MISSING,
          "auth:validation.passwordRequired"
        );
      }

      const credentials: LoginRequest = {
        username: input.username.trim(),
        password: input.password,
      };

      // Appel du repository injecté
      const result = await this.authRepository.login(credentials);

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
