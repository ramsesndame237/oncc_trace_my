"use client";

import { Icon } from "@/components/icon";
import PageHeader from "@/components/layout/page-header";
import { LoadingFallback } from "@/components/modules/loading-fallback";
import { Button } from "@/components/ui/button";
import { StoreEditForm } from "@/features/store/presentation/components/StoreEditForm";
import { useIsMobile } from "@/hooks/use-mobile";
import { useRouter, useSearchParams } from "next/navigation";
import React, { Suspense } from "react";
import { useTranslation } from "react-i18next";

function StoreEditPageContent() {
  const { t } = useTranslation("store");
  const router = useRouter();
  const searchParams = useSearchParams();
  const entityId = searchParams.get("entityId") || undefined;
  const editOffline = searchParams.has("editOffline");

  const [isMobile, setIsMobile] = React.useState(false);
  const useMobile = useIsMobile();

  React.useEffect(() => {
    setIsMobile(useMobile);
  }, [useMobile]);

  // Déterminer le titre en fonction du mode (création ou édition)
  const pageTitle = entityId ? t("page.editTitle") : t("page.createTitle");

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <PageHeader
        title={pageTitle}
        rightContent={[
          <Button
            variant={isMobile ? "link" : "outline"}
            key="cancel"
            size="sm"
            onClick={() => router.back()}
          >
            <Icon name="X" />
            <span className="hidden lg:block">{t("actions.cancel")}</span>
          </Button>,
        ]}
      />

      {/* Contenu principal */}
      <main className="container mx-auto max-w-4xl lg:p-6">
        <StoreEditForm entityId={entityId} editOffline={editOffline} />
      </main>
    </div>
  );
}

export default function StoreEditPage() {
  const { t } = useTranslation(["store", "common"]);

  return (
    <Suspense fallback={<LoadingFallback message={t("common:messages.loadingView")} />}>
      <StoreEditPageContent />
    </Suspense>
  );
}
