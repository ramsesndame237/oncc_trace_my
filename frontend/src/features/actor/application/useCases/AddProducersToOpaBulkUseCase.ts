import { DI_TOKENS } from "@/core/infrastructure/di/tokens";
import { inject, injectable } from "tsyringe";
import type { IActorRepository } from "../../domain/IActorRepository";

@injectable()
export class AddProducersToOpaBulkUseCase {
  constructor(
    @inject(DI_TOKENS.IActorRepository)
    private actorRepository: IActorRepository
  ) {}

  async execute(
    data: {
      opaId: string;
      producerIds: string[];
    },
    editOffline?: boolean,
    entityId?: string
  ): Promise<void> {
    await this.actorRepository.addProducersToOpaBulk(data, editOffline, entityId);
  }
}
