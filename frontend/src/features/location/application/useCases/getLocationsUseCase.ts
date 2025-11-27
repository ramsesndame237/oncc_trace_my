import { DI_TOKENS } from "@/core/infrastructure/di/tokens";
import { inject, injectable } from "tsyringe";
import type { ILocationRepository } from "../../domain/ILocationRepository";
import type {
  LocationFilters,
  LocationWithSync,
} from "../../domain/location.types";

/**
 * Use case pour récupérer toutes les localisations
 */
@injectable()
export class GetLocationsUseCase {
  constructor(
    @inject(DI_TOKENS.ILocationRepository)
    private repository: ILocationRepository
  ) {}

  /**
   * Exécute le use case pour récupérer toutes les localisations
   * @param isOnline - Indique si l'application est en ligne
   * @param filters - Filtres optionnels pour la recherche
   * @returns Une promesse résolue avec les localisations
   */
  async execute(
    isOnline: boolean,
    filters?: LocationFilters
  ): Promise<LocationWithSync[]> {
    return this.repository.getAll(isOnline, filters);
  }
}
