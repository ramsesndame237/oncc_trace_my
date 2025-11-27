import { DI_TOKENS } from '@/core/infrastructure/di/tokens'
import { inject, injectable } from 'tsyringe'
import type { IProductTransferRepository } from '../../domain'
import type { ProductTransferWithSync } from '../../domain'

/**
 * Use case pour récupérer un transfert de produit par son ID
 */
@injectable()
export class GetProductTransferByIdUseCase {
  constructor(
    @inject(DI_TOKENS.IProductTransferRepository)
    private repository: IProductTransferRepository
  ) {}

  /**
   * Exécute le use case pour récupérer un transfert par son ID
   * @param id - ID du transfert à récupérer
   * @param isOnline - Indique si l'application est en ligne
   */
  public async execute(
    id: string,
    isOnline: boolean = true
  ): Promise<ProductTransferWithSync> {
    return await this.repository.getById(id, isOnline)
  }
}
