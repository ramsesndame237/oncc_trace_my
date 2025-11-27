"use client";

import { Icon } from "@/components/icon";
import PageHeader from "@/components/layout/page-header";
import { BaseCard } from "@/components/modules/base-card";
import { LoadingFallback } from "@/components/modules/loading-fallback";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useIsMobile } from "@/hooks/use-mobile";
import { useRouter } from "next/navigation";
import React, { Suspense, useState } from "react";
import { useTranslation } from "react-i18next";

type ExporterManagementType = "create-new" | "manage-buyers";

function ExporterChoicePageContent() {
  const { t } = useTranslation(["actor", "common"]);
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<ExporterManagementType | null>(
    null
  );

  const [isMobile, setIsMobile] = React.useState(false);
  const useMobile = useIsMobile();

  React.useEffect(() => {
    setIsMobile(useMobile);
  }, [useMobile]);

  const handleNext = () => {
    if (!selectedType) return;

    if (selectedType === "create-new") {
      // Rediriger vers le formulaire de création d'exportateur
      window.location.href = "/actors/exporters/create";
    } else {
      // Rediriger vers la sélection d'exportateur pour gérer les acheteurs
      window.location.href = "/actors/exporters/manage/select-exporter";
    }
  };

  const handleCancel = () => {
    // Rediriger vers la liste des exportateurs
    router.push("/actors/exporters");
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <PageHeader
        title={t("exporter.choice.title")}
        rightContent={[
          <Button
            variant={isMobile ? "link" : "outline"}
            key="cancel"
            size="sm"
            onClick={handleCancel}
          >
            <Icon name="X" />
            <span className="hidden lg:block">
              {t("common:actions.cancel")}
            </span>
          </Button>,
        ]}
      />

      {/* Contenu principal */}
      <main className="container mx-auto max-w-4xl lg:p-6">
        <BaseCard
          title={t("exporter.choice.title")}
          className="w-full"
          footer={
            <Button onClick={handleNext} disabled={!selectedType}>
              {t("common:actions.next")}
            </Button>
          }
        >
          <div className="space-y-6">
            <RadioGroup
              value={selectedType || ""}
              onValueChange={(value) =>
                setSelectedType(value as ExporterManagementType)
              }
              className="space-y-3"
            >
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="create-new" id="create-new" />
                <Label
                  htmlFor="create-new"
                  className="cursor-pointer font-semibold"
                >
                  {t("exporter.choice.createExporter")}
                </Label>
              </div>

              <div className="flex items-center space-x-3">
                <RadioGroupItem
                  value="manage-buyers"
                  id="manage-buyers"
                />
                <Label
                  htmlFor="manage-buyers"
                  className="cursor-pointer font-semibold"
                >
                  {t("exporter.choice.manageBuyers")}
                </Label>
              </div>
            </RadioGroup>
          </div>
        </BaseCard>
      </main>
    </div>
  );
}

export default function ExporterChoicePage() {
  const { t } = useTranslation(["actor", "common"]);

  return (
    <Suspense
      fallback={<LoadingFallback message={t("common:messages.loadingView")} />}
    >
      <ExporterChoicePageContent />
    </Suspense>
  );
}
