import { DI_TOKENS } from "@/core/infrastructure/di/tokens";
import { inject, injectable } from "tsyringe";
import type { IActorRepository } from "../../domain/IActorRepository";
import type { GetActorsResult } from "../../domain/actor.types";

@injectable()
export class GetProducerOpasUseCase {
  constructor(
    @inject(DI_TOKENS.IActorRepository)
    private actorRepository: IActorRepository
  ) {}

  async execute(
    producerId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<GetActorsResult> {
    return this.actorRepository.getProducerOpas(producerId, page, limit);
  }
}
