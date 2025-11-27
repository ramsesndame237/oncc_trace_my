import { DI_TOKENS } from "@/core/infrastructure/di/tokens";
import type { ITransactionRepository } from "@/features/transaction/domain/ITransactionRepository";
import type { TransactionWithSync } from "@/features/transaction/domain/Transaction";
import { inject, injectable } from "tsyringe";

@injectable()
export class CreateTransactionUseCase {
  constructor(
    @inject(DI_TOKENS.ITransactionRepository)
    private transactionRepository: ITransactionRepository
  ) {}

  async execute(
    transactionData: Omit<TransactionWithSync, "id">,
    isOnline: boolean
  ): Promise<void> {
    return this.transactionRepository.add(transactionData, isOnline);
  }
}
