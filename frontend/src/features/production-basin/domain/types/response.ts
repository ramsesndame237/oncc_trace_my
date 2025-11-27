import { PaginationMeta } from "@/core/domain/types";
import { User } from "@/core/domain/user.types";
import type { ApiResponse } from "@/core/infrastructure/types/api.type";

/**
 * Structure d'une localisation dans les réponses
 */
export interface LocationResponse {
  id: string;
  name: string;
  code: string;
  type: string;
}

/**
 * Structure d'un bassin de production dans les réponses
 */
export interface ProductionBasinResponse {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  locations?: LocationResponse[];
  users?: User[];
}

/**
 * Réponse paginée pour la liste des bassins
 */
export interface PaginatedProductionBasinsResponse {
  data: ProductionBasinResponse[];
  meta: PaginationMeta;
}

/**
 * Réponse pour récupérer la liste des bassins de production
 */
export type GetProductionBasinsResponse =
  ApiResponse<PaginatedProductionBasinsResponse>;

/**
 * Réponse pour récupérer un bassin de production spécifique
 */
export type GetProductionBasinResponse = ApiResponse<ProductionBasinResponse>;

/**
 * Réponse pour créer un nouveau bassin de production
 */
export type CreateProductionBasinResponse =
  ApiResponse<ProductionBasinResponse>;

/**
 * Réponse pour mettre à jour un bassin de production
 */
export type UpdateProductionBasinResponse =
  ApiResponse<ProductionBasinResponse>;

/**
 * Réponse pour supprimer un bassin de production
 */
export type DeleteProductionBasinResponse = ApiResponse<{ success: boolean }>;

/**
 * Réponse pour assigner des utilisateurs à un bassin
 */
export type AssignUsersResponse = ApiResponse<ProductionBasinResponse>;

/**
 * Réponse pour désassigner des utilisateurs d'un bassin
 */
export type UnassignUsersResponse = ApiResponse<ProductionBasinResponse>;
