import { ApiResponse } from "@/core/infrastructure/api";
import { Transaction } from "../Transaction";

export type TransactionResponse = Transaction;

export interface PaginatedTransactionsResponse {
  data: TransactionResponse[];
  meta: {
    total: number;
    perPage: number;
    currentPage: number;
    lastPage: number;
    firstPage: number;
    firstPageUrl: string;
    lastPageUrl: string;
    nextPageUrl: string | null;
    previousPageUrl: string | null;
  };
}

export type GetTransactionsResponse =
  ApiResponse<PaginatedTransactionsResponse>;
