import { DI_TOKENS } from "@/core/infrastructure/di/tokens";
import { inject, injectable } from "tsyringe";
import type { IActorRepository } from "../../domain/IActorRepository";

@injectable()
export class AddBuyersToExporterBulkUseCase {
  constructor(
    @inject(DI_TOKENS.IActorRepository)
    private actorRepository: IActorRepository
  ) {}

  async execute(
    data: {
      exporterId: string;
      buyerIds: string[];
    },
    editOffline?: boolean,
    entityId?: string
  ): Promise<void> {
    await this.actorRepository.addBuyersToExporterBulk(data, editOffline, entityId);
  }
}
