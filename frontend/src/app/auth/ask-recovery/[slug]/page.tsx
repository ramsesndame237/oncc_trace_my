"use client";

import PageHeader from "@/components/layout/page-header";
import { LoadingFallback } from "@/components/modules/loading-fallback";
import { EmailRecoveryForm } from "@/features/auth/presentation/components";
import { ChevronLeft } from "lucide-react";
import { useParams } from "next/navigation";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";

export default function RecoverySlugPage() {
  const { t } = useTranslation("auth");
  const { slug } = useParams();

  let title = "";
  if (slug === "username") {
    title = t("recovery.forgotUsername");
  } else if (slug === "password") {
    title = t("recovery.forgotPassword");
  }

  return (
    <Suspense
      fallback={
        <LoadingFallback message={t("recovery.loading")} />
      }
    >
      <div className="min-h-screen bg-[#f8f9fa]">
        <PageHeader title={title} icon={<ChevronLeft className="size-6" />} />

        {/* Contenu principal */}
        <main className="container mx-auto max-w-4xl lg:p-6">
          <EmailRecoveryForm />
        </main>
      </div>
    </Suspense>
  );
}
