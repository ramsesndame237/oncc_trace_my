"use client";

import { usePinAuth } from "@/features/pin/presentation/hooks/usePinAuth";
import { useSession } from "next-auth/react";
import { useMemo } from "react";

export interface CombinedAuthState {
  // États de base
  isLoggedIn: boolean;
  isPinAuthenticated: boolean;
  needsPinSetup: boolean;
  
  // États combinés pour la logique de redirection
  canAccessDashboard: boolean;
  shouldStayOnAuthPage: boolean;
  
  // Données utilisateur
  user?: {
    id: string;
    username: string;
    email: string;
    role: string;
  };
  
  // États de chargement
  isLoadingSession: boolean;
  isLoadingPin: boolean;
  isLoading: boolean;
}

/**
 * Hook personnalisé qui combine l'état NextAuth et l'état PIN
 * pour fournir une vue unifiée de l'authentification
 */
export function useAuthState(): CombinedAuthState {
  const { data: session, status } = useSession();
  const { isAuthenticated: isPinAuthenticated, isLoading: isLoadingPin } = usePinAuth();

  const authState = useMemo((): CombinedAuthState => {
    const isLoadingSession = status === "loading";
    const isLoggedIn = !!session?.user;
    const user = session?.user ? {
      id: String(session.user.id),
      username: session.user.username || "",
      email: session.user.email || "",
      role: session.user.role || "",
    } : undefined;

    // États combinés pour la logique de redirection
    const canAccessDashboard = isLoggedIn && isPinAuthenticated;
    const shouldStayOnAuthPage = isLoggedIn && !isPinAuthenticated;

    return {
      // États de base
      isLoggedIn,
      isPinAuthenticated,
      needsPinSetup: isLoggedIn && !isPinAuthenticated,

      // États combinés
      canAccessDashboard,
      shouldStayOnAuthPage,

      // Données utilisateur
      user,

      // États de chargement
      isLoadingSession,
      isLoadingPin,
      isLoading: isLoadingSession || isLoadingPin,
    };
  }, [session, status, isPinAuthenticated, isLoadingPin]);

  return authState;
}

/**
 * Hook utilitaire pour vérifier si une route auth peut être visitée
 * même avec une session active (pendant le setup PIN)
 */
export function useAuthRoutePermissions() {
  const authState = useAuthState();
  
  // Routes /auth qui peuvent être visitées avec une session active
  const PIN_SETUP_ROUTES = [
    '/auth/create-pin',
    '/auth/sync',
    '/auth/verify-otp',
  ];
  
  const isAuthRouteAllowed = (pathname: string): boolean => {
    // Si pas connecté, toutes les routes auth sont autorisées
    if (!authState.isLoggedIn) {
      return true;
    }
    
    // Si connecté et PIN configuré, pas besoin d'être sur une route auth
    if (authState.canAccessDashboard) {
      return false;
    }
    
    // Si connecté mais pas de PIN, seules certaines routes auth sont autorisées
    return PIN_SETUP_ROUTES.some(route => pathname.startsWith(route));
  };
  
  const shouldRedirectToDashboard = (pathname: string): boolean => {
    // Rediriger vers dashboard si :
    // 1. Utilisateur peut accéder au dashboard
    // 2. ET n'est pas déjà sur le dashboard
    // 3. ET n'est pas sur une route auth autorisée
    // 4. ET est sur la page d'accueil (/) ou autre page publique
    return authState.canAccessDashboard && 
           !pathname.startsWith('/dashboard') && 
           !isAuthRouteAllowed(pathname);
  };
  
  const shouldRedirectToLogin = (pathname: string): boolean => {
    // Rediriger vers login si pas connecté et sur une route protégée
    return !authState.isLoggedIn && 
           !pathname.startsWith('/auth/login') && 
           !pathname.startsWith('/auth/ask-recovery');
  };
  
  return {
    isAuthRouteAllowed,
    shouldRedirectToDashboard,
    shouldRedirectToLogin,
    PIN_SETUP_ROUTES,
  };
}