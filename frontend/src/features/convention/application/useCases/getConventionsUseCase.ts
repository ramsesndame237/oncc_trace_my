import { DI_TOKENS } from "@/core/infrastructure/di/tokens";
import { inject, injectable } from "tsyringe";
import type { IConventionRepository } from "../../domain/IConventionRepository";
import type {
  ConventionFilters,
  GetConventionsResult,
} from "../../domain/types";

@injectable()
export class GetConventionsUseCase {
  constructor(
    @inject(DI_TOKENS.IConventionRepository)
    private conventionRepository: IConventionRepository
  ) {}

  /**
   * Récupère toutes les conventions selon les filtres
   * @param filters - Filtres de recherche
   * @param isOnline - Indicateur de connexion réseau
   * @returns Liste paginée des conventions
   */
  async execute(
    filters: ConventionFilters,
    isOnline: boolean
  ): Promise<GetConventionsResult> {
    return this.conventionRepository.getAll(filters, isOnline);
  }
}
