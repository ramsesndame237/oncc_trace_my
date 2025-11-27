"use client";
import FormInput from "@/components/forms/form-input";
import FormSelect from "@/components/forms/form-select";
import { BaseCard } from "@/components/modules/base-card";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { SECURITY_QUESTIONS, useAuthStore } from "@/features/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import React from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
  SecurityQuestionsFormData,
  createSecurityQuestionsSchema,
} from "../../schemas/validation-schemas";

export function SecurityQuestionForm() {
  const { t } = useTranslation("auth");
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionToken = searchParams.get("sessionToken");
  const callback = searchParams.get("callback");
  const [isLoading, setIsLoading] = React.useState(false);
  const { setOnboardingQuestions, onboardingQuestions } = useAuthStore();

  const form = useForm<SecurityQuestionsFormData>({
    resolver: zodResolver(createSecurityQuestionsSchema(t)),
    defaultValues: onboardingQuestions || {
      question1: "",
      answer1: "",
      question2: "",
      answer2: "",
      question3: "",
      answer3: "",
    },
  });

  const selectedQuestions = [
    form.watch("question1"),
    form.watch("question2"),
    form.watch("question3"),
  ];

  React.useEffect(() => {
    if (!sessionToken) {
      router.push(`/auth/login`);
    }
  }, [sessionToken, router]);

  // Filtrer les questions disponibles pour éviter les doublons
  const getAvailableQuestions = (currentQuestionIndex: number) => {
    return SECURITY_QUESTIONS.filter((question) => {
      const isSelected = selectedQuestions.includes(question.value);
      const isCurrentQuestion =
        selectedQuestions[currentQuestionIndex] === question.value;
      return !isSelected || isCurrentQuestion;
    });
  };

  const onSubmit = async (data: SecurityQuestionsFormData) => {
    if (!sessionToken) {
      router.push("/auth/login");
      return;
    }

    try {
      setIsLoading(true);
      // Sauvegarder les données dans le store
      setOnboardingQuestions(data);

      if (callback === "recap") {
        router.replace(
          `/auth/onboarding/confirm-details?sessionToken=${sessionToken}`
        );
      } else {
        // Rediriger vers la page de création de mot de passe
        router.push(
          `/auth/onboarding/create-password?sessionToken=${sessionToken}`
        );
      }
    } catch (error) {
      console.error(error);
      // Gérer l'erreur, par exemple afficher une notification
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <BaseCard
      title={t("onboarding.securityQuestions.title")}
      footer={
        <Button
          type="submit"
          form="security-questions-form"
          className="w-fit"
          size="lg"
          disabled={isLoading}
          loading={isLoading}
        >
          {t("onboarding.securityQuestions.continueButton")}
        </Button>
      }
    >
      <Form {...form}>
        <form
          id="security-questions-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6"
        >
          <p className="text-gray-600">
            {t("onboarding.securityQuestions.description")}
          </p>

          {/* Question 1 */}
          <div className="space-y-6 w-full">
            <FormSelect
              name="question1"
              label={t("form.question1")}
              form={form}
              options={getAvailableQuestions(0)}
              placeholder={t("form.choose")}
              className="lg:w-full"
              triggerClassName="lg:w-1/2 w-full"
              emptyMessage={t("form.noQuestionAvailable")}
            />

            <FormInput
              name="answer1"
              label={t("form.answer")}
              form={form}
              className="lg:w-1/2"
            />

            <Separator />
          </div>

          {/* Question 2 */}
          <div className="space-y-6 w-full">
            <FormSelect
              name="question2"
              label={t("form.question2")}
              form={form}
              options={getAvailableQuestions(1)}
              placeholder={t("form.choose")}
              className="w-full"
              triggerClassName="lg:w-1/2 w-full"
              emptyMessage={t("form.noQuestionAvailable")}
            />

            <FormInput
              name="answer2"
              label={t("form.answer")}
              form={form}
              className="lg:w-1/2"
            />
            <Separator />
          </div>

          {/* Question 3 */}
          <div className="space-y-6 w-full">
            <FormSelect
              name="question3"
              label={t("form.question3")}
              form={form}
              options={getAvailableQuestions(2)}
              placeholder={t("form.choose")}
              className="w-full"
              triggerClassName="lg:w-1/2 w-full"
              emptyMessage={t("form.noQuestionAvailable")}
            />

            <FormInput
              name="answer3"
              label={t("form.answer")}
              form={form}
              className="lg:w-1/2"
            />
          </div>
        </form>
      </Form>
    </BaseCard>
  );
}
