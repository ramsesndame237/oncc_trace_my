import { DI_TOKENS } from "@/core/infrastructure/di/tokens";
import { inject, injectable } from "tsyringe";
import type { IStoreRepository } from "../../domain/IStoreRepository";
import type { UpdateStoreRequest } from "../../domain/types/request";
import type { StoreWithSync } from "../../domain/store.domain.types";

/**
 * Use case pour mettre à jour les informations d'un magasin
 */
@injectable()
export class UpdateStoreUseCase {
  constructor(
    @inject(DI_TOKENS.IStoreRepository)
    private repository: IStoreRepository
  ) {}

  /**
   * Exécute le use case pour mettre à jour un magasin
   * @param id - ID du magasin à mettre à jour
   * @param request - Données à mettre à jour (sans l'id)
   * @param isOnline - Indique si l'application est en ligne
   */
  public async execute(
    id: string,
    request: Omit<UpdateStoreRequest, 'id'>,
    isOnline: boolean = true
  ): Promise<void> {
    // Convertir UpdateStoreRequest en StoreWithSync pour le repository
    const storeData: Partial<StoreWithSync> = {
      name: request.name,
      code: request.code,
      storeType: request.storeType,
      capacity: request.capacity,
      surfaceArea: request.surfaceArea,
      locationCode: request.locationCode,
      status: request.status,
      updatedAt: new Date().toISOString(),
    };

    // Filtrer les valeurs undefined pour ne pas les passer au repository
    const cleanStoreData = Object.fromEntries(
      Object.entries(storeData).filter(([, value]) => value !== undefined)
    ) as Partial<StoreWithSync>;

    await this.repository.update(id, cleanStoreData, isOnline);
  }
}