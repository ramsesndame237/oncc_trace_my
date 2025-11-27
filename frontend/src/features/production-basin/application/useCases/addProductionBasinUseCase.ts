import { DI_TOKENS } from "@/core/infrastructure/di/tokens";
import { inject, injectable } from "tsyringe";
import { CreateProductionBasinRequest } from "../../domain";
import type { IProductionBasinRepository } from "../../domain/IProductionBasinRepository";

/**
 * Use case pour ajouter un nouveau bassin de production
 */
@injectable()
export class AddProductionBasinUseCase {
  constructor(
    @inject(DI_TOKENS.IProductionBasinRepository)
    private repository: IProductionBasinRepository
  ) {}

  /**
   * Exécute le use case pour ajouter un bassin
   */
  public async execute(data: CreateProductionBasinRequest): Promise<void> {
    return await this.repository.add(data);
  }
}
