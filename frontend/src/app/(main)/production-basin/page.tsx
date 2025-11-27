"use client";

import { Icon } from "@/components/icon";
import { AppContent } from "@/components/layout/app-content";
import { LoadingFallback } from "@/components/modules/loading-fallback";
import { Button } from "@/components/ui/button";
import { ProductionBasinList } from "@/features/production-basin";
import Link from "next/link";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";

const ProductionBasinPage: React.FC = () => {
  const { t } = useTranslation("productionBasin");

  return (
    <Suspense
      fallback={
        <LoadingFallback message={t("page.loading")} />
      }
    >
      <AppContent
        title={t("page.title")}
        icon={<Icon name="AgencyIcon" />}
        listContent
        topActionButton={[
          <Button variant="ghost" key="add-basin" size={"icon"}>
            <Link href="/production-basin/edit">
              <Icon name="PlusIcon" />
            </Link>
          </Button>,
        ]}
      >
        <ProductionBasinList />
      </AppContent>
    </Suspense>
  );
};

export default ProductionBasinPage;
