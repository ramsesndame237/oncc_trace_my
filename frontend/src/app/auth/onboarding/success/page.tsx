"use client";

import { Button } from "@/components/ui/button";
import { appConfig } from "@/lib/config";
import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "react-i18next";

export default function OnboardingSuccessPage() {
  const { t } = useTranslation(["auth"]);

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-4">
      <div className="w-full max-w-[500px] bg-white rounded-lg shadow-sm p-8 text-center">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Image
            src="/logo/logo.png"
            alt={`${appConfig.name} Logo`}
            width={120}
            height={120}
            priority
          />
        </div>

        {/* Titre */}
        <h1 className="text-[32px] font-semibold text-gray-900 mb-4">
          {t("auth:onboarding.setupComplete")}
        </h1>

        {/* Description */}
        <p className="text-gray-600 mb-8">
          {t("auth:onboarding.setupCompleteDescription")}
        </p>

        {/* Bouton de connexion */}
        <Link href="/auth/login">
          <Button size="lg">{t("auth:onboarding.signInAgain")}</Button>
        </Link>
      </div>
    </div>
  );
}
