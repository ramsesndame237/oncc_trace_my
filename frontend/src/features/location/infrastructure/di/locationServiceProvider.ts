import { ensureDIConfigured } from "@/core/infrastructure/di/container";
import { container } from "tsyringe";

// Use Cases
import { GetLocationsUseCase } from "../../application/useCases/getLocationsUseCase";
import { SyncLocationsUseCase } from "../../application/useCases/syncLocationsUseCase";

/**
 * Service Provider pour les use cases des localisations
 */
export class LocationServiceProvider {
  /**
   * Récupère une instance du use case GetLocations
   */
  static getGetLocationsUseCase(): GetLocationsUseCase {
    ensureDIConfigured();
    return container.resolve(GetLocationsUseCase);
  }

  /**
   * Récupère une instance du use case SyncLocations
   */
  static getSyncLocationsUseCase(): SyncLocationsUseCase {
    ensureDIConfigured();
    return container.resolve(SyncLocationsUseCase);
  }
}
