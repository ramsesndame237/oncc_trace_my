// Types de base et pagination
export type { BaseEntity, PaginationMeta } from "./types";

// Types utilisateur
export { USER_ROLES, USER_ROLES_ARRAY } from "./generated/user-roles.types";
export type { UserRole as UserRoles } from "./generated/user-roles.types";
export type { User, UserStatus } from "./user.types";

// Types acteur
export {
  ACTOR_TYPE_LABELS,
  ACTOR_TYPES,
  ACTOR_TYPES_ARRAY
} from "./actor.types";
export type { Actor, ActorStatus, ActorTypes } from "./actor.types";

// Types de synchronisation
export { SyncStatus } from "./sync.types";
export type {
  IPostLoginSyncHandler,
  ISyncCallbacks,
  ISyncHandler,
  ISyncHandlerWithCallbacks,
  ISyncStatus
} from "./sync.types";

// Codes d'erreur
export {
  ProductionBasinErrorCodes,
  ProductionBasinErrorMessages,
  SystemErrorCodes,
  SystemErrorMessages,
  ValidationErrorCodes,
  ValidationErrorMessages
} from "./error-codes";
export type { GenericErrorCodes } from "./error-codes";

// Value objects
export { UserRole } from "./user-role.value-object";
