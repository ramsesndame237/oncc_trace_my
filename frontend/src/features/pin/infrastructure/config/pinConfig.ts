/**
 * Configuration centralisée pour la fonctionnalité PIN
 * Gère tous les paramètres de sécurité et de session
 */

export interface PinConfig {
  // Configuration de session
  session: {
    /** Durée de la session PIN en millisecondes (15 minutes) */
    duration: number;
    /** Nombre maximum d'extensions pour atteindre 8h de travail continu */
    maxExtensions: number;
    /** Seuil d'alerte avant expiration (en minutes) */
    expirationWarningThreshold: number;
    /** Clé de stockage dans le sessionStorage */
    storageKey: string;
  };

  // Configuration de sécurité
  security: {
    /** Nombre maximum de tentatives échouées avant verrouillage */
    maxFailedAttempts: number;
    /** Durée de verrouillage en minutes après échec */
    lockDurationMinutes: number;
    /** Longueur du code PIN */
    pinLength: number;
    /** Longueur minimale du code PIN */
    minPinLength: number;
    /** Longueur maximale du code PIN */
    maxPinLength: number;
  };

  // Configuration de maintenance
  maintenance: {
    /** Âge maximum des codes PIN en jours avant nettoyage automatique */
    maxPinAgeDays: number;
  };
}

/**
 * Configuration par défaut de la fonctionnalité PIN
 */
export const DEFAULT_PIN_CONFIG: PinConfig = {
  session: {
    // 15 minutes en millisecondes
    duration: 15 * 60 * 1000,
    // Pour 8h de travail continu : (8h * 60min) / 15min = 32 extensions
    maxExtensions: 32,
    // Alerte 2 minutes avant expiration
    expirationWarningThreshold: 2,
    // Clé de stockage
    storageKey: "pin-session",
  },

  security: {
    // 3 tentatives avant verrouillage
    maxFailedAttempts: 3,
    // Verrouillage de 15 minutes
    lockDurationMinutes: 15,
    // Code PIN fixé à 4 chiffres
    pinLength: 4,
    minPinLength: 4,
    maxPinLength: 4,
  },

  maintenance: {
    // Nettoyage des codes PIN après 90 jours d'inactivité
    maxPinAgeDays: 90,
  },
};

/**
 * Configuration active (peut être surchargée par l'environnement)
 */
export const PIN_CONFIG: PinConfig = {
  ...DEFAULT_PIN_CONFIG,
  // Possibilité de surcharger avec des variables d'environnement
  session: {
    ...DEFAULT_PIN_CONFIG.session,
    duration: process.env.NEXT_PUBLIC_PIN_SESSION_DURATION
      ? parseInt(process.env.NEXT_PUBLIC_PIN_SESSION_DURATION)
      : DEFAULT_PIN_CONFIG.session.duration,
    maxExtensions: process.env.NEXT_PUBLIC_PIN_MAX_EXTENSIONS
      ? parseInt(process.env.NEXT_PUBLIC_PIN_MAX_EXTENSIONS)
      : DEFAULT_PIN_CONFIG.session.maxExtensions,
  },
  security: {
    ...DEFAULT_PIN_CONFIG.security,
    maxFailedAttempts: process.env.NEXT_PUBLIC_PIN_MAX_FAILED_ATTEMPTS
      ? parseInt(process.env.NEXT_PUBLIC_PIN_MAX_FAILED_ATTEMPTS)
      : DEFAULT_PIN_CONFIG.security.maxFailedAttempts,
    lockDurationMinutes: process.env.NEXT_PUBLIC_PIN_LOCK_DURATION
      ? parseInt(process.env.NEXT_PUBLIC_PIN_LOCK_DURATION)
      : DEFAULT_PIN_CONFIG.security.lockDurationMinutes,
  },
};

/**
 * Utilitaires de configuration
 */
export const PinConfigUtils = {
  /**
   * Calcule la durée totale de travail possible en heures
   */
  getMaxWorkDurationHours(): number {
    const sessionDurationMinutes = PIN_CONFIG.session.duration / (60 * 1000);
    const totalMinutes =
      sessionDurationMinutes * (PIN_CONFIG.session.maxExtensions + 1);
    return totalMinutes / 60;
  },

  /**
   * Calcule le nombre d'extensions restantes pour une session
   */
  getRemainingExtensions(currentExtensions: number): number {
    return Math.max(0, PIN_CONFIG.session.maxExtensions - currentExtensions);
  },

  /**
   * Vérifie si une extension est possible
   */
  canExtendSession(currentExtensions: number): boolean {
    return currentExtensions < PIN_CONFIG.session.maxExtensions;
  },

  /**
   * Calcule le temps total écoulé depuis le début de la session
   */
  getTotalSessionTime(authenticatedAt: number): number {
    return Date.now() - authenticatedAt;
  },

  /**
   * Formate la durée en format lisible
   */
  formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} minute${minutes > 1 ? "s" : ""}`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h${remainingMinutes > 0 ? ` ${remainingMinutes}min` : ""}`;
  },

  /**
   * Valide la longueur d'un code PIN
   */
  isValidPinLength(pin: string): boolean {
    return (
      pin.length >= PIN_CONFIG.security.minPinLength &&
      pin.length <= PIN_CONFIG.security.maxPinLength
    );
  },

  /**
   * Obtient les statistiques de configuration
   */
  getConfigStats() {
    return {
      sessionDuration: PIN_CONFIG.session.duration / (60 * 1000), // en minutes
      maxWorkDuration: this.getMaxWorkDurationHours(), // en heures
      maxFailedAttempts: PIN_CONFIG.security.maxFailedAttempts,
      lockDuration: PIN_CONFIG.security.lockDurationMinutes, // en minutes
      pinLengthRange: `${PIN_CONFIG.security.minPinLength}-${PIN_CONFIG.security.maxPinLength} chiffres`,
    };
  },
} as const;
