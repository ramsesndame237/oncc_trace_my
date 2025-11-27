import { inject, injectable } from "tsyringe";
import { DI_TOKENS } from "@/core/infrastructure/di/tokens";
import type { IUserRepository } from "../../domain/IUserRepository";
import type { UserFilters, GetUsersResult } from "../../domain/user.types";

@injectable()
export class GetUsersUseCase {
  constructor(
    @inject(DI_TOKENS.IUserRepository)
    private userRepository: IUserRepository
  ) {}

  async execute(filters: UserFilters, isOnline: boolean): Promise<GetUsersResult> {
    return this.userRepository.getAll(filters, isOnline);
  }
}