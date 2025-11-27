"use client";

import PageHeader from "@/components/layout/page-header";
import { LoadingFallback } from "@/components/modules/loading-fallback";
import { ConfirmDetail } from "@/features/auth";
import { ChevronLeft } from "lucide-react";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";

export default function ConfirmDetailsPage() {
  const { t } = useTranslation(["auth"]);

  return (
    <Suspense
      fallback={
        <LoadingFallback message={t("auth:onboarding.loadingConfirmation")} />
      }
    >
      <div className="min-h-screen bg-[#f8f9fa]">
        <PageHeader
          title={t("auth:onboarding.verifyDetails")}
          icon={<ChevronLeft className="size-7" />}
        />

        {/* Contenu principal */}
        <main className="container mx-auto max-w-4xl lg:p-6">
          <ConfirmDetail />
        </main>
      </div>
    </Suspense>
  );
}
