"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// Routes où la navigation arrière est bloquée (formulaires de création/édition)
const BLOCKED_BACK_ROUTES = [
  "/actors/producer/create",
  "/actors/producer/edit",
  "/actors/producers/create",
  "/actors/producers/edit",
  "/actors/buyers/create",
  "/actors/buyers/edit",
  "/actors/exporters/create",
  "/actors/exporters/edit",
  "/actors/transformers/create",
  "/actors/transformers/edit",
  "/stores/create",
  "/stores/edit",
  "/users/create",
  "/users/edit",
  // Variantes sing
  "/campaign/create",
  "/campaign/edit",
  "/production-basin/create",
  "/production-basin/edit",
  "/conventions/create",
  "/conventions/edit",
];

interface NavigationState {
  canGoBack: boolean;
  canGoForward: boolean;
  historyLength: number;
}

// Clés pour sessionStorage
const HISTORY_STACK_KEY = "navigation_history_stack";
const HISTORY_INDEX_KEY = "navigation_history_index";

export function useNavigationControl() {
  const router = useRouter();
  const pathname = usePathname();

  const isPopStateRef = useRef<boolean>(false);
  const isInitializedRef = useRef<boolean>(false);

  const [navigationState, setNavigationState] = useState<NavigationState>({
    canGoBack: false,
    canGoForward: false,
    historyLength: 0,
  });

  // Fonctions utilitaires
  const getHistoryStack = (): string[] => {
    if (typeof window === "undefined") return [];
    const stored = sessionStorage.getItem(HISTORY_STACK_KEY);
    return stored ? JSON.parse(stored) : [];
  };

  const getCurrentIndex = (): number => {
    if (typeof window === "undefined") return 0;
    const stored = sessionStorage.getItem(HISTORY_INDEX_KEY);
    return stored ? parseInt(stored, 10) : 0;
  };

  const setHistoryStack = (stack: string[]) => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(HISTORY_STACK_KEY, JSON.stringify(stack));
    }
  };

  const setCurrentIndex = (index: number) => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(HISTORY_INDEX_KEY, index.toString());
    }
  };

  const clearHistory = () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(HISTORY_STACK_KEY);
      sessionStorage.removeItem(HISTORY_INDEX_KEY);
    }
  };

  // Initialisation et détection du rafraîchissement
  useEffect(() => {
    if (typeof window === "undefined" || isInitializedRef.current) return;

    // Vérifier si c'est un rafraîchissement de page
    const navigationEntries = performance.getEntriesByType(
      "navigation"
    ) as PerformanceNavigationTiming[];
    const isReload =
      navigationEntries.length > 0 && navigationEntries[0].type === "reload";

    if (isReload) {
      // Vider l'historique au rafraîchissement
      clearHistory();
    }

    const existingStack = getHistoryStack();

    // Si l'historique est vide (rafraîchissement ou première visite), initialiser avec la page actuelle
    if (existingStack.length === 0 && pathname) {
      setHistoryStack([pathname]);
      setCurrentIndex(0);
    }

    isInitializedRef.current = true;
  }, [pathname]);

  // Gérer les changements de pathname
  useEffect(() => {
    if (typeof window === "undefined" || !pathname) return;

    const isBlockedRoute = BLOCKED_BACK_ROUTES.some((route) =>
      pathname.startsWith(route)
    );

    let historyStack = getHistoryStack();
    let currentIndex = getCurrentIndex();

    // Si ce n'est pas un événement popstate, c'est une nouvelle navigation
    if (!isPopStateRef.current) {
      // NE PAS ajouter les routes bloquées à l'historique
      if (!isBlockedRoute) {
        // Supprimer tout l'historique après l'index actuel (cas où on navigue depuis un point milieu)
        historyStack = historyStack.slice(0, currentIndex + 1);

        // Ajouter la nouvelle page si elle est différente de la dernière
        const lastPath = historyStack[historyStack.length - 1];
        if (lastPath !== pathname) {
          historyStack.push(pathname);
          currentIndex = historyStack.length - 1;

          setHistoryStack(historyStack);
          setCurrentIndex(currentIndex);
        }
      }
    } else {
      // Si c'est un popstate, relire les valeurs à jour depuis sessionStorage
      historyStack = getHistoryStack();
      currentIndex = getCurrentIndex();
    }

    // Réinitialiser le flag
    isPopStateRef.current = false;

    // Calculer l'état de navigation avec les valeurs finales
    const canGoBack = !isBlockedRoute && currentIndex > 0;
    const canGoForward = currentIndex < historyStack.length - 1;

    setNavigationState({
      canGoBack,
      canGoForward,
      historyLength: historyStack.length,
    });
  }, [pathname]);

  // Écouter les événements popstate (boutons back/forward du navigateur)
  useEffect(() => {
    const handlePopState = () => {
      isPopStateRef.current = true;

      const currentPath = window.location.pathname;
      const historyStack = getHistoryStack();
      const currentIndex = getCurrentIndex();

      // Déterminer si c'est un back ou forward
      let newIndex = currentIndex;

      // Chercher en arrière d'abord (pour back)
      for (let i = currentIndex - 1; i >= 0; i--) {
        if (historyStack[i] === currentPath) {
          newIndex = i;
          break;
        }
      }

      // Si pas trouvé en arrière, chercher en avant (pour forward)
      if (newIndex === currentIndex) {
        for (let i = currentIndex + 1; i < historyStack.length; i++) {
          if (historyStack[i] === currentPath) {
            newIndex = i;
            break;
          }
        }
      }

      // Mettre à jour l'index
      setCurrentIndex(newIndex);

      // Vérifier si c'est une route bloquée
      const isBlockedRoute = BLOCKED_BACK_ROUTES.some((route) =>
        currentPath.startsWith(route)
      );

      // Recalculer l'état immédiatement
      const canGoBack = !isBlockedRoute && newIndex > 0;
      const canGoForward = newIndex < historyStack.length - 1;

      setNavigationState({
        canGoBack,
        canGoForward,
        historyLength: historyStack.length,
      });
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  const goBack = () => {
    if (navigationState.canGoBack) {
      router.back();
    }
  };

  const goForward = () => {
    if (navigationState.canGoForward && typeof window !== "undefined") {
      window.history.forward();
    }
  };

  return {
    ...navigationState,
    goBack,
    goForward,
  };
}
