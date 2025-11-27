import { inject, injectable } from "tsyringe";
import { DI_TOKENS } from "@/core/infrastructure/di/tokens";
import type { IParcelRepository } from "../../domain/IParcelRepository";
import type { CreateParcelsBulkData, CreateParcelsBulkResult } from "../../domain/parcel.types";

@injectable()
export class CreateParcelsBulkUseCase {
  constructor(
    @inject(DI_TOKENS.IParcelRepository)
    private parcelRepository: IParcelRepository
  ) {}

  /**
   * Crée plusieurs parcelles pour un producteur (stockage local + synchronisation)
   * @param data - Données de création des parcelles
   * @param entityId - ID de l'entité pour mettre à jour une opération existante
   */
  async execute(data: CreateParcelsBulkData, entityId?: string): Promise<CreateParcelsBulkResult> {
    return this.parcelRepository.createParcelsBulk(data, entityId);
  }
}