import type { User as AppUser } from "@/core/domain/user.types";
import { ApiError } from "@/core/infrastructure/api";
import { ServiceProvider } from "@/core/infrastructure/di/serviceProvider";
import type { NextAuthOptions, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { AuthSuccessCodes } from "../domain/types/auth-codes";

// Fonction pour créer une erreur sérialisée
const createAuthError = (
  redirectUrl: string,
  details: Record<string, unknown>
) => {
  console.log(redirectUrl, details, "redirectUrl and details wilrona");
  return new Error(JSON.stringify({ redirectUrl, ...details }));
};

export const authConfig: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
        otp: { label: "OTP", type: "text" },
        sessionToken: { label: "Session Key", type: "text" },
        userId: { label: "User ID", type: "text" },
        // Ce champ déterminera quelle action effectuer
        authStep: { label: "Auth Step", type: "text" },
      },
      async authorize(credentials): Promise<User | null> {
        if (!credentials) return null;

        try {
          // Étape 1: Connexion avec pseudo et mot de passe
          if (credentials.authStep === "login") {
            const { username, password } = credentials;

            const loginUseCase = ServiceProvider.Auth.getLoginUseCase();
            const response = await loginUseCase.execute({
              username,
              password,
            });

            if (!response.success) {
              return null;
            }

            if (
              response.successCode ===
              AuthSuccessCodes.ACCOUNT_TO_BE_INITIALIZED
            ) {
              throw createAuthError("/auth/onboarding", {
                sessionToken: response.data.sessionToken,
                requiresInitialization: response.data.requiresInitialization,
                user: response.data.user,
              });
            }

            // Vérifier si l'OTP est requis
            if (response.successCode === AuthSuccessCodes.LOGIN_OTP_SENT) {
              throw createAuthError("/auth/verify-otp", {
                sessionToken: response.data.sessionToken,
                requiresInitialization: response.data.requiresInitialization,
                user: response.data.user,
              });
            }
          }

          // Étape 2: Vérification de l'OTP
          if (credentials.authStep === "otp") {
            const { otp, sessionToken, userId } = credentials;

            try {
              const verifyOtpUseCase =
                ServiceProvider.Auth.getVerifyOtpUseCase();
              const response = await verifyOtpUseCase.execute({
                otp,
                sessionToken,
                userId: userId,
              });

              if (response.success) {
                // L'authentification est réussie, on retourne l'utilisateur complet.
                const { user, token } = response.data;
                return {
                  id: user.id,
                  username: user.username,
                  email: user.email,
                  phone: user.phone,
                  givenName: user.givenName || "",
                  familyName: user.familyName || "",
                  position: user.position,
                  role: user.role,
                  lang: user.lang,
                  status: user.status,
                  productionBasinId: user.productionBasinId || undefined,
                  productionBasin: user.productionBasin || undefined,
                  actorId: user.actorId || undefined,
                  actor: user.actor || undefined,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  accessToken: token.value,
                  lastLoginAt: new Date(),
                  refreshToken: "",
                  expiresAt: token.expiresAt,
                } as User;
              }

              return null;
            } catch (error) {
              if (error instanceof ApiError) {
                throw new Error(error.message);
              }
              throw new Error("Code OTP invalide");
            }
          }

          return null; // Étape d'authentification non reconnue
        } catch (error) {
          console.error("Authorize Error:", error);
          if (error instanceof Error) {
            // Pour remonter l'erreur à la page de connexion
            throw new Error(error.message);
          }
          throw new Error("Une erreur inconnue s'est produite");
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/login", // Afficher les erreurs sur la page de connexion
  },
  callbacks: {
    async jwt({ token, user }) {
      // Le paramètre `user` n'est présent que lors de la connexion initiale
      // console.log(user, "user jwt");
      if (user) {
        // Sinon, on peuple le token avec les infos utilisateur complètes
        token.accessToken = user.accessToken || "";
        token.refreshToken = user.refreshToken || "";
        token.expiresAt = user.expiresAt || "";
        token.requiresInitialization = user.requiresInitialization;

        // Construire l'objet utilisateur pour la session
        const appUser: AppUser = {
          id: user.id,
          username: user.username,
          email: user.email || "",
          phone: user.phone,
          givenName: user.givenName || "",
          familyName: user.familyName || "",
          position: user.position,
          role: user.role,
          lang: user.lang,
          status: user.status,
          productionBasinId: user.productionBasinId,
          productionBasin: user.productionBasin,
          actorId: user.actorId,
          actor: user.actor,
          lastLoginAt: user.lastLoginAt,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        };
        token.user = appUser;
      }
      return token;
    },
    async session({ session, token }) {
      // On transfère les données du token vers la session
      if (token && token.user) {
        session.user = token.user as AppUser & { id: string };
        session.accessToken = token.accessToken as string;
        (
          session as unknown as { requiresInitialization?: boolean }
        ).requiresInitialization = token.requiresInitialization as boolean;
        session.error = token.error;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
