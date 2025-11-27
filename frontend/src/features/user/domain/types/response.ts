import { User } from "@/core/domain/user.types";

export interface UserResponse extends Omit<User, "createdAt" | "updatedAt" | "productionBasin"> {
  productionBasin?: {
    id: string;
    name: string;
    description: string;
  };
  fullName?: string;
  createdAt: string;
  updatedAt: string;
}

import type { ApiResponse } from "@/core/infrastructure/types/api.type";
import { PaginationMeta } from "@/core/domain/types";

/**
 * Réponse paginée pour la liste des utilisateurs
 */
export interface PaginatedUsersResponse {
  data: UserResponse[];
  meta: PaginationMeta;
}

/**
 * Réponse pour récupérer la liste des utilisateurs
 */
export type GetUsersResponse = ApiResponse<PaginatedUsersResponse>;

/**
 * Réponse pour récupérer un utilisateur
 */
export type GetUserResponse = ApiResponse<UserResponse>;