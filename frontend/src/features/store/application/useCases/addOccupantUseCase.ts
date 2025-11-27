import { inject, injectable } from "tsyringe";
import { DI_TOKENS } from "@/core/infrastructure/di/tokens";
import type { IStoreRepository } from '../../domain/IStoreRepository';

@injectable()
export class AddOccupantUseCase {
  constructor(
    @inject(DI_TOKENS.IStoreRepository)
    private storeRepository: IStoreRepository
  ) {}

  async execute(storeId: string, actorId: string, isOnline: boolean = true): Promise<void> {
    return this.storeRepository.addOccupant(storeId, actorId, isOnline);
  }
}
