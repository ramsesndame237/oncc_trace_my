import { PaginationMeta } from "@/core/domain/types";
import { ProductTransferWithSync, ProductTransferFilters, TransferStatus } from "./ProductTransfer";
import { CreateProductTransferRequest, UpdateProductTransferRequest } from "./types/request";

/**
 * State du store ProductTransfer
 */
export interface ProductTransferState {
  productTransfers: ProductTransferWithSync[];
  meta: PaginationMeta | null;
  filters: ProductTransferFilters;
  isLoading: boolean;
  error: string | null;
  isOnline: boolean;
}

/**
 * Actions du store ProductTransfer
 */
export interface ProductTransferActions {
  setFilters: (filters: Partial<ProductTransferFilters>) => void;
  fetchProductTransfers: (force?: boolean) => Promise<void>;
  fetchProductTransferById: (id: string) => Promise<ProductTransferWithSync | null>;
  createProductTransfer: (payload: CreateProductTransferRequest) => Promise<void>;
  updateProductTransfer: (id: string, payload: UpdateProductTransferRequest, editOffline?: boolean) => Promise<void>;
  deleteProductTransfer: (id: string) => Promise<void>;
  updateTransferStatus: (id: string, status: TransferStatus) => Promise<void>;
}

/**
 * Store complet (State + Actions)
 */
export type ProductTransferStore = ProductTransferState & ProductTransferActions;
