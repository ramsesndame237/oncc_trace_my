import { DI_TOKENS } from "@/core/infrastructure/di/tokens";
import { inject, injectable } from "tsyringe";
import type { IConventionRepository } from "../../domain/IConventionRepository";
import type { ConventionWithSync } from "../../domain/types";

/**
 * Use case pour mettre à jour une convention existante
 */
@injectable()
export class UpdateConventionUseCase {
  constructor(
    @inject(DI_TOKENS.IConventionRepository)
    private repository: IConventionRepository
  ) {}

  /**
   * Exécute le use case pour mettre à jour une convention
   * @param id - ID de la convention à mettre à jour
   * @param convention - Données partielles de la convention à mettre à jour
   * @param editOffline - Si true, modifie l'opération pendante existante
   */
  public async execute(
    id: string,
    convention: Partial<ConventionWithSync>,
    editOffline?: boolean
  ): Promise<void> {
    return this.repository.update(id, convention, editOffline);
  }
}
