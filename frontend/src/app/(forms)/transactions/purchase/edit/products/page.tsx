"use client";

import { LoadingFallback } from "@/components/modules/loading-fallback";
import { PurchaseProductsEditForm } from "@/features/transaction/presentation/components/Purchase/Edit/PurchaseProductsEditForm";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";

const PurchaseProductsEditPage: React.FC = () => {
  const { t } = useTranslation(["transaction", "common"]);

  return (
    <Suspense
      fallback={
        <LoadingFallback message={t("common:messages.loadingEdit")} />
      }
    >
      <PurchaseProductsEditForm />
    </Suspense>
  );
};

export default PurchaseProductsEditPage;
