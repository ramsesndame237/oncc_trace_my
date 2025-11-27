"use client";

import type { User } from "@/core/domain/user.types";
import { apiClient } from "@/core/infrastructure/api";
import { signOut, useSession } from "next-auth/react";
import { useCallback } from "react";

export interface UseAuthReturn {
  user: User | null;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const { data: session, update } = useSession();

  const isAuthenticated = !!session?.user;
  const user = (session?.user as User) || null;

  const logout = useCallback(async () => {
    await signOut({ callbackUrl: "/auth/login" });
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      // Récupérer les données fraîches de l'utilisateur depuis l'API
      const response = await apiClient.get<User>("/me");

      if (response.success && response.data) {
        // Mettre à jour la session avec les nouvelles données
        await update({
          user: response.data,
        });
      }
    } catch (error) {
      console.error("Erreur lors du rafraîchissement des données utilisateur:", error);
    }
  }, [update]);

  return {
    user,
    isAuthenticated,
    logout,
    refreshUser,
  };
}
