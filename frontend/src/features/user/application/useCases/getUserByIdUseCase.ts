import { inject, injectable } from "tsyringe";
import { DI_TOKENS } from "@/core/infrastructure/di/tokens";
import type { IUserRepository } from "../../domain/IUserRepository";
import type { UserWithSync } from "../../domain/user.types";

@injectable()
export class GetUserByIdUseCase {
  constructor(
    @inject(DI_TOKENS.IUserRepository)
    private userRepository: IUserRepository
  ) {}

  async execute(id: string, isOnline: boolean): Promise<UserWithSync> {
    return this.userRepository.getById(id, isOnline);
  }
}