import { DI_TOKENS } from "@/core/infrastructure/di/tokens";
import { inject, injectable } from "tsyringe";
import type { IUserRepository } from "../../domain/IUserRepository";
import type { UserResponse } from "../../domain/types";

@injectable()
export class ResetUserPasswordUseCase {
  constructor(
    @inject(DI_TOKENS.IUserRepository) private userRepository: IUserRepository
  ) {}

  async execute(userId: string): Promise<UserResponse> {
    return await this.userRepository.resetUserPassword(userId);
  }
}