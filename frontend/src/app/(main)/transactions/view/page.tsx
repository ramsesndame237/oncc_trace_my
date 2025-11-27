"use client";

import { LoadingFallback } from "@/components/modules/loading-fallback";
import { TransactionViewContent } from "@/features/transaction/presentation/components/TransactionViewContent";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";

const TransactionViewPage: React.FC = () => {
  const { t } = useTranslation(["transaction", "common"]);

  return (
    <Suspense
      fallback={
        <LoadingFallback message={t("common:messages.loadingView")} />
      }
    >
      <TransactionViewContent />
    </Suspense>
  );
};

export default TransactionViewPage;
