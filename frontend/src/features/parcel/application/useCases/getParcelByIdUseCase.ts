import { DI_TOKENS } from "@/core/infrastructure/di/tokens";
import { inject, injectable } from "tsyringe";
import type { IParcelRepository } from "../../domain/IParcelRepository";
import type { ApiParcelResponse } from "../../domain/parcel.types";

@injectable()
export class GetParcelByIdUseCase {
  constructor(
    @inject(DI_TOKENS.IParcelRepository)
    private parcelRepository: IParcelRepository
  ) {}

  async execute(
    parcelId: string,
    entityId?: string
  ): Promise<ApiParcelResponse> {
    return this.parcelRepository.getById(parcelId, entityId);
  }
}
