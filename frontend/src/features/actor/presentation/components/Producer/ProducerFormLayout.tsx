"use client";

import { Icon } from "@/components/icon";
import PageHeader from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { useRouter, useSearchParams } from "next/navigation";
import React from "react";
import { useTranslation } from "react-i18next";
import { useProducerFormStore } from "../../../infrastructure/store/producerFormStore";

interface ProducerFormLayoutProps {
  children: React.ReactNode;
  className?: string;
  onHandleCancel?: () => void;
  title?: string;
}

export default function ProducerFormLayout({
  children,
  className,
  onHandleCancel,
  title,
}: ProducerFormLayoutProps) {
  const { t } = useTranslation("actor");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { entityId, isEditMode, initializeForm, hasUnsavedChanges, resetForm } =
    useProducerFormStore();

  const urlEntityId = searchParams.get("entityId") || undefined;
  const editOffline = searchParams.has("editOffline");

  const [isMobile, setIsMobile] = React.useState(false);
  const useMobile = useIsMobile();

  React.useEffect(() => {
    setIsMobile(useMobile);
  }, [useMobile]);

  // Initialiser le formulaire au chargement
  React.useEffect(() => {
    if (urlEntityId !== entityId) {
      initializeForm(urlEntityId, editOffline);
    }
  }, [entityId, initializeForm, editOffline, urlEntityId]);

  // Déterminer le titre en fonction du mode (création ou édition) ou utiliser le titre fourni
  const pageTitle = title || (isEditMode ? t("producer.editProducer") : t("producer.createProducer"));

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      const confirmLeave = window.confirm(
        t("producer.unsavedChangesWarning")
      );
      if (!confirmLeave) return;
    }
    resetForm();

    if (editOffline) {
      router.replace(`/outbox`);
    } else {
      router.replace("/actors/producer");
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
            onClick={onHandleCancel || handleCancel}
          >
            <Icon name="X" />
            <span className="hidden lg:block">{t("producer.cancelButton")}</span>
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
