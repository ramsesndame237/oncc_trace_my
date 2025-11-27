"use client";

import FormInput from "@/components/forms/form-input";
import { BaseCard } from "@/components/modules/base-card";
import { LoadingLoader } from "@/components/modules/loading-loader";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { ServiceProvider } from "@/core/infrastructure/di/serviceProvider";
import { SECURITY_QUESTIONS } from "@/features/auth/domain";
import { SecurityQuestionsByTokenResponse } from "@/features/auth/domain/types";
import { useAuthStore } from "@/features/auth/infrastructure/store/authStore";
import { useNotification } from "@/lib/notifications";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import React from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
  SecurityAnswersFormData,
  createSecurityAnswersSchema,
} from "../../schemas/validation-schemas";

interface SecurityQuestion {
  id: number;
  question: string;
}

interface UserInfo {
  username: string;
  email: string;
  givenName: string;
  familyName: string;
}

export function SecurityQuestionVerificationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resetToken = searchParams.get("token");
  const { success, error: showError } = useNotification();
  const { setSecurityAnswersRecovery } = useAuthStore();

  const [isLoading, setIsLoading] = React.useState(false);
  const [isLoadingQuestions, setIsLoadingQuestions] = React.useState(true);
  const [questions, setQuestions] = React.useState<SecurityQuestion[]>([]);
  const [userInfo, setUserInfo] = React.useState<UserInfo | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const { t } = useTranslation(["auth", "common"]);

  const form = useForm<SecurityAnswersFormData>({
    resolver: zodResolver(createSecurityAnswersSchema(t)),
    defaultValues: {
      answers: [],
    },
  });

  React.useEffect(() => {
    if (!resetToken) {
      router.replace("/auth/login");
    }
  }, [resetToken, router]);

  // Charger les questions de sécurité au montage du composant
  React.useEffect(() => {
    const loadSecurityQuestions = async () => {
      if (!resetToken) {
        setError(t("recovery.messages.tokenMissing"));
        setIsLoadingQuestions(false);
        return;
      }

      try {
        const getSecurityQuestionsByTokenUseCase =
          ServiceProvider.Auth.getGetSecurityQuestionsByTokenUseCase();
        const response = await getSecurityQuestionsByTokenUseCase.execute({
          resetToken,
        });

        if (response.success && response.data) {
          // Accès temporaire aux données - à corriger avec le bon typage
          const responseData =
            response.data as SecurityQuestionsByTokenResponse;

          setQuestions(responseData.securityQuestions || []);
          setUserInfo(responseData.userInfo || null);

          // Initialiser le formulaire avec les questions
          const initialAnswers = (responseData.securityQuestions || []).map(
            (q: SecurityQuestion) => ({
              id: q.id,
              answer: "",
            })
          );

          form.setValue("answers", initialAnswers);
        } else {
          setError(t("recovery.messages.securityQuestionsError"));
        }
      } catch (err: unknown) {
        console.error("Erreur lors du chargement des questions:", err);
        const errorMessage =
          err instanceof Error
            ? err.message
            : t("recovery.messages.loadingError");
        setError(errorMessage);
      } finally {
        setIsLoadingQuestions(false);
      }
    };

    loadSecurityQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetToken, form]);

  const onSubmit = async (data: SecurityAnswersFormData) => {
    if (!resetToken) {
      showError("Erreur", t("recovery.messages.tokenMissing"));
      return;
    }

    try {
      setIsLoading(true);
      const verifySecurityAnswersUseCase =
        ServiceProvider.Auth.getVerifySecurityAnswersUseCase();
      const response = await verifySecurityAnswersUseCase.execute({
        resetToken,
        answers: data.answers,
      });

      if (response.success && response.data) {
        // Sauvegarder les réponses vérifiées dans le store
        setSecurityAnswersRecovery({
          token: resetToken,
          answers: data.answers,
          userInfo: response.data.userInfo || undefined,
        });

        // Rediriger vers la page de nouveau mot de passe
        router.push(`/auth/recovery/new-password?token=${resetToken}`);
        success("Succès", t("recovery.messages.verificationSuccess"));
      } else {
        showError(
          "Erreur",
          response.message || t("recovery.messages.verificationError")
        );
      }
    } catch (error: unknown) {
      console.error("Erreur lors de la vérification:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : t("recovery.messages.verificationError");
      showError("Erreur", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingQuestions) {
    return (
      <BaseCard title={t("recovery.securityCheck.loading")}>
        <div className="flex justify-center items-center py-8">
          <LoadingLoader />
        </div>
      </BaseCard>
    );
  }

  if (error) {
    return (
      <BaseCard
        title={t("recovery.securityCheck.error")}
        footer={
          <Button
            onClick={() => router.push("/auth/ask-recovery")}
            className="w-fit"
          >
            {t("recovery.securityCheck.backToRecovery")}
          </Button>
        }
      >
        <div className="text-center py-8">
          <p className="text-red-600 text-lg">{error}</p>
        </div>
      </BaseCard>
    );
  }

  if (questions.length === 0) {
    return (
      <BaseCard
        title={t("recovery.securityCheck.noQuestions")}
        footer={
          <Button
            onClick={() => router.push("/auth/ask-recovery")}
            className="w-fit"
          >
            {t("recovery.securityCheck.backToRecovery")}
          </Button>
        }
      >
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">
            {t("recovery.securityCheck.noQuestionsMessage")}
          </p>
        </div>
      </BaseCard>
    );
  }

  return (
    <BaseCard
      title={t("recovery.securityCheck.pageTitle")}
      footer={
        <div className="flex gap-3">
          <Button
            type="button"
            variant="destructive"
            onClick={() => router.push("/auth/ask-recovery")}
            disabled={isLoading}
          >
            {t("recovery.cancel")}
          </Button>
          <Button
            type="submit"
            form="security-verification-form"
            disabled={isLoading}
            loading={isLoading}
          >
            {t("recovery.securityCheck.verify")}
          </Button>
        </div>
      }
    >
      <div className="mb-4">
        {userInfo && (
          <p className="text-sm text-gray-600">
            {t("recovery.securityCheck.accountOf", {
              givenName: userInfo.givenName,
              familyName: userInfo.familyName,
            })}
          </p>
        )}
      </div>

      <Form {...form}>
        <form
          id="security-verification-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6"
        >
          <p className="text-gray-600">
            {t("recovery.securityCheck.instructions")}
          </p>

          {questions.map((question, index) => (
            <div key={question.id}>
              <FormInput
                name={`answers.${index}.answer`}
                label={
                  SECURITY_QUESTIONS.find((q) => q.value === question.question)
                    ?.label
                }
                form={form}
                placeholder={t("form.yourAnswer")}
                className="lg:w-1/2"
              />
            </div>
          ))}
        </form>
      </Form>
    </BaseCard>
  );
}
