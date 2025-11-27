import { DI_TOKENS } from "@/core/infrastructure/di/tokens";
import { inject, injectable } from "tsyringe";
import type {
  GetProductionBasinsResult,
  IProductionBasinRepository,
} from "../../domain/IProductionBasinRepository";
import type { ProductionBasinFilters } from "../../domain/productionBasin.types";

/**
 * Use case pour récupérer tous les bassins de production
 */
@injectable()
export class GetProductionBasinsUseCase {
  constructor(
    @inject(DI_TOKENS.IProductionBasinRepository)
    private repository: IProductionBasinRepository
  ) {}

  /**
   * Exécute le use case pour récupérer tous les bassins
   * @param isOnline - Indique si l'application est en ligne pour déterminer la source des données
   * @param filters - Filtres optionnels pour la recherche et la pagination
   * @returns Une promesse résolue avec les bassins et les métadonnées de pagination
   */
  public async execute(
    isOnline: boolean,
    filters?: ProductionBasinFilters
  ): Promise<GetProductionBasinsResult> {
    return this.repository.getAll(isOnline, filters);
  }
}
