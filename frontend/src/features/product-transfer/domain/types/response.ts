import { ProductTransfer } from "../ProductTransfer";
import type { ApiResponse } from "@/core/infrastructure/types/api.type";
import { PaginationMeta } from "@/core/domain/types";

/**
 * Réponse pour un transfert de produit
 */
export interface ProductTransferResponse extends Omit<ProductTransfer, "createdAt" | "updatedAt"> {
  createdAt: string;
  updatedAt: string;
}

/**
 * Réponse paginée pour la liste des transferts
 */
export interface PaginatedProductTransfersResponse {
  data: ProductTransferResponse[];
  meta: PaginationMeta;
}

/**
 * Réponse pour récupérer la liste des transferts
 */
export type GetProductTransfersResponse = ApiResponse<PaginatedProductTransfersResponse>;

/**
 * Réponse pour récupérer un transfert
 */
export type GetProductTransferResponse = ApiResponse<ProductTransferResponse>;

/**
 * Réponse pour la création d'un transfert
 */
export type CreateProductTransferResponse = ApiResponse<ProductTransferResponse>;

/**
 * Réponse pour la mise à jour d'un transfert
 */
export type UpdateProductTransferResponse = ApiResponse<ProductTransferResponse>;

/**
 * Réponse pour la suppression d'un transfert
 */
export type DeleteProductTransferResponse = ApiResponse<{ message: string }>;
