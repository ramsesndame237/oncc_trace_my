import { DI_TOKENS } from "@/core/infrastructure/di/tokens";
import { inject, injectable } from "tsyringe";
import type { IUserRepository } from "../../domain/IUserRepository";
import type { UpdateUserRequest } from "../../domain/types/request";
import type { UserWithSync } from "../../domain/user.types";

/**
 * Use case pour mettre à jour les informations d'un utilisateur
 */
@injectable()
export class UpdateUserUseCase {
  constructor(
    @inject(DI_TOKENS.IUserRepository)
    private repository: IUserRepository
  ) {}

  /**
   * Exécute le use case pour mettre à jour un utilisateur
   * @param id - ID de l'utilisateur à mettre à jour
   * @param request - Données à mettre à jour
   * @param isOnline - Indique si l'application est en ligne
   */
  public async execute(
    id: string,
    request: UpdateUserRequest,
    isOnline: boolean = true
  ): Promise<void> {
    // Convertir UpdateUserRequest en UserWithSync pour le repository
    const userData: Partial<UserWithSync> = {
      email: request.email,
      phone: request.phone,
      givenName: request.givenName,
      familyName: request.familyName,
      role: request.role as UserWithSync["role"],
      position: request.position,
      lang: request.lang,
      productionBasinId: request.productionBasinId,
      status: request.status,
    };

    // Filtrer les valeurs undefined pour ne pas les passer au repository
    const cleanUserData = Object.fromEntries(
      Object.entries(userData).filter(([, value]) => value !== undefined)
    ) as Partial<UserWithSync>;

    await this.repository.update(id, cleanUserData, isOnline);
  }
}