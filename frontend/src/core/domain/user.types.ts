// ============================================================================
// TYPES GÉNÉRÉS AUTOMATIQUEMENT DEPUIS LE BACKEND
// ============================================================================
// Ces types sont synchronisés automatiquement avec le backend
// Source: backend/app/types/user_roles.ts
// Pour mettre à jour: cd frontend && npm run generate:types
//
// ⚠️  NE PAS MODIFIER MANUELLEMENT - Utiliser le script de génération
// ============================================================================

import type { UserRole } from "./generated/user-roles.types";

export type { UserRole as UserRoles } from "./generated/user-roles.types";

export {
  getAuthorizedRoles,
  getRoleDescription,
  getRoleDescriptionFr,
  getRoleDisplayName,
  getRoleName,
  getRoleNameEn,
  isValidRole,
  USER_ROLE_DESCRIPTIONS,
  USER_ROLE_DESCRIPTIONS_FR,
  USER_ROLE_NAMES,
  USER_ROLE_NAMES_FR,
  USER_ROLES,
  USER_ROLES_ARRAY,
  USER_ROLES_CONSTANTS,
} from "./generated/user-roles.types";

/**
 * Type union des statuts utilisateur disponibles
 */
export type UserStatus = "active" | "inactive" | "blocked";
export interface User {
  id: string;
  username: string;
  email: string;
  phone?: string;
  givenName: string;
  familyName: string;
  role: UserRole;
  position?: string | null;
  lang?: "fr" | "en";
  status?: UserStatus;
  productionBasinId?: string;
  actorId?: string | null;
  securityQuestion1?: string | null;
  securityQuestion2?: string | null;
  securityQuestion3?: string | null;
  mustChangePassword?: boolean;
  passwordChangedAt?: string | null;
  lastLoginAt?: Date;
  createdAt?: string;
  updatedAt?: string;
  productionBasin?: {
    id: string;
    name: string;
    description: string;
  };
  actor?: {
    id: string;
    actorType: string;
    familyName: string;
    givenName: string;
  };
}
