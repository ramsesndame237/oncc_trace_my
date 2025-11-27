import { DI_TOKENS } from "@/core/infrastructure/di/tokens";
import { inject, injectable } from "tsyringe";
import type { IActorRepository } from "../../domain/IActorRepository";
import type { ActorFilters, GetActorsResult } from "../../domain/actor.types";

@injectable()
export class GetActorsUseCase {
  constructor(
    @inject(DI_TOKENS.IActorRepository)
    private actorRepository: IActorRepository
  ) {}

  /**
   * Récupère tous les acteurs selon les filtres
   * @param filters - Filtres de recherche
   * @param isOnline - Indicateur de connexion réseau
   * @returns Liste paginée des acteurs
   */
  async execute(
    filters: ActorFilters,
    isOnline: boolean
  ): Promise<GetActorsResult> {
    return this.actorRepository.getAll(filters, isOnline);
  }
}
