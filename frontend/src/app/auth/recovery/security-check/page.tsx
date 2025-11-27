"use client";

import PageHeader from "@/components/layout/page-header";
import { LoadingFallback } from "@/components/modules/loading-fallback";
import { SecurityQuestionVerificationForm } from "@/features/auth/presentation/components";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";

export default function SecurityCheckPage() {
  const { t } = useTranslation("auth");

  return (
    <Suspense
      fallback={
        <LoadingFallback message={t("recovery.loadingSecurityCheck")} />
      }
    >
      <div className="min-h-screen bg-[#f8f9fa]">
        <PageHeader title={t("recovery.securityCheck.title")} />

        {/* Contenu principal */}
        <main className="container mx-auto max-w-4xl lg:p-6">
          <SecurityQuestionVerificationForm />
        </main>
      </div>
    </Suspense>
  );
}
