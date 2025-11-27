/**
 * Constantes pour les événements d'authentification utilisés avec le bus d'événements global.
 * Ces événements permettent une communication découplée entre la feature auth et les autres features.
 */
export const AuthEvents = {
  LoginSuccess: "auth:login" as const,
  Logout: "auth:logout" as const,
} as const;
