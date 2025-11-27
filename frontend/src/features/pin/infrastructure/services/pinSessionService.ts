/**
 * Service de gestion de session PIN
 * Gère l'état d'authentification PIN temporaire
 */

import { PIN_CONFIG } from "../config/pinConfig";

interface PinSession {
  userId: string;
  authenticatedAt: number;
  expiresAt: number;
  extendedCount?: number; // Nombre de fois que la session a été prolongée
}

export class PinSessionService {
  /**
   * Marque l'utilisateur comme authentifié par PIN
   */
  static authenticateUser(userId: string): void {
    const now = Date.now();
    const session: PinSession = {
      userId,
      authenticatedAt: now,
      expiresAt: now + PIN_CONFIG.session.duration,
      extendedCount: 0,
    };

    try {
      sessionStorage.setItem(
        PIN_CONFIG.session.storageKey,
        JSON.stringify(session)
      );
    } catch (error) {
      console.error("❌ [PinSessionService] Error saving session:", error);
    }
  }

  /**
   * Vérifie si l'utilisateur est authentifié par PIN
   */
  static isUserAuthenticated(userId: string): boolean {
    try {
      const sessionData = sessionStorage.getItem(PIN_CONFIG.session.storageKey);
      if (!sessionData) return false;

      const session: PinSession = JSON.parse(sessionData);

      // Vérifier si c'est le bon utilisateur
      if (session.userId !== userId) return false;

      // Vérifier si la session n'a pas expiré
      if (Date.now() > session.expiresAt) {
        this.clearSession();
        return false;
      }

      return true;
    } catch (error) {
      console.error("Erreur lors de la vérification de la session PIN:", error);
      this.clearSession();
      return false;
    }
  }

  /**
   * Prolonge la session PIN si elle est valide
   */
  static extendSession(userId: string): boolean {
    if (!this.isUserAuthenticated(userId)) {
      return false;
    }

    try {
      const sessionData = sessionStorage.getItem(PIN_CONFIG.session.storageKey);
      if (!sessionData) return false;

      const session: PinSession = JSON.parse(sessionData);

      // Utiliser la configuration pour limiter les extensions
      if ((session.extendedCount || 0) >= PIN_CONFIG.session.maxExtensions) {
        return false;
      }

      session.expiresAt = Date.now() + PIN_CONFIG.session.duration;
      session.extendedCount = (session.extendedCount || 0) + 1;

      sessionStorage.setItem(
        PIN_CONFIG.session.storageKey,
        JSON.stringify(session)
      );
      return true;
    } catch (error) {
      console.error("Erreur lors de l'extension de la session PIN:", error);
      return false;
    }
  }

  /**
   * Efface la session PIN
   */
  static clearSession(): void {
    try {
      sessionStorage.removeItem(PIN_CONFIG.session.storageKey);
    } catch (error) {
      console.error("❌ [PinSessionService] Error clearing session:", error);
    }
  }

  /**
   * Obtient les informations de la session actuelle avec retry
   */
  static getSessionInfo(): PinSession | null {
    try {
      const sessionData = sessionStorage.getItem(PIN_CONFIG.session.storageKey);

      if (!sessionData) {
        // Retry une fois en cas de timing malheureux
        const retryData = sessionStorage.getItem(PIN_CONFIG.session.storageKey);

        if (!retryData) {
          return null;
        }

        const session: PinSession = JSON.parse(retryData);

        if (Date.now() > session.expiresAt) {
          this.clearSession();
          return null;
        }

        return session;
      }

      const session: PinSession = JSON.parse(sessionData);

      // Vérifier si la session n'a pas expiré
      if (Date.now() > session.expiresAt) {
        this.clearSession();
        return null;
      }

      return session;
    } catch (error) {
      console.error(
        "❌ [PinSessionService] Error retrieving session info:",
        error
      );

      // Ne pas effacer immédiatement en cas d'erreur de parsing
      // Retry une fois
      try {
        const retryData = sessionStorage.getItem(PIN_CONFIG.session.storageKey);

        if (retryData) {
          const session: PinSession = JSON.parse(retryData);

          if (Date.now() <= session.expiresAt) {
            return session;
          }
        }
      } catch (retryError) {
        // Si retry échoue aussi, alors vraiment problème
        console.error("❌ [PinSessionService] Retry also failed, clearing session", retryError);
        this.clearSession();
      }
      return null;
    }
  }

  /**
   * Obtient le temps restant avant expiration (en minutes)
   */
  static getTimeRemaining(): number {
    const session = this.getSessionInfo();
    if (!session) return 0;

    const remaining = session.expiresAt - Date.now();
    return Math.max(0, Math.floor(remaining / (60 * 1000)));
  }

  /**
   * Vérifie si la session approche de l'expiration
   */
  static isSessionExpiringSoon(thresholdMinutes?: number): boolean {
    const threshold =
      thresholdMinutes || PIN_CONFIG.session.expirationWarningThreshold;
    const remaining = this.getTimeRemaining();
    return remaining > 0 && remaining <= threshold;
  }

  /**
   * Obtient les statistiques de la session actuelle
   */
  static getSessionStats(): {
    isActive: boolean;
    timeRemaining: number;
    extendedCount: number;
    sessionDuration: number;
    maxExtensions: number;
    canExtend: boolean;
  } {
    const session = this.getSessionInfo();

    if (!session) {
      return {
        isActive: false,
        timeRemaining: 0,
        extendedCount: 0,
        sessionDuration: 0,
        maxExtensions: PIN_CONFIG.session.maxExtensions,
        canExtend: false,
      };
    }

    const now = Date.now();
    const sessionDuration = Math.floor(
      (now - session.authenticatedAt) / (60 * 1000)
    );
    const extendedCount = session.extendedCount || 0;

    return {
      isActive: true,
      timeRemaining: this.getTimeRemaining(),
      extendedCount,
      sessionDuration,
      maxExtensions: PIN_CONFIG.session.maxExtensions,
      canExtend: extendedCount < PIN_CONFIG.session.maxExtensions,
    };
  }

  /**
   * Réinitialise le compteur d'extensions (utilisé lors d'une nouvelle authentification)
   */
  static resetExtensionCount(): void {
    try {
      const sessionData = sessionStorage.getItem(PIN_CONFIG.session.storageKey);
      if (!sessionData) return;

      const session: PinSession = JSON.parse(sessionData);
      session.extendedCount = 0;

      sessionStorage.setItem(
        PIN_CONFIG.session.storageKey,
        JSON.stringify(session)
      );
    } catch (error) {
      console.error(
        "Erreur lors de la réinitialisation du compteur d'extensions:",
        error
      );
    }
  }

  /**
   * Obtient le temps total de travail possible (en heures)
   */
  static getMaxWorkDurationHours(): number {
    const sessionDurationMinutes = PIN_CONFIG.session.duration / (60 * 1000);
    const totalMinutes =
      sessionDurationMinutes * (PIN_CONFIG.session.maxExtensions + 1);
    return totalMinutes / 60;
  }

  /**
   * Obtient le nombre d'extensions restantes
   */
  static getRemainingExtensions(): number {
    const session = this.getSessionInfo();
    if (!session) return 0;

    return Math.max(
      0,
      PIN_CONFIG.session.maxExtensions - (session.extendedCount || 0)
    );
  }
}
