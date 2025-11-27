import { DI_TOKENS } from "@/core/infrastructure/di/tokens";
import { inject, injectable } from "tsyringe";
import type { IConventionRepository } from "../../domain/IConventionRepository";
import type { ConventionWithSync } from "../../domain/types";

@injectable()
export class GetConventionByIdUseCase {
  constructor(
    @inject(DI_TOKENS.IConventionRepository)
    private conventionRepository: IConventionRepository
  ) {}

  /**
   * Récupère une convention par son ID
   * @param id - ID de la convention
   * @param isOnline - Indicateur de connexion réseau
   * @returns La convention trouvée avec metadata de synchronisation
   */
  async execute(id: string, isOnline: boolean): Promise<ConventionWithSync> {
    return this.conventionRepository.getById(id, isOnline);
  }
}
