import { inject, injectable } from "tsyringe";
import { DI_TOKENS } from "@/core/infrastructure/di/tokens";
import type { IActorRepository } from "../../domain/IActorRepository";
import type { ActorWithSync } from "../../domain/actor.types";

@injectable()
export class GetActorByIdUseCase {
  constructor(
    @inject(DI_TOKENS.IActorRepository)
    private actorRepository: IActorRepository
  ) {}

  async execute(id: string, isOnline: boolean): Promise<ActorWithSync> {
    return this.actorRepository.getById(id, isOnline);
  }
}