import { DI_TOKENS } from "@/core/infrastructure/di/tokens";
import { inject, injectable } from "tsyringe";
import type { IActorRepository } from "../../domain/IActorRepository";

/**
 * Use case pour retirer un producteur d'une OPA
 */
@injectable()
export class RemoveProducerFromOpaUseCase {
  constructor(
    @inject(DI_TOKENS.IActorRepository)
    private actorRepository: IActorRepository
  ) {}

  /**
   * Exécute le use case pour retirer un producteur d'une OPA
   * @param opaId - ID de l'OPA
   * @param producerId - ID du producteur à retirer
   */
  async execute(opaId: string, producerId: string): Promise<void> {
    await this.actorRepository.removeProducerFromOpa(opaId, producerId);
  }
}
