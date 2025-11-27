"use client";

import { showError, showInfo, showSuccess, showWarning } from "./toast";

/**
 * Hook pour centraliser l'utilisation des notifications dans les features
 * Respecte la clean architecture en découplant les composants de l'implémentation des notifications
 */
export function useNotification() {
  return {
    /**
     * Affiche une notification de succès
     * @param title Titre de la notification
     * @param description Description facultative
     * @param duration Durée d'affichage en ms (4000 par défaut)
     */
    success: (title: string, description?: string, duration?: number) => {
      showSuccess(title, { description, duration });
    },

    /**
     * Affiche une notification d'erreur
     * @param title Titre de la notification
     * @param description Description facultative
     * @param duration Durée d'affichage en ms (4000 par défaut)
     */
    error: (title: string, description?: string, duration?: number) => {
      showError(title, { description, duration });
    },

    /**
     * Affiche une notification d'information
     * @param title Titre de la notification
     * @param description Description facultative
     * @param duration Durée d'affichage en ms (4000 par défaut)
     */
    info: (title: string, description?: string, duration?: number) => {
      showInfo(title, { description, duration });
    },

    /**
     * Affiche une notification d'avertissement
     * @param title Titre de la notification
     * @param description Description facultative
     * @param duration Durée d'affichage en ms (4000 par défaut)
     */
    warning: (title: string, description?: string, duration?: number) => {
      showWarning(title, { description, duration });
    },
  };
}
