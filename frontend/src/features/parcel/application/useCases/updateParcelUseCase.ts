import { inject, injectable } from "tsyringe";
import { DI_TOKENS } from "@/core/infrastructure/di/tokens";
import type { IParcelRepository } from "../../domain/IParcelRepository";
import type { UpdateParcelData } from "../../domain/parcel.types";

@injectable()
export class UpdateParcelUseCase {
  constructor(
    @inject(DI_TOKENS.IParcelRepository)
    private parcelRepository: IParcelRepository
  ) {}

  /**
   * Met à jour une parcelle (stockage local + synchronisation)
   * @param parcelId - ID de la parcelle
   * @param data - Données de mise à jour
   * @param entityId - ID de l'entité pour mettre à jour une opération existante
   */
  async execute(parcelId: string, data: UpdateParcelData, entityId?: string): Promise<void> {
    return this.parcelRepository.updateParcel(parcelId, data, entityId);
  }
}
