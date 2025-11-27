import { DI_TOKENS } from "@/core/infrastructure/di/tokens";
import { inject, injectable } from "tsyringe";
import type { ITransactionRepository } from "../../domain/ITransactionRepository";
import type { TransactionWithSync } from "../../domain/Transaction";

@injectable()
export class GetTransactionByIdUseCase {
  constructor(
    @inject(DI_TOKENS.ITransactionRepository)
    private transactionRepository: ITransactionRepository
  ) {}

  async execute(id: string, isOnline: boolean): Promise<TransactionWithSync> {
    return this.transactionRepository.getById(id, isOnline);
  }
}
