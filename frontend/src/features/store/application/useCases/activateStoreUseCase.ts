import { DI_TOKENS } from "@/core/infrastructure/di/tokens";
import { inject, injectable } from "tsyringe";
import type { IStoreRepository } from "../../domain/IStoreRepository";

/**
 * Use case pour activer un magasin (l'associer à la campagne en cours)
 */
@injectable()
export class ActivateStoreUseCase {
  constructor(
    @inject(DI_TOKENS.IStoreRepository)
    private repository: IStoreRepository
  ) {}

  /**
   * Exécute le use case pour activer un magasin
   * @param id - ID du magasin à activer
   */
  public async execute(id: string): Promise<void> {
    await this.repository.activate(id);
  }
}