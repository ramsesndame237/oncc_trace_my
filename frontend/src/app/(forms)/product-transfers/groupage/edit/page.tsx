"use client";

import { LoadingFallback } from "@/components/modules/loading-fallback";
import { GroupageEditForm } from "@/features/product-transfer/presentation/components/Groupage/Edit/GroupageEditForm";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";

const ProductTransferEditPage: React.FC = () => {
  const { t } = useTranslation(["productTransfer", "common"]);

  return (
    <Suspense
      fallback={
        <LoadingFallback message={t("common:messages.loadingEdit")} />
      }
    >
      <GroupageEditForm />
    </Suspense>
  );
};

export default ProductTransferEditPage;
