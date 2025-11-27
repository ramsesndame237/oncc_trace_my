import { DI_TOKENS } from "@/core/infrastructure/di/tokens";
import { inject, injectable } from "tsyringe";
import type { IStoreRepository } from "../../domain/IStoreRepository";
import { GetStoresResult, StoreFilters } from "../../domain/store.domain.types";

/**
 * Cas d'usage pour récupérer la liste des magasins
 */
@injectable()
export class GetStoresUseCase {
  constructor(
    @inject(DI_TOKENS.IStoreRepository)
    private storeRepository: IStoreRepository
  ) {}

  async execute(
    filters: StoreFilters = {},
    isOnline: boolean = true
  ): Promise<GetStoresResult> {
    return this.storeRepository.getAll(filters, isOnline);
  }
}
