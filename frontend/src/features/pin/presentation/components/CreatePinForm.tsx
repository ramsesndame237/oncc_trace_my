"use client";

import { Button } from "@/components/ui/button";
import { showError, showInfo } from "@/lib/notifications/toast";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  PinStorageService,
  PinValidationResult,
  validatePinWithDetails,
} from "../../infrastructure";
import { usePinAuth } from "../hooks/usePinAuth";
import PinForm from "./PinForm";

type CreatePinStep = "check" | "create" | "confirm" | "verify";

export function CreatePinForm() {
  const { t } = useTranslation("pin");
  const router = useRouter();
  const { data: session } = useSession();
  const { storePin: storePinWithAuth, verifyPin: verifyPinWithAuth } = usePinAuth();
  const [step, setStep] = useState<CreatePinStep>("check");
  const [pin, setPin] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [hasExistingPin, setHasExistingPin] = useState(false);

  // --- Vérification initiale ---
  useEffect(() => {
    const checkExistingPin = async () => {
      if (!session?.user?.id) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      const pinInfo = await PinStorageService.getPinInfoForUser(
        String(session.user.id)
      );
      if (pinInfo.exists) {
        setHasExistingPin(true);
        setStep("verify");
      } else {
        setStep("create");
      }
      setIsLoading(false);
    };
    checkExistingPin();
  }, [session?.user?.id]);

  // --- Gestion de la validation ---
  const handleValidationFailed = (result: PinValidationResult) => {
    const errorMessages: string[] = [];
    if (result.errors.hasRepeatingDigits)
      errorMessages.push(t("validation.hasRepeatingDigits"));
    if (result.errors.isSequential)
      errorMessages.push(t("validation.isSequential"));
    if (result.errors.isKnownSequence)
      errorMessages.push(t("validation.isKnownSequence"));
    if (result.errors.containsDatePattern)
      errorMessages.push(t("validation.containsDatePattern"));

    showError(t("validation.unsecureTitle"), {
      description: `${t("validation.prefix")} ${errorMessages.join(", ")}.`,
    });
    setPin("");
  };

  // --- Logique de soumission ---
  const handleSubmitCreate = (pin: string) => {
    const validationResult = validatePinWithDetails(pin, {
      checkRepeatingDigits: true,
      checkSequential: true,
      checkKnownSequences: true,
      checkDatePatterns: false,
    });

    if (!validationResult.isValid) {
      handleValidationFailed(validationResult);
      return;
    }
    setStep("confirm");
    showInfo(t("success.initialPinEntered"), {
      description: t("success.confirmNow"),
    });
  };

  const handleSubmitConfirm = async (confirmPin: string) => {
    if (pin !== confirmPin) {
      showError(t("validation.pinMismatch"), {
        description: t("validation.tryAgain"),
      });
      return;
    }

    if (!session?.user?.id) return;

    try {
      // ✅ Utiliser le hook usePinAuth qui met à jour le store Zustand global
      const success = await storePinWithAuth(pin);
      if (success) {
        router.replace("/auth/sync");
      }
    } catch {
      showError(t("errors.storageError"), {
        description: t("errors.cannotSavePin"),
      });
    }
  };

  const handleSubmitVerify = async (pin: string) => {
    if (!session?.user?.id) return;

    // ✅ Utiliser le hook usePinAuth qui met à jour le store Zustand global
    const success = await verifyPinWithAuth(pin);

    if (success) {
      router.replace("/auth/sync");
    } else {
      setPin("");
    }
  };

  const handleRecreatePin = () => {
    setStep("create");
    setPin("");
    setHasExistingPin(false);
  };

  // --- Rendu ---
  if (isLoading) {
    return <div>{t("creation.verifying")}</div>;
  }

  return (
    <div className="space-y-6">
      {step === "verify" && hasExistingPin && (
        <>
          <PinForm
            key="verify-pin"
            instructions={t("creation.instructionsVerify")}
            submitText={t("creation.confirmAndEnter")}
            onPinChange={setPin}
            onPinComplete={handleSubmitVerify}
            isLoading={isLoading}
            focused
          />
          <div className="text-center">
            <Button
              onClick={handleRecreatePin}
              variant="link"
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              {t("form.forgotPin")}
            </Button>
          </div>
        </>
      )}

      {step === "create" && (
        <PinForm
          key="create-pin"
          instructions={t("creation.instructionsCreate")}
          submitText={t("creation.continue")}
          onPinChange={setPin}
          onPinComplete={handleSubmitCreate}
          isLoading={isLoading}
          focused
        />
      )}

      {step === "confirm" && (
        <>
          <PinForm
            key="confirm-pin"
            instructions={t("creation.instructionsConfirm")}
            submitText={t("creation.confirmAndSave")}
            onPinComplete={handleSubmitConfirm}
            isLoading={isLoading}
            focused
          />
          <div className="flex justify-center mt-6">
            <Button
              variant="link"
              onClick={handleRecreatePin}
              className="w-full"
            >
              {t("creation.back")}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
