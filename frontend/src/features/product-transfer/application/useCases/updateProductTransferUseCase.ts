import { DI_TOKENS } from '@/core/infrastructure/di/tokens'
import { inject, injectable } from 'tsyringe'
import type { IProductTransferRepository } from '../../domain'
import type { UpdateProductTransferRequest } from '../../domain/types/request'

/**
 * Use case pour mettre à jour un transfert de produit
 */
@injectable()
export class UpdateProductTransferUseCase {
  constructor(
    @inject(DI_TOKENS.IProductTransferRepository)
    private repository: IProductTransferRepository
  ) {}

  /**
   * Exécute le use case pour mettre à jour un transfert de produit
   * @param id - ID du transfert à mettre à jour
   * @param request - Données à mettre à jour
   * @param editOffline - Si true, modifie l'opération pendante existante
   */
  public async execute(
    id: string,
    request: UpdateProductTransferRequest,
    editOffline?: boolean
  ): Promise<void> {
    await this.repository.update(id, request, editOffline)
  }
}
