import { DI_TOKENS } from "@/core/infrastructure/di/tokens";
import { inject, injectable } from "tsyringe";
import type { IActorRepository } from "../../domain/IActorRepository";
import type { ActorWithSync } from "../../domain/actor.types";

@injectable()
export class CreateActorUseCase {
  constructor(
    @inject(DI_TOKENS.IActorRepository)
    private actorRepository: IActorRepository
  ) {}

  /**
   * Crée un nouvel acteur (stockage local + synchronisation)
   * @param actor - Données de l'acteur à créer
   * @param isOnline - Indicateur de connexion réseau
   * @returns L'ID local de l'acteur créé
   */
  async execute(
    actor: Omit<ActorWithSync, "id">,
    isOnline: boolean
  ): Promise<void> {
    return this.actorRepository.add(actor, isOnline);
  }
}
