import { inject, injectable } from "tsyringe";
import { DI_TOKENS } from "@/core/infrastructure/di/tokens";
import type { IParcelRepository } from "../../domain/IParcelRepository";
import type { ApiParcelResponse, ParcelStatus } from "../../domain/parcel.types";

@injectable()
export class UpdateParcelStatusUseCase {
  constructor(
    @inject(DI_TOKENS.IParcelRepository)
    private parcelRepository: IParcelRepository
  ) {}

  async execute(parcelId: string, status: ParcelStatus): Promise<ApiParcelResponse> {
    return this.parcelRepository.updateParcelStatus(parcelId, status);
  }
}
