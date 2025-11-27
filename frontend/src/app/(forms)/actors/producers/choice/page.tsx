"use client";

import { Icon } from "@/components/icon";
import PageHeader from "@/components/layout/page-header";
import { BaseCard } from "@/components/modules/base-card";
import { LoadingFallback } from "@/components/modules/loading-fallback";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useProducersFormStore } from "@/features/actor/infrastructure/store/producersFormStore";
import { useIsMobile } from "@/hooks/use-mobile";
import { useRouter } from "next/navigation";
import React, { Suspense, useState } from "react";
import { useTranslation } from "react-i18next";

type OPAManagementType = "create-new" | "manage-producers";

function ProducersChoicePageContent() {
  const { t } = useTranslation(["actor", "common"]);
  const router = useRouter();
  const { resetForm } = useProducersFormStore();
  const [selectedType, setSelectedType] = useState<OPAManagementType | null>(
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
      // Rediriger vers le formulaire de création d'OPA
      window.location.href = "/actors/producers/create";
    } else {
      // Rediriger vers la sélection d'OPA pour gérer les producteurs
      window.location.href = "/actors/producers/manage/select-opa";
    }
  };

  const handleCancel = () => {
    // Réinitialiser le formulaire si l'utilisateur annule
    resetForm();
    router.push("/actors/producers");
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <PageHeader
        title={t("producers.choice.title")}
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
          title={t("producers.choice.title")}
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
                setSelectedType(value as OPAManagementType)
              }
              className="space-y-3"
            >
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="create-new" id="create-new" />
                <Label
                  htmlFor="create-new"
                  className="cursor-pointer font-semibold"
                >
                  {t("producers.choice.createOPA")}
                </Label>
              </div>

              <div className="flex items-center space-x-3">
                <RadioGroupItem
                  value="manage-producers"
                  id="manage-producers"
                />
                <Label
                  htmlFor="manage-producers"
                  className="cursor-pointer font-semibold"
                >
                  {t("producers.choice.manageProducers")}
                </Label>
              </div>
            </RadioGroup>
          </div>
        </BaseCard>
      </main>
    </div>
  );
}

export default function ProducersChoicePage() {
  const { t } = useTranslation(["actor", "common"]);

  return (
    <Suspense
      fallback={<LoadingFallback message={t("common:messages.loadingView")} />}
    >
      <ProducersChoicePageContent />
    </Suspense>
  );
}
