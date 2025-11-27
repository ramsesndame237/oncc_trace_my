/**
 * Store Zustand global pour l'authentification PIN
 *
 * Ce store partage l'état PIN entre TOUS les composants de l'application.
 * Résout le problème d'instances multiples du hook usePinAuth.
 */

import { create } from "zustand";

interface PinAuthState {
  // État d'authentification global
  authState: boolean;
  isLoading: boolean;
  isPinCheckLoading: boolean;
  sessionTrigger: number;

  // Actions
  setAuthState: (value: boolean) => void;
  setIsLoading: (value: boolean) => void;
  setIsPinCheckLoading: (value: boolean) => void;
  incrementSessionTrigger: () => void;
  resetSessionTrigger: () => void;
}

/**
 * Store global pour l'état d'authentification PIN
 *
 * ⚠️ IMPORTANT: Ce store est PARTAGÉ par tous les composants.
 * Modifications ici affectent PinGuard, SessionTimer, et tous les autres.
 */
export const usePinAuthStore = create<PinAuthState>((set) => ({
  // État initial
  authState: false,
  isLoading: false,
  isPinCheckLoading: true,
  sessionTrigger: 0,

  // Actions
  setAuthState: (value: boolean) => {
    set({ authState: value });
  },

  setIsLoading: (value: boolean) => set({ isLoading: value }),

  setIsPinCheckLoading: (value: boolean) => set({ isPinCheckLoading: value }),

  incrementSessionTrigger: () =>
    set((state) => ({ sessionTrigger: state.sessionTrigger + 1 })),

  resetSessionTrigger: () => set({ sessionTrigger: 0 }),
}));
