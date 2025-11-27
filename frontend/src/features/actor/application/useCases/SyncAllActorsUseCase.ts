import { DI_TOKENS } from "@/core/infrastructure/di/tokens";
import { inject, injectable } from "tsyringe";
import type { IActorRepository } from "../../domain/IActorRepository";
import type { SyncAllActorsResult } from "../../domain/actor.types";

@injectable()
export class SyncAllActorsUseCase {
  constructor(
    @inject(DI_TOKENS.IActorRepository)
    private actorRepository: IActorRepository
  ) {}

  /**
   * Synchronise tous les acteurs depuis le backend
   * @param actorTypes - Types d'acteurs à synchroniser (optionnel, tous par défaut)
   * @returns Résultat de la synchronisation
   */
  async execute(actorTypes?: string[]): Promise<SyncAllActorsResult> {
    return this.actorRepository.syncAll(actorTypes);
  }
}
