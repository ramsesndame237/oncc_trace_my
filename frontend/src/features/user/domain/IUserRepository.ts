import { ISyncHandler } from "@/core/domain/sync.types";
import { UserResponse } from "./types";
import {
  GetUsersResult,
  UserFilters,
  UserStats,
  UserWithSync,
} from "./user.types";
import { UpdateSelfRequest } from "./types/request";

export interface IUserRepository extends ISyncHandler {
  getAll(filters: UserFilters, isOnline: boolean): Promise<GetUsersResult>;
  getById(id: string, isOnline: boolean): Promise<UserWithSync>;
  add(user: Omit<UserWithSync, "id">, isOnline: boolean): Promise<void>;
  update(
    id: string,
    user: Partial<UserWithSync>,
    isOnline: boolean
  ): Promise<void>;
  updateSelf(data: UpdateSelfRequest): Promise<UserResponse>;
  updateUserStatus(
    id: string,
    status: "active" | "inactive" | "blocked",
    reason?: string
  ): Promise<UserResponse>;
  resetUserPassword(id: string): Promise<UserResponse>;
  getStats(): Promise<UserStats>;
}
