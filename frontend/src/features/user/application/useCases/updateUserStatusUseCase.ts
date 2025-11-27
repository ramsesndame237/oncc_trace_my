import { DI_TOKENS } from "@/core/infrastructure/di/tokens";
import { inject, injectable } from "tsyringe";
import type { IUserRepository } from "../../domain/IUserRepository";
import type { UserResponse } from "../../domain/types";

@injectable()
export class UpdateUserStatusUseCase {
  constructor(
    @inject(DI_TOKENS.IUserRepository) private userRepository: IUserRepository
  ) {}

  async execute(
    userId: string,
    status: "active" | "inactive" | "blocked",
    reason?: string
  ): Promise<UserResponse> {
    return await this.userRepository.updateUserStatus(userId, status, reason);
  }
}
