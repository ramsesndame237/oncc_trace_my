"use client";

import { FormPasswordInput } from "@/components/forms";
import { BaseCard } from "@/components/modules/base-card";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { ApiError } from "@/core/infrastructure/api/client";
import { ServiceProvider } from "@/core/infrastructure/di/serviceProvider";
import {
  createNewPasswordSchema,
  useAuthStore,
  type NewPasswordFormData,
} from "@/features/auth";
import { showError, showSuccess } from "@/lib/notifications/toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import React from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

export function NewPasswordRecoveryForm() {
  const { t } = useTranslation(["auth", "common"]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionToken = searchParams.get("sessionToken");
  const [isLoading, setIsLoading] = React.useState(false);
  const { securityAnswersRecovery, clearSecurityAnswersRecovery } =
    useAuthStore();

  const form = useForm<NewPasswordFormData>({
    resolver: zodResolver(createNewPasswordSchema(t)),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: NewPasswordFormData) => {
    // Vérifier que nous avons les données nécessaires du store
    if (!securityAnswersRecovery) {
      showError(t("recovery.messages.recoveryDataMissing"));
      router.push("/auth/ask-recovery");
      return;
    }

    // Utiliser le token du store ou celui de l'URL
    const resetToken = securityAnswersRecovery.token || sessionToken;
    if (!resetToken) {
      showError(t("recovery.messages.resetTokenMissing"));
      router.push("/auth/ask-recovery");
      return;
    }

    try {
      setIsLoading(true);

      const resetPasswordUseCase =
        ServiceProvider.Auth.getResetPasswordWithSecurityUseCase();

      const response = await resetPasswordUseCase.execute({
        resetToken,
        answers: securityAnswersRecovery.answers,
        newPassword: data.password,
        newPassword_confirmation: data.confirmPassword,
      });

      if (response.success) {
        showSuccess(t("recovery.messages.passwordResetSuccess"));

        // Nettoyer les données de récupération du store
        clearSecurityAnswersRecovery();

        // Rediriger vers la page de connexion
        router.replace("/auth/login");
      } else {
        showError(
          response.message || t("recovery.messages.passwordResetError")
        );
      }
    } catch (error) {
      console.error(
        "Erreur lors de la réinitialisation du mot de passe:",
        error
      );

      if (error instanceof ApiError) {
        showError(error.message);
      } else {
        showError(t("recovery.messages.unexpectedError"));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <BaseCard
      title={t("recovery.newPassword.chooseNewPassword")}
      footer={
        <Button
          type="submit"
          form="create-password-form"
          className="w-fit"
          disabled={isLoading}
          loading={isLoading}
        >
          {t("recovery.newPassword.validate")}
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
            {t("recovery.newPassword.instructions")}
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
