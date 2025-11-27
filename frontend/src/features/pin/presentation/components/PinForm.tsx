"use client";

import { Button } from "@/components/ui/button";
import { InputOTP } from "@/components/ui/input-otp";
import { useCallback, useEffect, useRef } from "react";
import { PIN_CONFIG } from "../../infrastructure/config/pinConfig";

export type PinFormProps = {
  length?: number;
  instructions?: string;
  submitText?: string;
  value?: string;
  onPinChange?: (pin: string) => void;
  onPinComplete?: (pin: string) => void;
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
  className?: string;
  isLoading?: boolean;
  focused?: boolean;
};

export default function PinForm({
  length = PIN_CONFIG.security.pinLength,
  instructions,
  submitText = "Confirmer",
  value,
  onPinChange,
  onPinComplete,
  onSubmit,
  className = "",
  isLoading = false,
  focused = false,
}: PinFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fonction pour forcer le focus sur l'input OTP
  const focusOTPInput = useCallback(() => {
    if (containerRef.current && !isLoading) {
      // Chercher l'input caché de la librairie input-otp
      const otpInput = containerRef.current.querySelector(
        "input[data-input-otp]"
      ) as HTMLInputElement;
      if (otpInput) {
        otpInput.focus();
        return;
      }

      // Fallback: chercher tout input dans le container
      const anyInput = containerRef.current.querySelector(
        "input"
      ) as HTMLInputElement;
      if (anyInput) {
        anyInput.focus();
        return;
      }

      // Dernier recours: essayer de déclencher un clic sur le premier slot
      const firstSlot = containerRef.current.querySelector(
        "[data-input-otp-slot]"
      ) as HTMLElement;
      if (firstSlot) {
        firstSlot.click();
      }
    }
  }, [isLoading]);

  // Handle click sur le container pour focus
  const handleContainerClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      focusOTPInput();
    },
    [focusOTPInput]
  );

  // Handle touch sur le container pour focus (mobile)
  const handleContainerTouch = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      focusOTPInput();
    },
    [focusOTPInput]
  );

  // Auto-focus quand le composant devient focusé
  useEffect(() => {
    if (focused) {
      const timer = setTimeout(focusOTPInput, 100);
      return () => clearTimeout(timer);
    }
  }, [focused, focusOTPInput]);

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      className={`space-y-4 ${className}`}
    >
      {/* Instructions */}
      {instructions && (
        <div className="mx-auto max-w-md">
          <p className="px-4 py-2 font-medium text-center text-gray-700">
            {instructions}
          </p>
        </div>
      )}

      <div
        ref={containerRef}
        className="my-12 cursor-pointer select-none"
        onClick={handleContainerClick}
        onTouchStart={handleContainerTouch}
      >
        <InputOTP
          name="pin"
          length={length}
          autoFocus={focused}
          position="center"
          className="my-12 text-center"
          value={value}
          onChange={onPinChange}
          disabled={isLoading}
          inputMode="numeric"
          onComplete={onPinComplete}
        />
      </div>

      <Button
        type="submit"
        className="w-full"
        loading={isLoading}
        disabled={isLoading}
        size="lg"
      >
        {submitText}
      </Button>
    </form>
  );
}
