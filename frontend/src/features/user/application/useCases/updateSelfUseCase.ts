import { DI_TOKENS } from "@/core/infrastructure/di/tokens";
import { inject, injectable } from "tsyringe";
import type { IUserRepository } from "../../domain/IUserRepository";
import type { UserResponse } from "../../domain/types";
import type { UpdateSelfRequest } from "../../domain/types/request";

@injectable()
export class UpdateSelfUseCase {
  constructor(
    @inject(DI_TOKENS.IUserRepository) private userRepository: IUserRepository
  ) {}

  async execute(data: UpdateSelfRequest): Promise<UserResponse> {
    return await this.userRepository.updateSelf(data);
  }
}
