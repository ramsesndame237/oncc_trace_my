import { DI_TOKENS } from "@/core/infrastructure/di/tokens";
import { inject, injectable } from "tsyringe";
import type { ITransactionRepository } from "../../domain/ITransactionRepository";
import type { TransactionStatus } from "../../domain/Transaction";

@injectable()
export class UpdateTransactionStatusUseCase {
  constructor(
    @inject(DI_TOKENS.ITransactionRepository)
    private transactionRepository: ITransactionRepository
  ) {}

  async execute(id: string, status: TransactionStatus): Promise<void> {
    return this.transactionRepository.updateStatus(id, status);
  }
}
