"use client";

import { LoadingFallback } from "@/components/modules/loading-fallback";
import { PurchaseTransactionEditForm } from "@/features/transaction/presentation/components/Purchase/Edit/PurchaseTransactionEditForm";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";

const PurchaseTransactionEditPage: React.FC = () => {
  const { t } = useTranslation(["transaction", "common"]);

  return (
    <Suspense
      fallback={
        <LoadingFallback message={t("common:messages.loadingEdit")} />
      }
    >
      <PurchaseTransactionEditForm />
    </Suspense>
  );
};

export default PurchaseTransactionEditPage;
