"use client";

import { LoadingFallback } from "@/components/modules/loading-fallback";
import { useConventionFormStore } from "@/features/convention/infrastructure/store/conventionFormStore";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";
import BasicInfoStep from "./basic-info/page";
import DocumentsStep from "./documents/page";
import ProductsStep from "./products/page";
import SummaryStep from "./summary/page";

function ConventionCreateContent() {
  const { currentStep } = useConventionFormStore();

  // Rendu conditionnel basé sur l'étape actuelle
  const renderStep = () => {
    switch (currentStep) {
      case "basic-info":
        return <BasicInfoStep />;
      case "products":
        return <ProductsStep />;
      case "documents":
        return <DocumentsStep />;
      case "summary":
        return <SummaryStep />;
      default:
        return <BasicInfoStep />;
    }
  };

  return <>{renderStep()}</>;
}

export default function ConventionCreatePage() {
  const { t } = useTranslation(["convention", "common"]);

  return (
    <Suspense
      fallback={<LoadingFallback message={t("common:messages.loadingView")} />}
    >
      <ConventionCreateContent />
    </Suspense>
  );
}
