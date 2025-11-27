import { PaginationMeta } from "@/core/domain/types";
import { UserResponse } from "./types";
import { CreateUserRequest, UpdateUserRequest } from "./types/request";
import { UserFilters, UserWithSync } from "./user.types";

export interface UserState {
  users: UserWithSync[];
  meta: PaginationMeta | null;
  filters: UserFilters;
  isLoading: boolean;
  error: string | null;
  isOnline: boolean;
}

export interface UserActions {
  setFilters: (filters: Partial<UserFilters>) => void;
  fetchUsers: (force?: boolean) => Promise<void>;
  fetchUserById: (id: string) => Promise<UserWithSync | null>;
  createUser: (userData: CreateUserRequest) => Promise<void>;
  updateUser: (
    id: string,
    userData: UpdateUserRequest,
    isOnline: boolean
  ) => Promise<void>;
  updateUserStatus: (
    userId: string,
    status: "active" | "inactive" | "blocked",
    reason?: string
  ) => Promise<UserResponse>;
  resetUserPassword: (userId: string) => Promise<UserResponse>;
}

export type UserStore = UserState & UserActions;
