import { DI_TOKENS } from '@/core/infrastructure/di/tokens'
import { inject, injectable } from 'tsyringe'
import type { IProductTransferRepository } from '../../domain/IProductTransferRepository'
import type { CreateProductTransferRequest } from '../../domain/types/request'

/**
 * Use case pour créer un nouveau transfert de produit
 */
@injectable()
export class CreateProductTransferUseCase {
  constructor(
    @inject(DI_TOKENS.IProductTransferRepository)
    private repository: IProductTransferRepository
  ) {}

  /**
   * Exécute le use case pour créer un transfert de produit
   * @param payload - Données du transfert à créer
   * @param isOnline - Indique si l'application est en ligne
   */
  public async execute(payload: CreateProductTransferRequest, isOnline: boolean = true): Promise<void> {
    return this.repository.create(payload, isOnline)
  }
}
