"use client";

import LanguageSelector from "@/components/layout/language-selector";
import ContentCard from "@/components/modules/content-card";
import { LoadingFallback } from "@/components/modules/loading-fallback";
import { StartPage } from "@/features/auth/presentation/components";
import { appConfig } from "@/lib/config";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";

export default function OnboardingStartPage() {
  const { t } = useTranslation(["auth", "common"]);

  return (
    <Suspense
      fallback={<LoadingFallback message={t("common:messages.loading")} />}
    >
      <div className="min-h-screen flex flex-col bg-[#f8f9fa]">
        {/* Header avec sélecteur de langue */}
        <header className="w-full p-4 flex justify-end">
          <LanguageSelector />
        </header>

        {/* Contenu principal centré */}
        <main className="flex-1 flex items-center justify-center p-4">
          <ContentCard
            title={
              <div className="flex items-center justify-center lg:text-5xl text-3xl font-normal text-center leading-tight lg:w-2/3">
                {t("auth:onboarding.welcomeTo", { appName: appConfig.name })}
              </div>
            }
            withHeaderImage
            imageSrc="/logo/logo.png"
            imageAlt={`${appConfig.name} Logo`}
            titlePosition="center"
            maxWidth="max-w-3xl"
            headerClassName="items-center"
            className="border-gray-100 border-solid shadow-lg bg-white space-y-6"
          >
            <StartPage />
          </ContentCard>
        </main>
      </div>
    </Suspense>
  );
}
