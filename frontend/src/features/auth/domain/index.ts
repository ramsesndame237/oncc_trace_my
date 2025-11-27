// Point d'entrée principal pour le domaine d'authentification
// Ré-exporte tous les éléments du domaine pour faciliter les imports

// Types et interfaces de données
export type {
  AuthActions,
  AuthState,
  SecurityQuestion,
  User,
} from "./store.types";

// Objets de valeur (Value Objects)
export { AuthToken } from "./auth.value-objects";

// Interface du repository (Port)
export type { IAuthRepository } from "./IAuthRepository";

// Constantes métier et règles d'affaires
export { SECURITY_QUESTIONS, type SecurityQuestionValue } from "./constants";
