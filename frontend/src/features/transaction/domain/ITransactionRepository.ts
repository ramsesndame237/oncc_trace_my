import {
  GetTransactionsResult,
  TransactionFilters,
  TransactionWithSync,
  TransactionStatus,
} from "./Transaction";
import type { TransactionProductForm } from "../infrastructure/store/saleAddFormStore";

export interface ITransactionRepository {
  getAll(
    filters: TransactionFilters,
    isOnline: boolean
  ): Promise<GetTransactionsResult>;

  /**
   * Récupère une transaction par son ID
   */
  getById(id: string, isOnline: boolean): Promise<TransactionWithSync>;

  /**
   * Ajoute une nouvelle transaction (stockage local + file d'attente de sync)
   */
  add(
    transaction: Omit<TransactionWithSync, "id">,
    isOnline: boolean
  ): Promise<void>;

  /**
   * Met à jour une transaction existante
   * @param editOffline - Si true, met à jour une opération pendante existante
   */
  update(
    id: string,
    transaction: Partial<TransactionWithSync>,
    editOffline?: boolean
  ): Promise<void>;

  /**
   * Met à jour le statut d'une transaction (confirm ou cancel)
   */
  updateStatus(id: string, status: TransactionStatus): Promise<void>;

  /**
   * Met à jour les produits d'une transaction
   */
  updateProducts(
    id: string,
    products: TransactionProductForm[]
  ): Promise<TransactionWithSync>;
}

