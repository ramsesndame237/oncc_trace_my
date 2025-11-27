import { inject, injectable } from 'tsyringe'
import { DI_TOKENS } from '@/core/infrastructure/di/tokens'
import type { IProductTransferRepository } from '../../domain/IProductTransferRepository'
import type {
  ProductTransferFilters,
  GetProductTransfersResult,
} from '../../domain/product-transfer.types'

@injectable()
export class GetProductTransfersUseCase {
  constructor(
    @inject(DI_TOKENS.IProductTransferRepository)
    private productTransferRepository: IProductTransferRepository
  ) {}

  async execute(
    filters: ProductTransferFilters,
    isOnline: boolean
  ): Promise<GetProductTransfersResult> {
    return this.productTransferRepository.getAll(filters, isOnline)
  }
}
