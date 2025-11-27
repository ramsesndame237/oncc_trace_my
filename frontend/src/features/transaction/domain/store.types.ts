import { PaginationMeta } from "@/core/domain";
import { TransactionFilters, TransactionWithSync } from "./Transaction";

export interface TransactionState {
  transactions: TransactionWithSync[];
  meta: PaginationMeta | null;
  filters: TransactionFilters;
  isLoading: boolean;
  error: string | null;
  isOnline: boolean;
}

export interface TransactionStore extends TransactionState {
  setFilters: (filters: Partial<TransactionFilters>) => void;
  fetchTransactions: (
    forceOrFilters?: boolean | Partial<TransactionFilters>
  ) => Promise<void>;
  clearError: () => void;
}
