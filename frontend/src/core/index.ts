// Exports publics du core - éléments réutilisables par toutes les features

// Domain
export { SyncStatus, type ISyncStatus } from "./domain/sync.types";
export type { User } from "./domain/user.types";

// Domain - Codes d'erreur génériques
export {
  SystemErrorCodes,
  SystemErrorMessages,
  ValidationErrorCodes,
  ValidationErrorMessages,
} from "./domain/error-codes";
export type { GenericErrorCodes } from "./domain/error-codes";
