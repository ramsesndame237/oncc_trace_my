"use client";

import type { User } from "@/core/domain/user.types";
import { getSession } from "next-auth/react";

export class AuthService {
  /**
   * Obtient l'utilisateur connecté depuis NextAuth
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const session = await getSession();
      return (session?.user as User) || null;
    } catch (error) {
      console.error("Erreur lors de la récupération de la session:", error);
      return null;
    }
  }

  /**
   * Obtient l'ID de l'utilisateur connecté
   */
  async getCurrentUserId(): Promise<string | null> {
    const user = await this.getCurrentUser();
    return user?.id || null;
  }
}

// Instance singleton
export const authService = new AuthService();