"use client";

import i18n from "@/i18n/client";
import { showError, showSuccess } from "@/lib/notifications/toast";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";
import { PinSessionService, PinStorageService } from "../../infrastructure";
import { usePinAuthStore } from "../../infrastructure/store/pinAuthStore";

export interface UsePinAuthReturn {
  isLoading: boolean;
  isAuthenticated: boolean;
  verifyPin: (pin: string) => Promise<boolean>;
  hasPin: () => Promise<boolean>;
  storePin: (pin: string) => Promise<boolean>;
  removePin: () => Promise<boolean>;
  clearSession: () => void;
  extendSession: () => boolean;
  getTimeRemaining: () => number;
  isSessionExpiringSoon: (thresholdMinutes?: number) => boolean;
  getSessionStats: () => {
    isActive: boolean;
    timeRemaining: number;
    extendedCount: number;
    sessionDuration: number;
  };
  resetExtensionCount: () => void;
  getPinInfo: () => Promise<{
    exists: boolean;
    isLocked: boolean;
    failedAttempts: number;
    lastUsed?: Date;
    lockUntil?: Date;
  }>;
  redirectToCreatePin: () => void;
  redirectToDashboard: () => void;
}

export function usePinAuth(): UsePinAuthReturn {
  const { data: session, status } = useSession();
  const router = useRouter();

  // ✅ UTILISER LE STORE GLOBAL AU LIEU DE useState LOCAL
  const authState = usePinAuthStore((state) => state.authState);
  const isLoading = usePinAuthStore((state) => state.isLoading);
  const isPinCheckLoading = usePinAuthStore((state) => state.isPinCheckLoading);
  const sessionTrigger = usePinAuthStore((state) => state.sessionTrigger);

  const setAuthState = usePinAuthStore((state) => state.setAuthState);
  const setIsLoading = usePinAuthStore((state) => state.setIsLoading);
  const setIsPinCheckLoading = usePinAuthStore((state) => state.setIsPinCheckLoading);
  const incrementSessionTrigger = usePinAuthStore((state) => state.incrementSessionTrigger);

  // Ref pour éviter les notifications d'erreur multiples
  const hasShownSessionError = useRef(false);

  // Flag de debug (à activer pour diagnostiquer les problèmes)
  const DEBUG_PIN = false;

  // Compteur de renders pour tracer les re-renders
  const renderCountRef = useRef(0);
  const effectRunCountRef = useRef(0);
  renderCountRef.current += 1;

  if (DEBUG_PIN) {
    console.log(`🔄 [usePinAuth] Render #${renderCountRef.current} [GLOBAL STORE]`, {
      authState,
      status,
      sessionTrigger,
      userId: session?.user?.id,
      isPinCheckLoading,
      timestamp: new Date().toISOString(),
    });
  }

  const getUserId = useCallback(
    (showErrorOnFail: boolean = false): string | null => {
      // Si la session est encore en cours de chargement, ne pas afficher d'erreur
      if (status === "loading") {
        return null;
      }

      if (!session?.user?.id) {
        // N'afficher l'erreur que si explicitement demandé et pas déjà affiché
        if (showErrorOnFail && !hasShownSessionError.current) {
          hasShownSessionError.current = true;
          showError(i18n.t("pin:errors.sessionError"), {
            description: i18n.t("pin:errors.sessionErrorDescription"),
          });
        }
        return null;
      }

      // Reset le flag d'erreur si on a une session valide
      hasShownSessionError.current = false;
      return String(session.user.id);
    },
    [session?.user?.id, status]
  );

  // Utiliser useRef pour stabiliser checkAuthentication
  const checkAuthenticationRef = useRef<() => boolean>();
  checkAuthenticationRef.current = () => {
    const userId = getUserId(false);
    if (!userId) return false;
    return PinSessionService.isUserAuthenticated(userId);
  };

  // Effect pour surveiller l'expiration de la session PIN
  useEffect(() => {
    effectRunCountRef.current += 1;

    if (DEBUG_PIN) {
      console.log(`🎯 [usePinAuth] useEffect Run #${effectRunCountRef.current}`, {
        authState,
        status,
        sessionTrigger,
        timestamp: new Date().toISOString(),
      });
    }

    // Attendre que la session NextAuth soit complètement chargée
    if (status === "loading") {
      if (DEBUG_PIN) console.log("⏳ [usePinAuth] Status is loading, skipping");
      return;
    }

    // Vérifier la session uniquement si authState est false
    if (!authState) {
      const isAuth = checkAuthenticationRef.current?.() ?? false;

      if (DEBUG_PIN) {
        console.log("🔍 [usePinAuth] Initial auth check:", {
          isAuth,
          userId: session?.user?.id,
          sessionInfo: PinSessionService.getSessionInfo(),
        });
      }

      setAuthState(isAuth);
      setIsPinCheckLoading(false);

      if (!isAuth) return;
    }

    // À partir d'ici, authState est true
    // NE JAMAIS le repasser à false sauf si vraiment expiré
    const sessionInfo = PinSessionService.getSessionInfo();

    if (!sessionInfo) {
      if (DEBUG_PIN) {
        console.warn("⚠️ [usePinAuth] No session info, but authState was true!", {
          authState,
          sessionStorageKey: "pin-session",
          sessionStorageValue: sessionStorage.getItem("pin-session"),
          timestamp: new Date().toISOString(),
        });
      }

      // GUARD: Ne pas repasser authState à false immédiatement
      // Vérifier plusieurs fois avant de décider
      let retryCount = 0;
      const maxRetries = 3;

      const retryInterval = setInterval(() => {
        const retrySessionInfo = PinSessionService.getSessionInfo();
        retryCount++;

        if (DEBUG_PIN) {
          console.log(`🔄 [usePinAuth] Retry attempt ${retryCount}/${maxRetries}`, {
            hasSessionInfo: !!retrySessionInfo,
            sessionInfo: retrySessionInfo,
          });
        }

        if (retrySessionInfo) {
          // Session retrouvée, tout va bien
          if (DEBUG_PIN) {
            console.log("✅ [usePinAuth] Session recovered on retry!", {
              retryCount,
              sessionInfo: retrySessionInfo,
            });
          }
          clearInterval(retryInterval);
          return;
        }

        if (retryCount >= maxRetries) {
          // Après plusieurs tentatives, vraiment pas de session
          if (DEBUG_PIN) {
            console.error("❌ [usePinAuth] Session definitely lost after retries!", {
              retryCount,
              maxRetries,
              authStateBeforeChange: authState,
              timestamp: new Date().toISOString(),
            });
          }
          setAuthState(false);
          setIsPinCheckLoading(false);
          clearInterval(retryInterval);
        }
      }, 100); // Retry toutes les 100ms

      return () => clearInterval(retryInterval);
    }

    const timeUntilExpiration = sessionInfo.expiresAt - Date.now();

    if (timeUntilExpiration <= 0) {
      // Session vraiment expirée
      if (DEBUG_PIN) {
        console.log("⏰ [usePinAuth] Session expired!", {
          expiresAt: new Date(sessionInfo.expiresAt).toISOString(),
          now: new Date().toISOString(),
          timeUntilExpiration,
        });
      }
      PinSessionService.clearSession();
      setAuthState(false);
      setIsPinCheckLoading(false);
      return;
    }

    // Planifier l'expiration
    if (DEBUG_PIN) {
      console.log("⏱️ [usePinAuth] Session valid, scheduling expiration", {
        expiresAt: new Date(sessionInfo.expiresAt).toISOString(),
        expiresInSeconds: Math.floor(timeUntilExpiration / 1000),
        expiresInMinutes: Math.floor(timeUntilExpiration / 60000),
        sessionInfo,
      });
    }

    const timeout = setTimeout(() => {
      if (DEBUG_PIN) {
        console.log("⏰ [usePinAuth] Session timeout reached, clearing session", {
          timestamp: new Date().toISOString(),
        });
      }
      PinSessionService.clearSession();
      setAuthState(false);
    }, timeUntilExpiration);

    return () => {
      if (DEBUG_PIN) {
        console.log("🧹 [usePinAuth] Cleaning up timeout", {
          timestamp: new Date().toISOString(),
        });
      }
      clearTimeout(timeout);
    };
    // DEBUG_PIN est une constante, session?.user?.id est couvert par getUserId
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionTrigger, authState, status, getUserId, setAuthState, setIsPinCheckLoading]);

  const verifyPin = useCallback(
    async (pin: string): Promise<boolean> => {
      const userId = getUserId(true); // Afficher l'erreur si nécessaire
      if (!userId) return false;

      if (DEBUG_PIN) {
        console.log("🔐 [usePinAuth] Verifying PIN", {
          userId,
          timestamp: new Date().toISOString(),
        });
      }

      setIsLoading(true);
      try {
        const result = await PinStorageService.verifyPinForUser(userId, pin);

        if (result.success) {
          // Marquer l'utilisateur comme authentifié par PIN
          PinSessionService.authenticateUser(userId);

          if (DEBUG_PIN) {
            console.log("✅ [usePinAuth] PIN verified successfully", {
              userId,
              sessionInfo: PinSessionService.getSessionInfo(),
              timestamp: new Date().toISOString(),
            });
          }

          setAuthState(true);
          setIsPinCheckLoading(false);
          incrementSessionTrigger();

          showSuccess(i18n.t("pin:toast.pinConfirmed"), {
            description: i18n.t("pin:toast.accessGranted"),
          });
          return true;
        } else {
          const errorMessage =
            result.error || i18n.t("pin:errors.incorrectPin");
          showError(i18n.t("pin:errors.verificationFailed"), {
            description:
              result.attemptsRemaining !== undefined
                ? `${errorMessage}. ${i18n.t("pin:toast.attemptsRemaining", {
                    count: result.attemptsRemaining,
                  })}`
                : errorMessage,
          });
          return false;
        }
      } catch (error) {
        console.error("Erreur lors de la vérification du PIN:", error);
        showError(i18n.t("pin:errors.technicalError"), {
          description: i18n.t("pin:errors.verificationError"),
        });
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    // DEBUG_PIN est une constante
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [getUserId, setIsLoading, setAuthState, setIsPinCheckLoading, incrementSessionTrigger]
  );

  const hasPin = useCallback(async (): Promise<boolean> => {
    const userId = getUserId(false); // Ne pas afficher d'erreur pour cette vérification
    if (!userId) return false;

    try {
      return await PinStorageService.hasPinForUser(userId);
    } catch (error) {
      console.error(
        "Erreur lors de la vérification de l'existence du PIN:",
        error
      );
      return false;
    }
  }, [getUserId]);

  const storePin = useCallback(
    async (pin: string): Promise<boolean> => {
      const userId = getUserId(true); // Afficher l'erreur si nécessaire
      if (!userId) return false;

      setIsLoading(true);
      try {
        await PinStorageService.storePinForUser(userId, pin);

        // Authentifier automatiquement l'utilisateur après la création du PIN
        PinSessionService.authenticateUser(userId);
        setAuthState(true);
        setIsPinCheckLoading(false);
        incrementSessionTrigger();

        showSuccess(i18n.t("pin:toast.pinStored"), {
          description: i18n.t("pin:toast.pinStoredDescription"),
        });
        return true;
      } catch (error) {
        console.error("Erreur lors du stockage du PIN:", error);
        showError(i18n.t("pin:errors.storageError"), {
          description: i18n.t("pin:errors.storageErrorDescription"),
        });
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [getUserId, setIsLoading, setAuthState, setIsPinCheckLoading, incrementSessionTrigger]
  );

  const removePin = useCallback(async (): Promise<boolean> => {
    const userId = getUserId(true); // Afficher l'erreur si nécessaire
    if (!userId) return false;

    setIsLoading(true);
    try {
      await PinStorageService.removePinForUser(userId);

      // Effacer la session PIN
      PinSessionService.clearSession();
      setAuthState(false);

      showSuccess(i18n.t("pin:toast.pinRemoved"), {
        description: i18n.t("pin:toast.pinRemovedDescription"),
      });
      return true;
    } catch (error) {
      console.error("Erreur lors de la suppression du PIN:", error);
      showError(i18n.t("pin:errors.removalError"), {
        description: i18n.t("pin:errors.removalErrorDescription"),
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [getUserId, setIsLoading, setAuthState]);

  const clearSession = useCallback(() => {
    PinSessionService.clearSession();
    setAuthState(false);
    incrementSessionTrigger();
  }, [setAuthState, incrementSessionTrigger]);

  const extendSession = useCallback((): boolean => {
    const userId = getUserId(false); // Ne pas afficher d'erreur pour cette vérification
    if (!userId) return false;
    const extended = PinSessionService.extendSession(userId);
    if (extended) {
      incrementSessionTrigger();
    }
    return extended;
  }, [getUserId, incrementSessionTrigger]);

  const getTimeRemaining = useCallback((): number => {
    return PinSessionService.getTimeRemaining();
  }, []);

  const isSessionExpiringSoon = useCallback(
    (thresholdMinutes?: number): boolean => {
      return PinSessionService.isSessionExpiringSoon(thresholdMinutes);
    },
    []
  );

  const getSessionStats = useCallback(() => {
    return PinSessionService.getSessionStats();
  }, []);

  const resetExtensionCount = useCallback(() => {
    PinSessionService.resetExtensionCount();
  }, []);

  const getPinInfo = useCallback(async () => {
    const userId = getUserId(false); // Ne pas afficher d'erreur pour cette vérification
    if (!userId) {
      return { exists: false, isLocked: false, failedAttempts: 0 };
    }

    try {
      return await PinStorageService.getPinInfoForUser(userId);
    } catch (error) {
      console.error("Erreur lors de la récupération des infos PIN:", error);
      return { exists: false, isLocked: false, failedAttempts: 0 };
    }
  }, [getUserId]);

  const redirectToCreatePin = useCallback(() => {
    router.push("/auth/create-pin");
  }, [router]);

  const redirectToDashboard = useCallback(() => {
    router.push("/dashboard");
  }, [router]);

  return {
    isLoading: isLoading || status === "loading" || isPinCheckLoading,
    isAuthenticated: authState,
    verifyPin,
    hasPin,
    storePin,
    removePin,
    clearSession,
    extendSession,
    getTimeRemaining,
    isSessionExpiringSoon,
    getSessionStats,
    resetExtensionCount,
    getPinInfo,
    redirectToCreatePin,
    redirectToDashboard,
  };
}
