import { DI_TOKENS } from "@/core/infrastructure/di/tokens";
import { inject, injectable } from "tsyringe";
import type { IStoreRepository } from "../../domain/IStoreRepository";

/**
 * Use case pour désactiver un magasin (supprimer son association avec la campagne en cours)
 */
@injectable()
export class DeactivateStoreUseCase {
  constructor(
    @inject(DI_TOKENS.IStoreRepository)
    private repository: IStoreRepository
  ) {}

  /**
   * Exécute le use case pour désactiver un magasin
   * @param id - ID du magasin à désactiver
   */
  public async execute(id: string): Promise<void> {
    await this.repository.deactivate(id);
  }
}