"use client";

import { BaseCard } from "@/components/modules/base-card";
import { DetailRow } from "@/components/modules/detail-row";
import { Button } from "@/components/ui/button";
import { ServiceProvider } from "@/core/infrastructure/di/serviceProvider";
import { SECURITY_QUESTIONS, useAuthStore } from "@/features/auth";
import { showError, showSuccess } from "@/lib/notifications/toast";
import { useRouter, useSearchParams } from "next/navigation";
import React from "react";
import { useTranslation } from "react-i18next";

export function ConfirmDetail() {
  const { t } = useTranslation("auth");
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionToken = searchParams.get("sessionToken");
  const [isLoading, setIsLoading] = React.useState(false);
  const { onboardingQuestions, onboardingPassword, user } = useAuthStore();

  React.useEffect(() => {
    if (!sessionToken) {
      router.push(`/auth/login`);
    }
  }, [sessionToken, router]);

  // Fonction pour récupérer le label d'une question à partir de sa valeur
  const getQuestionLabel = (questionValue: string) => {
    const question = SECURITY_QUESTIONS.find((q) => q.value === questionValue);
    return question ? question.label : questionValue;
  };

  const handleConfirm = async () => {
    if (!sessionToken) {
      router.push("/auth/login");
      return;
    }

    if (!onboardingQuestions || !onboardingPassword) {
      showError(t("messages.unexpectedError"), {
        description: t("onboarding.errors.missingSteps"),
      });
      return;
    }

    if (!user || !user.id) {
      showError(t("messages.unexpectedError"), {
        description: t("onboarding.errors.missingUserInfo"),
      });
      router.push("/auth/login");
      return;
    }

    try {
      setIsLoading(true);

      // Récupération du use case via le service provider (injection de dépendances)
      const initializeAccountUseCase =
        ServiceProvider.Auth.getInitializeAccountUseCase();

      // Appel du use case d'initialisation
      const result = await initializeAccountUseCase.execute({
        userId: user.id,
        newPassword: onboardingPassword.password,
        sessionToken,
        securityQuestion1: onboardingQuestions.question1,
        securityAnswer1: onboardingQuestions.answer1,
        securityQuestion2: onboardingQuestions.question2,
        securityAnswer2: onboardingQuestions.answer2,
        securityQuestion3: onboardingQuestions.question3,
        securityAnswer3: onboardingQuestions.answer3,
      });

      if (result.success) {
        showSuccess(t("onboarding.success.accountCreated"), {
          description: t("onboarding.success.accountCreatedDescription"),
        });

        // Redirection vers la page de succès
        router.replace(`/auth/onboarding/success`);
      } else {
        showError(t("onboarding.errors.initializationError"), {
          description:
            result.message ||
            t("onboarding.errors.initializationErrorDescription"),
        });
      }
    } catch (error) {
      console.error("Erreur lors de la confirmation:", error);

      // Gestion d'erreur plus spécifique
      if (error instanceof Error) {
        if (error.message.includes("validation")) {
          showError(t("onboarding.errors.validationError"), {
            description: t("onboarding.errors.validationErrorDescription"),
          });
        } else if (error.message.includes("userId")) {
          showError(t("onboarding.errors.userError"), {
            description: t("onboarding.errors.userErrorDescription"),
          });
          router.push("/auth/login");
        } else {
          showError(t("messages.unexpectedError"), {
            description: error.message || t("onboarding.errors.unexpectedError"),
          });
        }
      } else {
        showError(t("messages.unexpectedError"), {
          description: t("onboarding.errors.unexpectedError"),
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <BaseCard
      title={t("onboarding.confirmDetails.title")}
      footer={
        <Button
          onClick={handleConfirm}
          className="w-fit"
          size="lg"
          disabled={isLoading}
          loading={isLoading}
        >
          {t("onboarding.confirmDetails.confirmButton")}
        </Button>
      }
    >
      <div className="space-y-6">
        <p className="text-gray-600">
          {t("onboarding.confirmDetails.description")}{" "}
          <span className="font-semibold text-gray-800">
            {t("onboarding.confirmDetails.descriptionBold")}
          </span>{" "}
          {t("onboarding.confirmDetails.descriptionEnd")}
        </p>

        <div>
          <DetailRow
            label={t("onboarding.confirmDetails.username")}
            value={user?.username || t("form.notDefined")}
          />
          <DetailRow
            label={t("form.givenName")}
            value={user?.givenName || t("form.notDefined")}
          />
          <DetailRow
            label={t("form.familyName")}
            value={user?.familyName || t("form.notDefined")}
          />

          <DetailRow
            label={t("form.email")}
            value={user?.email || t("form.notDefined")}
          />

          {/* Questions de sécurité depuis le store */}
          {onboardingQuestions ? (
            <>
              <DetailRow
                label={getQuestionLabel(onboardingQuestions.question1)}
                value={`${onboardingQuestions.answer1}`}
                showChangeButton
                changeHref={`/auth/onboarding/security-questions?sessionToken=${sessionToken}&callback=recap`}
              />
              <DetailRow
                label={getQuestionLabel(onboardingQuestions.question2)}
                value={`${onboardingQuestions.answer2}`}
                showChangeButton
                changeHref={`/auth/onboarding/security-questions?sessionToken=${sessionToken}&callback=recap`}
              />
              <DetailRow
                label={getQuestionLabel(onboardingQuestions.question3)}
                value={`${onboardingQuestions.answer3}`}
                showChangeButton
                changeHref={`/auth/onboarding/security-questions?sessionToken=${sessionToken}&callback=recap`}
              />
            </>
          ) : (
            <DetailRow
              label={t("form.securityQuestions")}
              value={t("form.securityQuestionsNotDefined")}
              showChangeButton
              changeHref={`/auth/onboarding/security-questions?sessionToken=${sessionToken}&callback=recap`}
            />
          )}

          {/* Mot de passe depuis le store */}
          <DetailRow
            label={t("form.password")}
            value={onboardingPassword ? t("form.passwordMask") : t("form.notDefined")}
            showChangeButton
            changeHref={`/auth/onboarding/create-password?sessionToken=${sessionToken}&callback=recap`}
          />
        </div>
      </div>
    </BaseCard>
  );
}
