import { DI_TOKENS } from "@/core/infrastructure/di/tokens";
import { inject, injectable } from "tsyringe";
import type { ILocationRepository } from "../../domain/ILocationRepository";

/**
 * Use case pour synchroniser les localisations depuis l'API
 */
@injectable()
export class SyncLocationsUseCase {
  constructor(
    @inject(DI_TOKENS.ILocationRepository)
    private repository: ILocationRepository
  ) {}

  /**
   * Exécute le use case pour synchroniser les localisations
   * @param force - Force la synchronisation même si elle n'est pas nécessaire
   * @returns Une promesse résolue quand la synchronisation est terminée
   */
  async execute(force: boolean = false): Promise<void> {
    if (force || (await this.repository.needsSync())) {
      await this.repository.syncFromApi();
    }
  }
}
