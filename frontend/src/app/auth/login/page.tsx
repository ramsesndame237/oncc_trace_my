"use client";

import LanguageSelector from "@/components/layout/language-selector";
import ContentCard from "@/components/modules/content-card";
import { LoginForm } from "@/features/auth";
import { appConfig } from "@/lib/config";
import { useTranslation } from "react-i18next";

export default function LoginPage() {
  const { t } = useTranslation("auth");

  return (
    <div className="min-h-screen flex flex-col bg-[#f8f9fa]">
      {/* Header avec sélecteur de langue */}
      <header className="w-full p-4 flex justify-end">
        <LanguageSelector />
      </header>
      <main className="flex-1 flex items-center justify-center p-4">
        <ContentCard
          title={`${t("login.title")} ${appConfig.name}`}
          withHeaderImage
          imageSrc="/logo/logo.png"
          imageAlt="Logo"
          titlePosition="center"
          maxWidth="max-w-md"
          headerClassName="items-center"
          className="border-gray-200 border-solid shadow-lg bg-white"
          footer={
            <p>
              © 2025 {appConfig.name} - {t("login.footer")}
            </p>
          }
          footerClassName="text-center text-sm text-gray-500 py-10"
        >
          <LoginForm />
        </ContentCard>
      </main>
    </div>
  );
}
