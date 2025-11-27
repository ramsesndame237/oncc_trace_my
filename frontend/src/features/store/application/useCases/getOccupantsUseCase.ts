import { inject, injectable } from "tsyringe";
import { DI_TOKENS } from "@/core/infrastructure/di/tokens";
import type { Actor } from '@/core/domain/actor.types';
import type { IStoreRepository } from '../../domain/IStoreRepository';

@injectable()
export class GetOccupantsUseCase {
  constructor(
    @inject(DI_TOKENS.IStoreRepository)
    private storeRepository: IStoreRepository
  ) {}

  async execute(storeId: string, isOnline: boolean = true): Promise<Actor[]> {
    return this.storeRepository.getOccupants(storeId, isOnline);
  }
}
