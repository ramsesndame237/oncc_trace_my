import { DI_TOKENS } from "@/core/infrastructure/di/tokens";
import { inject, injectable } from "tsyringe";
import type { IProductionBasinRepository } from "../../domain/IProductionBasinRepository";
import type { ProductionBasinWithSync } from "../../domain/productionBasin.types";

/**
 * Use case pour récupérer un bassin de production spécifique par son ID
 */
@injectable()
export class GetProductionBasinByIdUseCase {
  constructor(
    @inject(DI_TOKENS.IProductionBasinRepository)
    private repository: IProductionBasinRepository
  ) {}

  /**
   * Exécute le use case pour récupérer un bassin spécifique
   * @param id - ID du bassin à récupérer
   * @param isOnline - Indique si l'application est en ligne pour déterminer la source des données
   * @returns Une promesse résolue avec le bassin
   */
  public async execute(
    id: string,
    isOnline: boolean
  ): Promise<ProductionBasinWithSync> {
    return this.repository.getById(id, isOnline);
  }
}
