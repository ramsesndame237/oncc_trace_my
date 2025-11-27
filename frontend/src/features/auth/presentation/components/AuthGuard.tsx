"use client";

import { LoadingLoader } from "@/components/modules/loading-loader";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuthRoutePermissions, useAuthState } from "../hooks/useAuthState";

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
  fallback?: React.ReactNode;
}

export function AuthGuard({
  children,
  requireAuth = true,
  redirectTo = "/auth/login",
  fallback,
}: AuthGuardProps) {
  const { t, ready } = useTranslation("auth");
  const router = useRouter();
  const pathname = usePathname();
  const authState = useAuthState();
  const {
    shouldRedirectToDashboard,
    shouldRedirectToLogin,
    isAuthRouteAllowed,
  } = useAuthRoutePermissions();

  // État pour contrôler l'affichage du texte après un délai
  const [showText, setShowText] = useState(false);

  useEffect(() => {
    // Attend que i18n soit prêt avant d'afficher le texte
    if (ready) {
      // Petit délai pour éviter le flash
      const timer = setTimeout(() => setShowText(true), 100);
      return () => clearTimeout(timer);
    }
  }, [ready]);

  useEffect(() => {
    // Attend que l'état d'authentification soit chargé
    if (authState.isLoading) {
      return;
    }

    // Cas 1: Redirection vers login si non connecté et page protégée
    if (requireAuth && shouldRedirectToLogin(pathname)) {
      router.push(redirectTo);
      return;
    }

    // Cas 2: Redirection vers dashboard si connecté avec PIN et pas sur dashboard
    if (!requireAuth && shouldRedirectToDashboard(pathname)) {
      router.push("/dashboard");
      return;
    }

    // Cas 3: Connecté mais PIN expiré → Rediriger vers create-pin
    // SAUF si déjà sur une route auth autorisée (create-pin, sync, verify-otp)
    if (
      authState.isLoggedIn &&
      !authState.isPinAuthenticated &&
      !isAuthRouteAllowed(pathname)
    ) {
      router.push("/dashboard");
      // router.push("/auth/create-pin");
      return;
    }

    // Cas 4: Vérification spéciale pour les pages auth avec session active
    if (!requireAuth && authState.isLoggedIn && pathname.startsWith("/auth/")) {
      // Si l'utilisateur est connecté sur une page auth
      if (!isAuthRouteAllowed(pathname)) {
        // Si la route auth n'est pas autorisée, rediriger vers dashboard
        router.push("/dashboard");
        return;
      }
      // Sinon, laisser l'utilisateur sur cette page auth (ex: pendant setup PIN)
    }
  }, [
    authState.isLoading,
    authState.isLoggedIn,
    authState.isPinAuthenticated,
    pathname,
    requireAuth,
    redirectTo,
    router,
    shouldRedirectToDashboard,
    shouldRedirectToLogin,
    isAuthRouteAllowed,
  ]);

  // ✅ Pour les pages protégées (layout principal avec sidebar/navbar)
  // On affiche toujours le contenu, les redirections se font en arrière-plan
  if (requireAuth) {
    // Affiche un loader uniquement si en train de charger ET pas encore authentifié
    if (authState.isLoading && !authState.isLoggedIn) {
      return (
        fallback || (
          <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-gray-100">
            <div className="text-center">
              <LoadingLoader />
              {showText && (
                <p className="text-primary">{t("sync.verifyingSession")}</p>
              )}
            </div>
          </div>
        )
      );
    }

    // Si authentifié ou en train de rediriger, affiche les children (le layout s'affichera)
    return <>{children}</>;
  }

  // ✅ Pour les pages publiques (auth, etc.)
  if (!requireAuth) {
    // Si en chargement, affiche loader plein écran (pages publiques n'ont pas de layout)
    if (authState.isLoading || !ready) {
      return (
        fallback || (
          <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-gray-100">
            <div className="text-center">
              <LoadingLoader />
              {showText && (
                <p className="text-primary">{t("sync.verifyingSession")}</p>
              )}
            </div>
          </div>
        )
      );
    }

    // Si connecté et doit rediriger vers dashboard, affiche loader pendant la redirection
    if (shouldRedirectToDashboard(pathname)) {
      return (
        fallback || (
          <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-gray-100">
            <div className="text-center">
              <LoadingLoader />
              {showText && (
                <p className="text-primary">{t("sync.redirecting")}</p>
              )}
            </div>
          </div>
        )
      );
    }

    return <>{children}</>;
  }

  // Fallback (ne devrait jamais arriver)
  return <>{children}</>;
}
