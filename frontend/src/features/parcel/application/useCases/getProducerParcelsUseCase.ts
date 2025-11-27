import { inject, injectable } from "tsyringe";
import { DI_TOKENS } from "@/core/infrastructure/di/tokens";
import type { IParcelRepository } from "../../domain/IParcelRepository";
import type { ApiParcelResponse, GetProducerParcelsFilters } from "../../domain/parcel.types";

@injectable()
export class GetProducerParcelsUseCase {
  constructor(
    @inject(DI_TOKENS.IParcelRepository)
    private parcelRepository: IParcelRepository
  ) {}

  async execute(filters: GetProducerParcelsFilters, isOnline: boolean): Promise<ApiParcelResponse[]> {
    return this.parcelRepository.getProducerParcels(filters, isOnline);
  }
}