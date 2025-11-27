// Objets de valeur (Value Objects) pour le domaine d'authentification

/**
 * Objet de valeur représentant un token d'authentification
 * Encapsule la logique de validation et d'expiration
 */
export class AuthToken {
  constructor(public readonly value: string, public readonly expiresAt: Date) {
    if (!value || value.trim().length === 0) {
      throw new Error("Token cannot be empty");
    }
    if (expiresAt <= new Date()) {
      throw new Error("Token cannot be expired");
    }
  }

  /**
   * Vérifie si le token est expiré
   */
  isExpired(): boolean {
    return this.expiresAt <= new Date();
  }

  /**
   * Vérifie si le token expire bientôt
   * @param minutesThreshold Seuil en minutes (défaut: 5)
   */
  isExpiringSoon(minutesThreshold = 5): boolean {
    const threshold = new Date();
    threshold.setMinutes(threshold.getMinutes() + minutesThreshold);
    return this.expiresAt <= threshold;
  }

  /**
   * Retourne le temps restant avant expiration en millisecondes
   */
  getTimeUntilExpiration(): number {
    return Math.max(0, this.expiresAt.getTime() - new Date().getTime());
  }

  /**
   * Retourne le temps restant avant expiration en minutes
   */
  getMinutesUntilExpiration(): number {
    return Math.floor(this.getTimeUntilExpiration() / (1000 * 60));
  }
}
