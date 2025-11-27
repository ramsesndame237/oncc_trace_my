import { DI_TOKENS } from "@/core/infrastructure/di/tokens";
import { inject, injectable } from "tsyringe";
import type { IActorRepository } from "../../domain/IActorRepository";

@injectable()
export class AddProducerToOpaUseCase {
  constructor(
    @inject(DI_TOKENS.IActorRepository)
    private actorRepository: IActorRepository
  ) {}

  async execute(opaId: string, producerId: string): Promise<void> {
    await this.actorRepository.addProducerToOpa(opaId, producerId);
  }
}
