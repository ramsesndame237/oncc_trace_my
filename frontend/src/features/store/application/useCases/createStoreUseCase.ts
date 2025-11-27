import { DI_TOKENS } from "@/core/infrastructure/di/tokens";
import { inject, injectable } from "tsyringe";
import type { IStoreRepository } from "../../domain/IStoreRepository";
import type { CreateStoreRequest } from "../../domain/types/request";
import type { StoreWithSync } from "../../domain/store.domain.types";

/**
 * Use case pour créer un nouveau magasin
 */
@injectable()
export class CreateStoreUseCase {
  constructor(
    @inject(DI_TOKENS.IStoreRepository)
    private repository: IStoreRepository
  ) {}

  /**
   * Exécute le use case pour créer un magasin
   */
  public async execute(
    request: CreateStoreRequest,
    isOnline: boolean = true
  ): Promise<void> {
    // Convertir CreateStoreRequest en StoreWithSync pour le repository
    const storeData: Omit<StoreWithSync, "id"> = {
      name: request.name,
      code: request.code || null,
      storeType: request.storeType || null,
      capacity: request.capacity || null,
      surfaceArea: request.surfaceArea || null,
      locationCode: request.locationCode,
      status: request.status || "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await this.repository.add(storeData, isOnline);
  }
}