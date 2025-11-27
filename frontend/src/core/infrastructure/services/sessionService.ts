import { apiClient } from "@/core/infrastructure/api/client";
import type { Session } from "next-auth";

/**
 * Service centralisé pour gérer la synchronisation entre NextAuth et l'API client
 */
export class SessionService {
  private static instance: SessionService | null = null;
  private isInitialized: boolean = false;

  private constructor() {}

  /**
   * Récupère l'instance singleton du service
   */
  static getInstance(): SessionService {
    if (!SessionService.instance) {
      SessionService.instance = new SessionService();
    }
    return SessionService.instance;
  }

  /**
   * Initialise le service de session
   * Doit être appelé une seule fois au niveau le plus haut de l'application
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Initialiser le client API
      await apiClient.initialize();
      this.isInitialized = true;
    } catch (error) {
      console.error(
        "❌ Erreur lors de l'initialisation du service de session:",
        error
      );
      this.isInitialized = true; // Éviter les boucles infinies
    }
  }

  /**
   * Met à jour la session dans le client API
   * Cette méthode doit être appelée par le SessionProvider quand la session change
   */
  handleSessionUpdate(session: Session | null): void {
    apiClient.handleSessionUpdate(session);
  }

  /**
   * Vérifie si le service est initialisé
   */
  getIsInitialized(): boolean {
    return this.isInitialized;
  }
}

/**
 * Instance globale du service de session
 */
export const sessionService = SessionService.getInstance();
