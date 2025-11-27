import { ISyncStatus } from "@/core/domain/sync.types";
import { PaginationMeta } from "@/core/domain/types";
import { User } from "@/core/domain/user.types";

export interface UserWithSync extends User {
  syncStatus?: ISyncStatus;
  fullName?: string;
}

export interface UserFilters {
  page?: number;
  per_page?: number;
  search?: string;
  role?: string;
  status?: string;
  bassinId?: string;
}

export interface GetUsersResult {
  users: UserWithSync[];
  meta: PaginationMeta;
}

/**
 * Statistiques des utilisateurs
 */
export interface UserStats {
  /** Total des utilisateurs */
  total: number;
  
  /** Utilisateurs actifs */
  active: number;
  
  /** Statistiques par rôle et statut */
  byRoleAndStatus: Array<{
    role: string;
    status: string;
    total: number;
  }>;
}
