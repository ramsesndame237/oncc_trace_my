import { DefaultSession, User as DefaultUser } from "next-auth";
import { JWT as DefaultJWT } from "next-auth/jwt";
// Import depuis le core maintenant
import { User as AppUser } from "@/core/domain/user.types";

declare module "next-auth" {
  /**
   * Étend l'objet Session pour inclure le token d'accès
   * et le type utilisateur complet de votre application.
   */
  interface Session extends DefaultSession {
    user: AppUser & {
      id: string; // L'ID utilisateur est souvent nécessaire
    };
    accessToken: string;
    error?: string;
  }

  /**
   * Étend l'objet User retourné par la fonction `authorize`
   * pour inclure les données de session complètes.
   */
  interface User extends DefaultUser, AppUser {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: string;
    requiresOtp?: boolean; // present lors de l'authentification avec OTP
    requiresInitialization?: boolean; // present lors de l'authentification avec initialisation
    initializationToken?: string; // token de l'initialisation
    sessionKey?: string; // clé de la session
  }
}

declare module "next-auth/jwt" {
  /**
   * Étend le JSON Web Token pour transporter les données
   * de session entre les callbacks.
   */
  interface JWT extends DefaultJWT {
    user: AppUser;
    accessToken: string;
    refreshToken: string;
    expiresAt: string;
    error?: string;
    pseudo?: string;
    requiresOtp?: boolean;
    requiresInitialization?: boolean;
    initializationToken?: string;
    sessionKey?: string;
  }
}
