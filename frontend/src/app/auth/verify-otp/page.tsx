"use client";
import LanguageSelector from "@/components/layout/language-selector";
import ContentCard from "@/components/modules/content-card";
import { LoadingFallback } from "@/components/modules/loading-fallback";
import { VerifyOtpForm } from "@/features/auth/presentation/components";
import { appConfig } from "@/lib/config";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";

export default function VerifyOtpPage() {
  const { t } = useTranslation("auth");

  return (
    <Suspense
      fallback={
        <LoadingFallback message={t("otp.loading")} />
      }
    >
      <div className="min-h-screen flex flex-col bg-[#f8f9fa]">
        {/* Header avec sélecteur de langue */}
        <header className="w-full p-4 flex justify-end">
          <LanguageSelector />
        </header>

        {/* Contenu principal centré */}
        <main className="flex-1 flex items-center justify-center p-4">
          <ContentCard
            title={t("otp.pageTitle")}
            withHeaderImage
            imageSrc="/logo/logo.png"
            imageAlt={`${appConfig.name} Logo`}
            titlePosition="center"
            maxWidth="max-w-md"
            headerClassName="items-center"
            className="border-gray-200 border-solid shadow-lg bg-white"
          >
            <VerifyOtpForm />
          </ContentCard>
        </main>
      </div>
    </Suspense>
  );
}
