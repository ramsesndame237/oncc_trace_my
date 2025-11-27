"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { usePinAuth } from "../hooks/usePinAuth";
import PinForm from "./PinForm";

interface PinVerificationFormProps {
  onSuccess?: () => void;
  onRecreate?: () => void;
  title?: string;
  description?: string;
  guard?: boolean;
}

export function PinVerificationForm({
  onSuccess,
  onRecreate,
  title,
  description,
  guard = false,
}: PinVerificationFormProps) {
  const { t } = useTranslation("pin");
  const { verifyPin, isLoading, redirectToDashboard, redirectToCreatePin } =
    usePinAuth();

  const [verificationAttempts, setVerificationAttempts] = useState(0);

  const handlePinSubmit = async (pin: string) => {
    try {
      const isValid = await verifyPin(pin);

      if (isValid) {
        onSuccess?.();
        // Ne pas rediriger automatiquement si onSuccess est fourni
        // car le parent gère probablement déjà la navigation
        if (!onSuccess) {
          redirectToDashboard();
        }
        return;
      }

      // PIN incorrect
      const newAttempts = verificationAttempts + 1;
      setVerificationAttempts(newAttempts);

      // Après 3 tentatives échouées, proposer de recréer le PIN
      if (newAttempts >= 3) {
        // Reset le compteur pour permettre de nouvelles tentatives
        setVerificationAttempts(0);
        throw new Error(t("errors.incorrectPin"));
      }
    } catch (error) {
      console.error(t("errors.verificationError"), error);
      // En cas d'erreur, permettre de recréer le PIN
    }
  };

  const handleRecreatePin = () => {
    if (onRecreate) {
      onRecreate();
    } else {
      redirectToCreatePin();
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold text-gray-900">
          {title || t("verification.title")}
        </h2>
        <p className="text-gray-600">
          {description || t("verification.description")}
        </p>
      </div>

      {verificationAttempts >= 3 && (
        <Card className="p-4 border-amber-200 bg-amber-50">
          <div className="text-center space-y-3">
            <p className="text-amber-800 text-sm">
              {t("verification.tooManyAttempts")}
            </p>
            <Button
              onClick={handleRecreatePin}
              variant="outline"
              className="w-full"
            >
              {t("verification.createNewPin")}
            </Button>
          </div>
        </Card>
      )}

      <div className="space-y-4">
        <PinForm
          key={`verify-pin-${verificationAttempts}`}
          instructions={t("verification.enterPin")}
          isLoading={isLoading}
          onPinComplete={handlePinSubmit}
          focused
        />

        {!guard && (
          <div className="text-center">
            <Button
              onClick={handleRecreatePin}
              variant="link"
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              {t("verification.forgotPin")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
