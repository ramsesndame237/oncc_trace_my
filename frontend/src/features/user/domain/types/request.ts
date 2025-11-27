import { UserFilters, type UserWithSync } from "../user.types";

export interface GetUsersRequest extends UserFilters {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
  bassinId?: string;
}

export interface GetUserRequest {
  id: string;
}

/**
 * CreateUserRequest correspond directement à UserWithSync
 * sans les champs auto-générés (id, username, etc.)
 * Note: fullName sera calculé dynamiquement depuis familyName et givenName
 */
export type CreateUserRequest = Omit<UserWithSync, "id" | "username">;

/**
 * UpdateUserRequest : tous les champs optionnels sauf id et username
 */
export type UpdateUserRequest = Partial<Omit<UserWithSync, "id" | "username">>;

/**
 * UpdateSelfRequest : mise à jour des informations de l'utilisateur connecté
 */
export type UpdateSelfNameRequest = {
  type: "name";
  givenName: string;
  familyName: string;
};

export type UpdateSelfPasswordRequest = {
  type: "password";
  currentPassword: string;
  newPassword: string;
};

export type UpdateSelfOtherRequest = {
  type: "other";
  email?: string;
  phone?: string;
  position?: string | null;
  lang?: "fr" | "en";
};

export type UpdateSelfRequest =
  | UpdateSelfNameRequest
  | UpdateSelfPasswordRequest
  | UpdateSelfOtherRequest;
