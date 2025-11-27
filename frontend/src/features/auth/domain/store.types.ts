// Types et interfaces de données pour le domaine d'authentification
import type { User } from "@/core/domain/user.types";
import type {
  NewPasswordFormData,
  SecurityQuestionsFormData,
} from "../presentation/schemas/validation-schemas";

// Re-export du type User pour la compatibilité
export type { User };

/**
 * Question de sécurité pour la récupération de compte
 */
export interface SecurityQuestion {
  id: string;
  question: string;
  answer: string;
}

/**
 * Réponses aux questions de sécurité pour la récupération
 */
export interface SecurityAnswersRecovery {
  token: string;
  answers: Array<{
    id: number;
    answer: string;
  }>;
  userInfo?: {
    username: string;
    email: string;
    givenName: string;
    familyName: string;
  };
}

/**
 * État de l'authentification (pour les stores/hooks)
 */
export interface AuthState {
  onboardingQuestions: SecurityQuestionsFormData | null;
  onboardingPassword: NewPasswordFormData | null;
  securityAnswersRecovery: SecurityAnswersRecovery | null;
  user: User | null;
}

/**
 * Actions disponibles pour l'authentification (pour les stores/hooks)
 */
export interface AuthActions {
  setUser(user: User | null): void;
  setOnboardingQuestions(questions: SecurityQuestionsFormData | null): void;
  setOnboardingPassword(password: NewPasswordFormData | null): void;
  setSecurityAnswersRecovery(
    securityAnswers: SecurityAnswersRecovery | null
  ): void;
  clearSecurityAnswersRecovery: () => void;
}
