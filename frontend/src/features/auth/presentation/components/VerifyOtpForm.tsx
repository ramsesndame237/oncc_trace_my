"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

import FormInput from "@/components/forms/form-input";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { ServiceProvider } from "@/core/infrastructure/di/serviceProvider";
import { useNotification } from "@/lib/notifications";
import { signIn } from "next-auth/react";
import { useAuthStore } from "../../infrastructure/store/authStore";
import { createOtpSchema, type OtpFormData } from "../schemas";

export function VerifyOtpForm() {
  const { t } = useTranslation(["auth", "common"]);
  const router = useRouter();
  const { success, error } = useNotification();
  const searchParams = useSearchParams();
  const sessionToken = searchParams.get("sessionToken");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const { user } = useAuthStore();

  useEffect(() => {
    if (!sessionToken) {
      router.push(`/auth/login`);
    }
  }, [sessionToken, router]);

  // Fonction pour masquer partiellement l'email
  const maskEmail = (email: string) => {
    if (!email) return "";
    const [localPart, domain] = email.split("@");
    if (localPart.length <= 2) {
      return `${localPart[0]}***@${domain}`;
    }
    const maskedLocal = `${localPart.slice(0, 2)}${"*".repeat(
      localPart.length - 2
    )}`;
    return `${maskedLocal}@${domain}`;
  };

  const form = useForm<OtpFormData>({
    resolver: zodResolver(createOtpSchema(t)),
    defaultValues: {
      otp: "",
    },
  });

  const onSubmit = async (data: OtpFormData) => {
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        username: user?.username,
        sessionToken,
        userId: user?.id,
        otp: data.otp,
        authStep: "otp", // Étape de vérification OTP
        redirect: false, // On gère la redirection manuellement
      });

      if (result?.error) {
        error(t("messages.verificationError"), result.error);
        return;
      }

      success(t("messages.verificationSuccess"), t("messages.pinRedirect"));

      // Redirection vers la page de création de PIN
      router.replace("/auth/create-pin");
    } catch {
      error(t("messages.verificationError"), t("messages.unexpectedError"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!sessionToken || !user?.id) {
      error(t("messages.verificationError"), t("messages.sessionMissing"));
      return;
    }

    setIsResending(true);

    try {
      const resendOtpUseCase = ServiceProvider.Auth.getResendOtpUseCase();

      const result = await resendOtpUseCase.execute({
        sessionToken,
        userId: user.id,
      });

      if (result.success) {
        success(
          t("messages.codeResent"),
          t("messages.codeSentTo", { email: maskEmail(user?.email || "") })
        );
        // Réinitialiser le champ OTP pour encourager l'utilisateur à saisir le nouveau code
        form.reset({ otp: "" });
      } else {
        error(t("messages.verificationError"), t("messages.resendError"));
      }
    } catch {
      console.error("Erreur lors du renvoi du code OTP:");
      error(
        t("messages.verificationError"),
        t("messages.resendUnexpectedError")
      );
    } finally {
      setIsResending(false);
    }
  };

  return (
    <>
      {/* Message d'information */}
      <p className="text-center text-gray-600 mb-6">
        {t("otp.codeSent")}
        <br />
        <span className="font-semibold">{maskEmail(user?.email || "")}</span>
      </p>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormInput
            form={form}
            name="otp"
            label={t("form.otpCode")}
            placeholder={t("form.otpPlaceholder")}
          />

          <Button
            type="submit"
            className="w-full"
            loading={isLoading}
            disabled={isLoading || isResending}
            size="lg"
          >
            {t("otp.verify")}
          </Button>
        </form>
      </Form>

      {/* Lien pour renvoyer le code */}
      <div className="mt-6 text-center">
        <Button
          type="button"
          variant="link"
          onClick={handleResendCode}
          loading={isResending}
          disabled={isLoading || isResending}
          className="text-sm font-bold text-primary hover:underline"
        >
          {isResending ? t("otp.resending") : t("otp.resend")}
        </Button>
      </div>
    </>
  );
}
