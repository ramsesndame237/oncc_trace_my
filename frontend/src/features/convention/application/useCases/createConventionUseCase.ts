import { DI_TOKENS } from "@/core/infrastructure/di/tokens";
import { inject, injectable } from "tsyringe";
import type { IConventionRepository } from "../../domain/IConventionRepository";
import type { ConventionWithSync } from "../../domain/types";

/**
 * Use case pour créer une nouvelle convention
 */
@injectable()
export class CreateConventionUseCase {
  constructor(
    @inject(DI_TOKENS.IConventionRepository)
    private repository: IConventionRepository
  ) {}

  /**
   * Exécute le use case pour créer une convention
   * @param convention - Données de la convention à créer
   * @param isOnline - Indicateur de connexion réseau
   */
  public async execute(
    convention: Omit<ConventionWithSync, "id">,
    isOnline: boolean
  ): Promise<void> {
    await this.repository.add(convention, isOnline);
  }
}
