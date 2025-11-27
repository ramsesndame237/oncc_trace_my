import { DI_TOKENS } from "@/core/infrastructure/di/tokens";
import { inject, injectable } from "tsyringe";
import type { IUserRepository } from "../../domain/IUserRepository";
import type { CreateUserRequest } from "../../domain/types/request";
import type { UserWithSync } from "../../domain/user.types";

/**
 * Use case pour créer un nouvel utilisateur
 */
@injectable()
export class CreateUserUseCase {
  constructor(
    @inject(DI_TOKENS.IUserRepository)
    private repository: IUserRepository
  ) {}

  /**
   * Exécute le use case pour créer un utilisateur
   */
  public async execute(request: CreateUserRequest): Promise<void> {
    // Convertir CreateUserRequest en UserWithSync pour le repository
    const userData: Omit<UserWithSync, "id"> = {
      username: "", // Sera généré par le backend
      email: request.email,
      phone: request.phone,
      givenName: request.givenName,
      familyName: request.familyName,
      role: request.role as UserWithSync["role"],
      position: request.position,
      lang: request.lang,
      status: "active",
      productionBasinId: request.productionBasinId,
      fullName: `${request.familyName} ${request.givenName}`,
    };

    await this.repository.add(userData, true);
  }
}
