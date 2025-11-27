"use client";

import { Icon } from "@/components/icon";
import PageHeader from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { useRouter } from "next/navigation";
import React from "react";
import { useTranslation } from "react-i18next";

interface ProductTransferFormLayoutProps {
  children: React.ReactNode;
  className?: string;
  onHandleCancel?: () => void;
  title?: string;
}

export function ProductTransferFormLayout({
  children,
  className,
  onHandleCancel,
  title,
}: ProductTransferFormLayoutProps) {
  const { t } = useTranslation("productTransfer");
  const router = useRouter();

  const [isMobile, setIsMobile] = React.useState(false);
  const useMobile = useIsMobile();

  React.useEffect(() => {
    setIsMobile(useMobile);
  }, [useMobile]);

  // Déterminer le titre
  const pageTitle = title || t("form.edit.title");

  const handleCancel = () => {
    // Naviguer vers la page de retour ou quick-menu par défaut
    router.replace("/quick-menu");
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
            onClick={onHandleCancel || handleCancel}
          >
            <Icon name="X" />
            <span className="hidden lg:block">{t("form.actions.cancel")}</span>
          </Button>,
        ]}
      />

      {/* Contenu principal */}
      <main className={`container mx-auto max-w-5xl lg:p-6 ${className}`}>
        {children}
      </main>
    </div>
  );
}
