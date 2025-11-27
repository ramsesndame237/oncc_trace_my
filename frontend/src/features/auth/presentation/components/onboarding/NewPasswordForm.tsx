"use client";

import { FormPasswordInput } from "@/components/forms";
import { BaseCard } from "@/components/modules/base-card";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import {
  createNewPasswordSchema,
  useAuthStore,
  type NewPasswordFormData,
} from "@/features/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import React from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

export function NewPasswordForm() {
  const { t } = useTranslation(["auth", "common"]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionToken = searchParams.get("sessionToken");
  const [isLoading, setIsLoading] = React.useState(false);
  const { setOnboardingPassword } = useAuthStore();

  const form = useForm<NewPasswordFormData>({
    resolver: zodResolver(createNewPasswordSchema(t)),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  React.useEffect(() => {
    if (!sessionToken) {
      router.push(`/auth/login`);
    }
  }, [sessionToken, router]);

  const onSubmit = async (data: NewPasswordFormData) => {
    if (!sessionToken) {
      router.push("/auth/login");
      return;
    }

    try {
      setIsLoading(true);

      setOnboardingPassword(data);

      // Rediriger vers la page de confirmation des détails
      router.replace(
        `/auth/onboarding/confirm-details?sessionToken=${sessionToken}`
      );
    } catch (error) {
      console.error("Erreur lors de la création du mot de passe:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <BaseCard
      title={t("onboarding.createPassword.title")}
      footer={
        <Button
          type="submit"
          form="create-password-form"
          className="w-fit"
          size="lg"
          disabled={isLoading}
          loading={isLoading}
        >
          {t("onboarding.createPassword.continueButton")}
        </Button>
      }
    >
      <Form {...form}>
        <form
          id="create-password-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6"
        >
          <p className="text-gray-600">
            {t("onboarding.createPassword.description")}
          </p>

          <div className="space-y-6">
            <div className="lg:w-1/2">
              <FormPasswordInput
                name="password"
                label={t("form.newPassword")}
                form={form}
                required
                showValidation
                validationRules={{
                  minLength: 8,
                  requireUpperCase: true,
                  requireLowerCase: true,
                  requireNumber: true,
                }}
                customValidationMessages={{
                  minLength: t("validation.minLength"),
                  upperCase: t("validation.upperCase"),
                  lowerCase: t("validation.lowerCase"),
                  number: t("validation.number"),
                }}
              />
            </div>

            <FormPasswordInput
              name="confirmPassword"
              label={t("form.confirmNewPassword")}
              form={form}
              classContainerInput="lg:w-1/2"
              required
            />
          </div>
        </form>
      </Form>
    </BaseCard>
  );
}
