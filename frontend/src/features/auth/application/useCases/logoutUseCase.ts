import { SystemErrorCodes } from "@/core/domain/error-codes";
import { ApiError } from "@/core/infrastructure/api/client";
import { DI_TOKENS } from "@/core/infrastructure/di/tokens";
import "reflect-metadata";
import { inject, injectable } from "tsyringe";
import type { IAuthRepository } from "../../domain/IAuthRepository";
import type { LogoutResponse } from "../../domain/types";

export interface LogoutOutput {
  success: boolean;
  error?: string;
}

export interface ILogoutUseCase {
  execute(): Promise<LogoutResponse>;
}

@injectable()
export class LogoutUseCase implements ILogoutUseCase {
  constructor(
    @inject(DI_TOKENS.IAuthRepository)
    private readonly authRepository: IAuthRepository
  ) {}

  async execute(): Promise<LogoutResponse> {
    try {
      // Appel du repository injecté pour déconnexion
      const result = await this.authRepository.logout();

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
