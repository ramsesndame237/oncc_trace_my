"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { AuthActions, AuthState } from "../../domain/store.types";

// Interface complète du store
interface AuthStore extends AuthState, AuthActions {}

// Store d'authentification avec persistance
export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      onboardingQuestions: null,
      onboardingPassword: null,
      securityAnswersRecovery: null,

      setOnboardingQuestions: (questions) =>
        set({ onboardingQuestions: questions }),

      setOnboardingPassword: (password) =>
        set({ onboardingPassword: password }),

      setSecurityAnswersRecovery: (securityAnswers) =>
        set({ securityAnswersRecovery: securityAnswers }),

      setUser: (user) => set({ user }),

      clearSecurityAnswersRecovery: () =>
        set({ securityAnswersRecovery: null }),
    }),
    {
      name: "auth-storage", // Clé unique pour le local/session storage
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
