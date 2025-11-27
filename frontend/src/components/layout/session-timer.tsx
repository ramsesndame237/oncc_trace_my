"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { usePinAuth } from "@/features/pin";
import { showSuccess, showWarning } from "@/lib/notifications/toast";
import { Clock, RefreshCw } from "lucide-react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

interface SessionTimerProps {
  showOnlyWhenLow?: boolean;
  warningThresholdMinutes?: number;
}

const PIN_PROTECTED_ROUTES = ["/(main)", "/(forms)"];

export function SessionTimer({
  showOnlyWhenLow = true,
  warningThresholdMinutes = 5,
}: SessionTimerProps) {
  const { t } = useTranslation("common");
  const { data: session } = useSession();
  const pathname = usePathname();
  const { isAuthenticated, extendSession, getTimeRemaining } = usePinAuth();
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const warningShownRef = useRef(false);

  // Vérifier si on est sur une route protégée
  const isProtectedRoute = PIN_PROTECTED_ROUTES.some((route) => {
    if (route.includes("(") && route.includes(")")) {
      const cleanRoute = route.replace(/\([^)]*\)/g, "");
      return pathname.startsWith(cleanRoute);
    }
    return pathname.startsWith(route);
  });

  // Mémoriser getTimeRemaining pour éviter qu'il change
  const getTimeRemainingStable = useMemo(() => getTimeRemaining, [getTimeRemaining]);

  useEffect(() => {
    if (!session?.user || !isProtectedRoute || !isAuthenticated) {
      setIsVisible(false);
      return;
    }

    const updateTimer = () => {
      const remaining = getTimeRemainingStable(); // Utiliser la version stable

      setTimeRemaining(remaining);

      // Si la session a expiré (0 minutes), rafraîchir la page
      // Le reload permet de vérifier si le PIN a expiré lors du chargement
      if (remaining === 0) {
        window.location.reload();
        return;
      }

      // Le timer s'occupe juste d'afficher le temps restant
      // usePinAuth gère automatiquement l'expiration
      if (showOnlyWhenLow) {
        setIsVisible(remaining > 0 && remaining <= warningThresholdMinutes);
      } else {
        setIsVisible(remaining > 0);
      }

      // Afficher un avertissement à 2 minutes (une seule fois)
      if (remaining === 2 && !warningShownRef.current) {
        warningShownRef.current = true;
        showWarning(t("session.pinSession"), {
          description: t("session.expiresInMinutes", { minutes: 2 }),
        });
      }

      // Réinitialiser le flag si on repasse au-dessus de 2 minutes (extension de session)
      if (remaining > 2) {
        warningShownRef.current = false;
      }
    };

    // Mise à jour initiale
    updateTimer();

    // Mise à jour toutes les secondes pour plus de précision
    const interval = setInterval(updateTimer, 3000);

    return () => clearInterval(interval);
  }, [
    session?.user,
    isProtectedRoute,
    isAuthenticated,
    showOnlyWhenLow,
    warningThresholdMinutes,
    t,
    getTimeRemainingStable,
  ]);

  const handleExtendSession = () => {
    const extended = extendSession();
    if (extended) {
      const newTime = getTimeRemaining();
      setTimeRemaining(newTime);
      warningShownRef.current = false; // Réinitialiser le flag du toast
      showSuccess(t("session.extended"), {
        description: t("session.extendedDescription", { minutes: 30 }),
      });
    }
  };

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours > 0) {
      return `${hours}h ${mins}min`;
    }
    return `${mins}min`;
  };

  const getColorClass = (): string => {
    if (timeRemaining <= 2) return "border-red-500 bg-red-50";
    if (timeRemaining <= warningThresholdMinutes)
      return "border-yellow-500 bg-yellow-50";
    return "border-green-500 bg-green-50";
  };

  if (!isVisible) {
    return null;
  }

  return (
    <Card className={`fixed bottom-4 right-4 z-50 w-80 ${getColorClass()}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <div>
              <p className="text-sm font-medium">{t("session.pinSession")}</p>
              <p className="text-xs text-gray-600">
                {t("session.expiresIn", { time: formatTime(timeRemaining) })}
              </p>
            </div>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={handleExtendSession}
            className="flex items-center space-x-1"
          >
            <RefreshCw className="h-3 w-3" />
            <span>{t("session.extend")}</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
