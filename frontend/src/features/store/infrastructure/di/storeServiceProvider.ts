import { ensureDIConfigured } from "@/core/infrastructure/di/container";
import { DI_TOKENS } from '@/core/infrastructure/di/tokens'
import { container } from 'tsyringe'
import type { IStoreRepository } from '../../domain/IStoreRepository'
import { StoreRepository } from '../repositories/storeRepository'
import {
  ActivateStoreUseCase,
  AddOccupantUseCase,
  CreateStoreUseCase,
  DeactivateStoreUseCase,
  GetOccupantsUseCase,
  GetStoreByIdUseCase,
  GetStoresUseCase,
  RemoveOccupantUseCase,
  UpdateStoreUseCase,
} from "../../application/useCases";

/**
 * Configuration de l'injection de dépendance pour les magasins
 */
export class StoreServiceProvider {
  static register(): void {
    // Repository
    container.registerSingleton<IStoreRepository>(DI_TOKENS.IStoreRepository, StoreRepository)
  }

  static getGetStoresUseCase(): GetStoresUseCase {
    ensureDIConfigured();
    return container.resolve(GetStoresUseCase);
  }

  static getGetStoreByIdUseCase(): GetStoreByIdUseCase {
    ensureDIConfigured();
    return container.resolve(GetStoreByIdUseCase);
  }

  static getCreateStoreUseCase(): CreateStoreUseCase {
    ensureDIConfigured();
    return container.resolve(CreateStoreUseCase);
  }

  static getUpdateStoreUseCase(): UpdateStoreUseCase {
    ensureDIConfigured();
    return container.resolve(UpdateStoreUseCase);
  }

  static getActivateStoreUseCase(): ActivateStoreUseCase {
    ensureDIConfigured();
    return container.resolve(ActivateStoreUseCase);
  }

  static getDeactivateStoreUseCase(): DeactivateStoreUseCase {
    ensureDIConfigured();
    return container.resolve(DeactivateStoreUseCase);
  }

  static getAddOccupantUseCase(): AddOccupantUseCase {
    ensureDIConfigured();
    return container.resolve(AddOccupantUseCase);
  }

  static getRemoveOccupantUseCase(): RemoveOccupantUseCase {
    ensureDIConfigured();
    return container.resolve(RemoveOccupantUseCase);
  }

  static getGetOccupantsUseCase(): GetOccupantsUseCase {
    ensureDIConfigured();
    return container.resolve(GetOccupantsUseCase);
  }

}