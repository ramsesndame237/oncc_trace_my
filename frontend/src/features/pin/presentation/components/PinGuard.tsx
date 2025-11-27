"use client";

import LanguageSelector from "@/components/layout/language-selector";
import ContentCard from "@/components/modules/content-card";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { usePinAuth } from "../hooks/usePinAuth";
import { PinVerificationForm } from "./PinVerificationForm";

interface PinGuardProps {
  children: React.ReactNode;
}

const PIN_PROTECTED_ROUTES = ["/(main)", "/(forms)"];

const PIN_BYPASS_ROUTES = [
  "/auth/login",
  "/auth/verify-otp",
  "/auth/create-pin",
  "/auth/onboarding",
  "/auth/recovery",
  "/auth/ask-recovery",
  "/auth/sync",
];

export function PinGuard({ children }: PinGuardProps) {
  const { t } = useTranslation(["pin", "common"]);
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const {
    getPinInfo,
    isAuthenticated,
    isLoading: isPinLoading,
    extendSession,
    getTimeRemaining,
  } = usePinAuth();

  const [pinState, setPinState] = useState<'checking' | 'needs-verification' | 'verified'>('checking');

  // Vérifier si la route actuelle nécessite une protection PIN
  const isProtectedRoute = PIN_PROTECTED_ROUTES.some((route) => {
    if (route.includes("(") && route.includes(")")) {
      // Pour les routes avec groupes comme (main)
      const cleanRoute = route.replace(/\([^)]*\)/g, "");
      return pathname.startsWith(cleanRoute);
    }
    return pathname.startsWith(route);
  });

  const isBypassRoute = PIN_BYPASS_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  useEffect(() => {
    const checkPinRequirement = async () => {
      // Ne pas vérifier le PIN si:
      // 1. La session n'est pas encore chargée
      // 2. L'utilisateur n'est pas connecté
      // 3. On n'est pas sur une route protégée
      // 4. On est sur une route de contournement
      // 5. Le hook PIN est encore en cours de chargement
      if (
        status === "loading" ||
        isPinLoading ||
        !session?.user ||
        !isProtectedRoute ||
        isBypassRoute
      ) {
        setPinState('verified');
        return;
      }

      try {
        // 1. Vérifier d'abord si l'utilisateur est déjà authentifié par PIN via la session
        if (isAuthenticated) {
          // L'utilisateur a déjà une session PIN valide
          const timeRemaining = getTimeRemaining();

          if (timeRemaining > 5) {
            // Plus de 5 minutes restantes
            setPinState('verified');
            return;
          } else if (timeRemaining > 0) {
            // Prolonger automatiquement la session si elle expire bientôt
            const extended = extendSession();
            if (extended) {
              setPinState('verified');
              return;
            }
          }
        }

        // 2. Si pas de session PIN valide, vérifier l'état du PIN stocké
        const info = await getPinInfo();

        if (!info.exists) {
          // Aucun PIN défini, rediriger vers la création
          router.push("/auth/create-pin");
          return;
        }

        if (info.isLocked) {
          // PIN verrouillé, forcer la recréation
          router.push("/auth/create-pin");
          return;
        }

        // PIN existe et n'est pas verrouillé, demander la vérification
        setPinState('needs-verification');
      } catch (error) {
        console.error("Erreur lors de la vérification du PIN:", error);
        // En cas d'erreur, ne pas rediriger automatiquement si c'est juste un problème de session
        // La redirection sera gérée par les hooks appropriés
        setPinState('verified');
      }
    };

    checkPinRequirement();
  }, [
    session,
    status,
    isPinLoading,
    pathname,
    isProtectedRoute,
    isBypassRoute,
    router,
    getPinInfo,
    isAuthenticated,
    extendSession,
    getTimeRemaining,
  ]);

  // Vérification périodique de la session PIN
  useEffect(() => {
    if (!isProtectedRoute || isBypassRoute || pinState === 'needs-verification') {
      return;
    }

    const interval = setInterval(() => {
      if (session?.user && !isAuthenticated) {
        // GUARD: Vérifier plusieurs fois avant d'afficher le PinGuard
        let confirmCount = 0;
        const confirmInterval = setInterval(() => {
          confirmCount++;

          // Re-vérifier isAuthenticated
          if (isAuthenticated) {
            // Fausse alerte, utilisateur est authentifié
            clearInterval(confirmInterval);
            return;
          }

          if (confirmCount >= 3) {
            // Après 3 vérifications (3 secondes), vraiment pas authentifié
            setPinState('needs-verification');
            clearInterval(confirmInterval);
          }
        }, 1000); // Vérifier toutes les secondes, 3 fois
      }
    }, 300000); // Vérifier toutes les 5 minutes

    return () => clearInterval(interval);
  }, [
    session?.user,
    isProtectedRoute,
    isBypassRoute,
    pinState,
    isAuthenticated,
  ]);

  const handlePinSuccess = () => {
    setPinState('verified');
  };

  const handlePinRecreate = () => {
    router.push("/auth/create-pin");
  };

  const handleLogout = async () => {
    try {
      await signOut({
        callbackUrl: "/auth/login",
        redirect: true,
      });
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
    }
  };

  // ✅ Afficher un loader pendant la vérification initiale pour éviter le flash
  if (pinState === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-gray-100">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-sm text-gray-600">{t("common:messages.loading")}</p>
        </div>
      </div>
    );
  }

  // Si on a besoin d'une vérification PIN, afficher le formulaire
  if (pinState === 'needs-verification' && session?.user) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-white to-gray-100">
        {/* Header avec sélecteur de langue */}
        <header className="flex justify-end p-4 w-full">
          <LanguageSelector />
        </header>

        {/* Contenu principal centré */}
        <main className="flex flex-1 justify-center items-center p-4">
          <div className="relative">
            {/* Icône de déconnexion en position absolue */}
            <Button
              variant={"ghost"}
              size={"icon"}
              onClick={handleLogout}
              className="absolute top-2 right-2 z-10"
              title={t("common:navigation.logout")}
              aria-label={t("common:navigation.logout")}
            >
              <LogOut className="h-10 w-10" />
            </Button>

            <ContentCard
              title={t("guard.secureAccess")}
              withHeaderImage
              imageSrc="/logo/logo.png"
              imageAlt="ONCC Logo"
              titlePosition="center"
              maxWidth="max-w-md"
              headerClassName="items-center"
            >
              <PinVerificationForm
                onSuccess={handlePinSuccess}
                onRecreate={handlePinRecreate}
                title={t("verification.title")}
                description={t("verification.description")}
                guard={true}
              />
            </ContentCard>
          </div>
        </main>
      </div>
    );
  }

  // ✅ Afficher les children immédiatement
  // Les vérifications se font en arrière-plan
  // Le Suspense dans le layout gère le loader du contenu
  return <>{children}</>;
}
