import { DI_TOKENS } from "@/core/infrastructure/di/tokens";
import { inject, injectable } from "tsyringe";
import { UpdateProductionBasinRequest } from "../../domain";
import type { IProductionBasinRepository } from "../../domain/IProductionBasinRepository";

/**
 * Use case pour mettre à jour un bassin de production
 */
@injectable()
export class UpdateProductionBasinUseCase {
  constructor(
    @inject(DI_TOKENS.IProductionBasinRepository)
    private repository: IProductionBasinRepository
  ) {}

  /**
   * Exécute le use case pour mettre à jour un bassin
   */
  public async execute(
    data: UpdateProductionBasinRequest,
    isOnline: boolean
  ): Promise<void> {
    return await this.repository.update(data, isOnline);
  }
}
