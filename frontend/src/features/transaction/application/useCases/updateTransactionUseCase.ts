import { DI_TOKENS } from "@/core/infrastructure/di/tokens";
import type { ITransactionRepository } from "@/features/transaction/domain/ITransactionRepository";
import type { TransactionWithSync } from "@/features/transaction/domain/Transaction";
import { inject, injectable } from "tsyringe";

@injectable()
export class UpdateTransactionUseCase {
  constructor(
    @inject(DI_TOKENS.ITransactionRepository)
    private transactionRepository: ITransactionRepository
  ) {}

  async execute(
    id: string,
    transactionData: Partial<TransactionWithSync>,
    editOffline?: boolean
  ): Promise<void> {
    return this.transactionRepository.update(id, transactionData, editOffline);
  }
}
