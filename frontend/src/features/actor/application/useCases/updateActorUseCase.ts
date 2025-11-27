import { DI_TOKENS } from "@/core/infrastructure/di/tokens";
import { inject, injectable } from "tsyringe";
import type { IActorRepository } from "../../domain/IActorRepository";
import type { ActorWithSync } from "../../domain/actor.types";

@injectable()
export class UpdateActorUseCase {
  constructor(
    @inject(DI_TOKENS.IActorRepository)
    private actorRepository: IActorRepository
  ) {}

  /**
   * Met à jour un acteur existant
   * @param id - ID de l'acteur à mettre à jour
   * @param actor - Données de l'acteur à mettre à jour
   * @param editOffline - Indicateur de modification en mode offline
   */
  async execute(
    id: string,
    actor: Partial<ActorWithSync>,
    editOffline?: boolean
  ): Promise<void> {
    return this.actorRepository.update(id, actor, editOffline);
  }
}
