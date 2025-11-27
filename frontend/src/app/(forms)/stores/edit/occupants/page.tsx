"use client";

import { Icon } from "@/components/icon";
import PageHeader from "@/components/layout/page-header";
import { LoadingFallback } from "@/components/modules/loading-fallback";
import { Button } from "@/components/ui/button";
import { StoreOccupantsManage, useGetStoreById } from "@/features/store";
import { useIsMobile } from "@/hooks/use-mobile";
import { useRouter, useSearchParams } from "next/navigation";
import React, { Suspense, useMemo } from "react";
import { useTranslation } from "react-i18next";

function StoreOccupantsManagePageContent() {
  const { t } = useTranslation("store");
  const router = useRouter();
  const searchParams = useSearchParams();
  const entityId = searchParams.get("entityId") || undefined;

  const [isMobile, setIsMobile] = React.useState(false);
  const useMobile = useIsMobile();

  React.useEffect(() => {
    setIsMobile(useMobile);
  }, [useMobile]);

  // Récupérer les informations du magasin
  const { store } = useGetStoreById(entityId || "");

  // Construire le nom du magasin
  const storeName = useMemo(() => {
    if (!store) return "";
    return store.name || store.code || "Magasin";
  }, [store]);

  const pageTitle = t("occupants.manage.title", { storeName });

  const handleCancel = () => {
    if (entityId) {
      router.push(`/stores/view?entityId=${entityId}`);
    } else {
      router.back();
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <PageHeader
        title={pageTitle}
        rightContent={[
          <Button
            variant={isMobile ? "link" : "outline"}
            key="cancel"
            size="sm"
            onClick={handleCancel}
          >
            <Icon name="X" />
            <span className="hidden lg:block">{t("actions.cancel")}</span>
          </Button>,
        ]}
      />

      {/* Contenu principal */}
      <main className="container mx-auto max-w-5xl lg:p-6">
        <StoreOccupantsManage />
      </main>
    </div>
  );
}

export default function StoreOccupantsManagePage() {
  const { t } = useTranslation(["store", "common"]);

  return (
    <Suspense
      fallback={<LoadingFallback message={t("common:messages.loadingView")} />}
    >
      <StoreOccupantsManagePageContent />
    </Suspense>
  );
}
