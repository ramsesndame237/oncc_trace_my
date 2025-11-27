"use client";

import { FormInput } from "@/components/forms";
import { BaseCard } from "@/components/modules/base-card";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { ServiceProvider } from "@/core/infrastructure/di/serviceProvider";
import { useNotification } from "@/lib/notifications";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
  EmailRecoveryFormValues,
  createEmailRecoverySchema,
} from "../../schemas/validation-schemas";

export function EmailRecoveryForm() {
  const { t } = useTranslation(["auth", "common"]);
  const { slug } = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const notification = useNotification();

  const form = useForm<EmailRecoveryFormValues>({
    resolver: zodResolver(createEmailRecoverySchema(t)),
    defaultValues: {
      email: "",
    },
  });

  const isUsernameRecovery = slug === "username";
  const isPasswordRecovery = slug === "password";

  async function onSubmit(data: EmailRecoveryFormValues) {
    try {
      setIsLoading(true);

      if (isUsernameRecovery) {
        // Utiliser ForgotUsernameUseCase via ServiceProvider
        const forgotUsernameUseCase =
          ServiceProvider.Auth.getForgotUsernameUseCase();
        const result = await forgotUsernameUseCase.execute({
          email: data.email,
        });

        if (result.success) {
          notification.success(t("recovery.messages.usernameSent"));
          router.replace("/auth/login");
        } else {
          notification.error(result.message || t("recovery.messages.error"));
        }
      } else if (isPasswordRecovery) {
        // Utiliser ForgotPasswordUseCase via ServiceProvider
        const forgotPasswordUseCase =
          ServiceProvider.Auth.getForgotPasswordUseCase();
        const result = await forgotPasswordUseCase.execute({
          email: data.email,
        });

        if (result.success) {
          notification.success(t("recovery.messages.resetLinkSent"));
          router.replace("/auth/login");
        } else {
          notification.error(result.message || t("recovery.messages.error"));
        }
      }
    } catch (error) {
      console.error("Erreur lors de la récupération:", error);
      notification.error(t("recovery.messages.unexpectedError"));
    } finally {
      setIsLoading(false);
    }
  }

  const getTitle = () => {
    if (isUsernameRecovery) {
      return t("recovery.emailInstructions.username");
    } else if (isPasswordRecovery) {
      return t("recovery.emailInstructions.password");
    }
    return t("recovery.emailInstructions.default");
  };

  const getButtonText = () => {
    if (isUsernameRecovery) {
      return t("recovery.sendUsername");
    } else if (isPasswordRecovery) {
      return t("recovery.sendResetLink");
    }
    return t("recovery.send");
  };

  return (
    <BaseCard
      title={getTitle()}
      footer={
        <Button
          type="submit"
          form="email-recovery-form"
          className="w-fit"
          disabled={isLoading}
          loading={isLoading}
        >
          {getButtonText()}
        </Button>
      }
    >
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6"
          id="email-recovery-form"
        >
          <FormInput
            name="email"
            label={t("form.yourEmail")}
            placeholder={t("form.emailPlaceholder")}
            form={form}
            className="h-12 lg:w-1/2"
          />
        </form>
      </Form>
    </BaseCard>
  );
}
