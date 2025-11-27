"use client";

import PageHeader from "@/components/layout/page-header";
import { LoadingFallback } from "@/components/modules/loading-fallback";
import { NewPasswordRecoveryForm } from "@/features/auth/presentation/components";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";

export default function PasswordSetupPage() {
  const { t } = useTranslation("auth");

  return (
    <Suspense
      fallback={
        <LoadingFallback message={t("recovery.loading")} />
      }
    >
      <div className="min-h-screen bg-[#f8f9fa]">
        <PageHeader
          title={t("recovery.newPassword.title")}
          // icon={<ChevronLeft className="size-7" />}
        />

        {/* Contenu principal */}
        <main className="container mx-auto max-w-4xl lg:p-6">
          <NewPasswordRecoveryForm />
        </main>
      </div>
    </Suspense>
  );
}
