"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CreatePinForm, usePinAuth } from "@/features/pin";
import { showError, showSuccess } from "@/lib/notifications/toast";
import {
  Clock,
  Key,
  RefreshCw,
  Shield,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { LoadingLoader } from "../modules/loading-loader";

export function PinSettings() {
  const { hasPin, removePin, getSessionStats, isLoading, clearSession } =
    usePinAuth();

  const [pinExists, setPinExists] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCheckingPin, setIsCheckingPin] = useState(true);
  const [sessionStats, setSessionStats] = useState({
    isActive: false,
    timeRemaining: 0,
    extendedCount: 0,
    sessionDuration: 0,
  });

  useEffect(() => {
    const checkPinStatus = async () => {
      try {
        const exists = await hasPin();
        setPinExists(exists);

        const stats = getSessionStats();
        setSessionStats(stats);
      } catch (error) {
        console.error("Erreur lors de la vérification du PIN:", error);
      } finally {
        setIsCheckingPin(false);
      }
    };

    checkPinStatus();
  }, [hasPin, getSessionStats]);

  const handleCreateNewPin = () => {
    setShowCreateForm(true);
  };

  const handleRemovePin = async () => {
    if (
      confirm(
        "Êtes-vous sûr de vouloir supprimer votre code PIN ? Vous devrez en créer un nouveau pour accéder à l'application."
      )
    ) {
      try {
        const success = await removePin();
        if (success) {
          setPinExists(false);
          setSessionStats({
            isActive: false,
            timeRemaining: 0,
            extendedCount: 0,
            sessionDuration: 0,
          });
        }
      } catch (error) {
        console.error("Erreur lors de la suppression du PIN:", error);
        showError("Erreur", {
          description: "Impossible de supprimer le code PIN",
        });
      }
    }
  };

  const handleClearSession = () => {
    clearSession();
    setSessionStats((prev) => ({ ...prev, isActive: false }));
    showSuccess("Session effacée", {
      description: "Vous devrez saisir votre code PIN à nouveau",
    });
  };

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours > 0) {
      return `${hours}h ${mins}min`;
    }
    return `${mins}min`;
  };

  if (isCheckingPin) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <LoadingLoader />
            <span>Vérification du code PIN...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (showCreateForm) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Key className="h-5 w-5" />
            <span>Créer un nouveau code PIN</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CreatePinForm />
          <div className="mt-4">
            <Button
              variant="outline"
              onClick={() => setShowCreateForm(false)}
              className="w-full"
            >
              Annuler
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* État du code PIN */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Code PIN de sécurité</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-3">
              {pinExists ? (
                <ShieldCheck className="h-6 w-6 text-green-600" />
              ) : (
                <Shield className="h-6 w-6 text-gray-400" />
              )}
              <div>
                <p className="font-medium">
                  {pinExists ? "Code PIN configuré" : "Aucun code PIN"}
                </p>
                <p className="text-sm text-gray-600">
                  {pinExists
                    ? "Votre accès est sécurisé par un code PIN"
                    : "Configurez un code PIN pour sécuriser l'accès"}
                </p>
              </div>
            </div>

            <div className="space-x-2">
              {pinExists ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCreateNewPin}
                    disabled={isLoading}
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Modifier
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleRemovePin}
                    disabled={isLoading}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Supprimer
                  </Button>
                </>
              ) : (
                <Button onClick={handleCreateNewPin} size="sm">
                  <Key className="h-4 w-4 mr-1" />
                  Créer un PIN
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informations de session */}
      {pinExists && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Session actuelle</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sessionStats.isActive ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 border rounded-lg">
                    <p className="text-sm text-gray-600">Temps restant</p>
                    <p className="font-semibold text-lg">
                      {formatTime(sessionStats.timeRemaining)}
                    </p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <p className="text-sm text-gray-600">Durée de session</p>
                    <p className="font-semibold text-lg">
                      {formatTime(sessionStats.sessionDuration)}
                    </p>
                  </div>
                </div>

                <div className="p-3 border rounded-lg">
                  <p className="text-sm text-gray-600">Extensions utilisées</p>
                  <p className="font-semibold">
                    {sessionStats.extendedCount} / 10
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{
                        width: `${(sessionStats.extendedCount / 10) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                <Separator />

                <Button
                  variant="outline"
                  onClick={handleClearSession}
                  className="w-full"
                >
                  Terminer la session
                </Button>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-600">Aucune session PIN active</p>
                <p className="text-sm text-gray-500 mt-1">
                  Vous devrez saisir votre code PIN lors du prochain accès
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
