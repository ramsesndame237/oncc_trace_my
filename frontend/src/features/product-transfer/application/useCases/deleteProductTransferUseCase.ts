import { DI_TOKENS } from '@/core/infrastructure/di/tokens'
import { inject, injectable } from 'tsyringe'
import type { IProductTransferRepository } from '../../domain'

/**
 * Use case pour supprimer un transfert de produit
 */
@injectable()
export class DeleteProductTransferUseCase {
  constructor(
    @inject(DI_TOKENS.IProductTransferRepository)
    private repository: IProductTransferRepository
  ) {}

  /**
   * Exécute le use case pour supprimer un transfert de produit
   * @param id - ID du transfert à supprimer
   * @param isOnline - Indique si l'application est en ligne
   */
  public async execute(id: string, isOnline: boolean = true): Promise<void> {
    await this.repository.delete(id, isOnline)
  }
}
