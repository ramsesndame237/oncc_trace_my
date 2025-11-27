import { ensureDIConfigured } from '@/core/infrastructure/di/container'
import { container } from 'tsyringe'
import {
  GetTransactionsUseCase,
  GetTransactionByIdUseCase,
  CreateTransactionUseCase,
  UpdateTransactionUseCase,
  UpdateTransactionStatusUseCase,
} from '../../application/useCases'

export class TransactionServiceProvider {
  static getGetTransactionsUseCase(): GetTransactionsUseCase {
    ensureDIConfigured()
    return container.resolve(GetTransactionsUseCase)
  }

  static getGetTransactionByIdUseCase(): GetTransactionByIdUseCase {
    ensureDIConfigured()
    return container.resolve(GetTransactionByIdUseCase)
  }

  static getCreateTransactionUseCase(): CreateTransactionUseCase {
    ensureDIConfigured()
    return container.resolve(CreateTransactionUseCase)
  }

  static getUpdateTransactionUseCase(): UpdateTransactionUseCase {
    ensureDIConfigured()
    return container.resolve(UpdateTransactionUseCase)
  }

  static getUpdateTransactionStatusUseCase(): UpdateTransactionStatusUseCase {
    ensureDIConfigured()
    return container.resolve(UpdateTransactionStatusUseCase)
  }
}
