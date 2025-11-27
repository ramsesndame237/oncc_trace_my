import { inject, injectable } from 'tsyringe'
import { DI_TOKENS } from '@/core/infrastructure/di/tokens'
import type { ITransactionRepository } from '../../domain/ITransactionRepository'
import type {
  GetTransactionsResult,
  TransactionFilters,
} from '../../domain/Transaction'

@injectable()
export class GetTransactionsUseCase {
  constructor(
    @inject(DI_TOKENS.ITransactionRepository)
    private transactionRepository: ITransactionRepository
  ) {}

  async execute(
    filters: TransactionFilters,
    isOnline: boolean
  ): Promise<GetTransactionsResult> {
    return await this.transactionRepository.getAll(filters, isOnline)
  }
}
