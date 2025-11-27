"use client";

import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/features/auth/infrastructure/store/authStore";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";

export function StartPage() {
  const { t } = useTranslation("auth");
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionToken = searchParams.get("sessionToken");

  const { setOnboardingQuestions, setOnboardingPassword } = useAuthStore();

  const handleStart = () => {
    setOnboardingQuestions(null);
    setOnboardingPassword(null);
    router.push(
      "/auth/onboarding/security-questions?sessionToken=" + sessionToken
    );
  };

  return (
    <div className="space-y-6 text-center flex flex-col items-center">
      <p className="text-gray-600 lg:text-xl">
        {t("onboarding.start.description")}
      </p>

      <Button onClick={handleStart} size="lg" className="lg:w-auto w-full">
        {t("onboarding.start.startButton")}
      </Button>
    </div>
  );
}
