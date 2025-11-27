"use client";

import { LoadingFallback } from "@/components/modules/loading-fallback";
import { SaleTransactionEditForm } from "@/features/transaction/presentation/components/Sale/Edit/SaleTransactionEditForm";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";

const SaleTransactionEditPage: React.FC = () => {
  const { t } = useTranslation(["transaction", "common"]);

  return (
    <Suspense
      fallback={
        <LoadingFallback message={t("common:messages.loadingEdit")} />
      }
    >
      <SaleTransactionEditForm />
    </Suspense>
  );
};

export default SaleTransactionEditPage;
