"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { FormPasswordInput } from "@/components/forms";
import FormInput from "@/components/forms/form-input";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useNotification } from "@/lib/notifications";
import { useAuthStore } from "../../infrastructure/store/authStore";
import { createLoginSchema, type LoginFormData } from "../schemas";

export function LoginForm() {
  const { t } = useTranslation(["auth", "common"]);
  const router = useRouter();
  const searchParams = useSearchParams();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const { success, error, warning } = useNotification();
  const { setUser } = useAuthStore();

  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(createLoginSchema(t)),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        username: data.username,
        password: data.password,
        authStep: "login", // Indique que c'est la première étape
        redirect: false, // On gère la redirection manuellement
      });

      if (result?.error) {
        try {
          // On essaie de parser l'erreur pour trouver notre instruction de redirection
          const customError = JSON.parse(result.error);
          if (customError.redirectUrl) {
            const url = new URL(
              customError.redirectUrl,
              window.location.origin
            );
            if (customError.sessionToken) {
              url.searchParams.append("sessionToken", customError.sessionToken);
            }

            if (customError.user) {
              setUser(customError.user);
            }

            if (customError.requiresInitialization) {
              warning(t("messages.modeReset"), t("messages.redirectingToInit"));
            } else {
              success(
                t("messages.loginSuccess"),
                t("messages.redirectingToOtp")
              );
            }
            console.log("url", url.toString());
            router.push(url.toString());
            return;
          }
        } catch {
          // Si le parsing échoue, c'est une erreur standard
          if (result.error === "CredentialsSignin") {
            error(t("messages.loginFailed"), t("messages.invalidCredentials"));
          } else {
            error(t("messages.loginFailed"), result.error);
          }
        }
      }
    } catch {
      error(t("messages.unexpectedError"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormInput
            form={form}
            name="username"
            label={t("form.username")}
            placeholder={t("form.usernamePlaceholder")}
          />

          <FormPasswordInput
            form={form}
            name="password"
            label={t("form.password")}
            placeholder={t("form.passwordPlaceholder")}
          />

          <Button
            type="submit"
            className="w-full"
            loading={isLoading}
            size="lg"
          >
            {t("form.submit")}
          </Button>
        </form>
      </Form>

      <div className="mt-6 text-center space-y-2">
        <Link
          href="/auth/ask-recovery"
          className="text-sm font-bold text-primary hover:underline"
        >
          {t("form.unableToConnect")}
        </Link>
      </div>
    </>
  );
}
