import { DI_TOKENS } from "@/core/infrastructure/di/tokens";
import { inject, injectable } from "tsyringe";
import type { IActorRepository } from "../../domain/IActorRepository";

export type ActorStatus = "active" | "inactive" | "pending";

/**
 * Use case pour mettre à jour le statut d'un acteur
 */
@injectable()
export class UpdateActorStatusUseCase {
  constructor(
    @inject(DI_TOKENS.IActorRepository)
    private actorRepository: IActorRepository
  ) {}

  /**
   * Exécute le use case pour mettre à jour le statut d'un acteur
   * @param id - ID de l'acteur
   * @param status - Nouveau statut ("active", "inactive" ou "pending")
   */
  async execute(id: string, status: ActorStatus): Promise<void> {
    await this.actorRepository.updateStatus(id, status);
  }
}
