import { ensureDIConfigured } from "@/core/infrastructure/di/container";
import { SyncService } from "@/core/infrastructure/services/syncService";
import { PollingService } from "@/core/infrastructure/services/pollingService";
import { container } from "tsyringe";
import { DI_TOKENS } from "./tokens";

/**
 * Service Provider pour les services de synchronisation
 * Suit le même pattern que les autres features de l'application
 */
export class SyncServiceProvider {
  /**
   * Récupère une instance du SyncService
   */
  static getSyncService(): SyncService {
    ensureDIConfigured();
    return container.resolve<SyncService>(DI_TOKENS.SyncService);
  }

  /**
   * Récupère une instance du PollingService
   */
  static getPollingService(): PollingService {
    ensureDIConfigured();
    return container.resolve<PollingService>(DI_TOKENS.PollingService);
  }
}
