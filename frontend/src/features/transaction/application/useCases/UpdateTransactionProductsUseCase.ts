import { DI_TOKENS } from "@/core/infrastructure/di/tokens";
import type { ITransactionRepository } from "@/features/transaction/domain/ITransactionRepository";
import type { TransactionWithSync } from "@/features/transaction/domain/Transaction";
import type { TransactionProductForm } from "@/features/transaction/infrastructure/store/saleAddFormStore";
import { inject, injectable } from "tsyringe";

@injectable()
export class UpdateTransactionProductsUseCase {
  constructor(
    @inject(DI_TOKENS.ITransactionRepository)
    private transactionRepository: ITransactionRepository
  ) {}

  async execute(
    id: string,
    products: TransactionProductForm[]
  ): Promise<TransactionWithSync> {
    return this.transactionRepository.updateProducts(id, products);
  }
}
