"use client";

import { Icon } from "@/components/icon";
import PageHeader from "@/components/layout/page-header";
import { BaseCard } from "@/components/modules/base-card";
import { LoadingFallback } from "@/components/modules/loading-fallback";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useProducerAddFormStore } from "@/features/actor/infrastructure/store/producerAddFormStore";
import { useIsMobile } from "@/hooks/use-mobile";
import { useRouter } from "next/navigation";
import React, { Suspense, useState } from "react";
import { useTranslation } from "react-i18next";

type ProducerCreationType = "create-new" | "add-existing";

function ProducerCreationChoicePageContent() {
  const { t } = useTranslation(["actor", "common"]);
  const router = useRouter();
  const { resetForm } = useProducerAddFormStore();
  const [selectedType, setSelectedType] = useState<ProducerCreationType | null>(
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
      // Rediriger vers le formulaire de création classique
      // Utiliser window.location pour effacer les query params tout en gardant une navigation propre
      window.location.href = "/actors/producer/create";
    } else {
      // Rediriger vers le formulaire d'ajout d'un producteur existant
      window.location.href = "/actors/producer/add";
    }
  };

  const handleCancel = () => {
    // Réinitialiser le formulaire d'ajout si l'utilisateur annule
    resetForm();
    router.push("/actors/producer");
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <PageHeader
        title={t("producer.choice.title")}
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
          title={t("producer.choice.title")}
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
                setSelectedType(value as ProducerCreationType)
              }
              className="space-y-3"
            >
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="create-new" id="create-new" />
                <Label
                  htmlFor="create-new"
                  className="cursor-pointer font-semibold"
                >
                  {t("producer.choice.createNew")}
                </Label>
              </div>

              <div className="flex items-center space-x-3">
                <RadioGroupItem value="add-existing" id="add-existing" />
                <Label
                  htmlFor="add-existing"
                  className="cursor-pointer font-semibold"
                >
                  {t("producer.choice.addExisting")}
                </Label>
              </div>
            </RadioGroup>
          </div>
        </BaseCard>
      </main>
    </div>
  );
}

export default function ProducerCreationChoicePage() {
  const { t } = useTranslation(["actor", "common"]);

  return (
    <Suspense
      fallback={<LoadingFallback message={t("common:messages.loadingView")} />}
    >
      <ProducerCreationChoicePageContent />
    </Suspense>
  );
}
