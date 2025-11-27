import { inject, injectable } from "tsyringe";
import { DI_TOKENS } from "@/core/infrastructure/di/tokens";
import type { IStoreRepository } from '../../domain/IStoreRepository';

@injectable()
export class RemoveOccupantUseCase {
  constructor(
    @inject(DI_TOKENS.IStoreRepository)
    private storeRepository: IStoreRepository
  ) {}

  async execute(storeId: string, actorId: string, isOnline: boolean = true): Promise<void> {
    return this.storeRepository.removeOccupant(storeId, actorId, isOnline);
  }
}
