"use client";

import { Icon } from "@/components/icon";
import { AppContent } from "@/components/layout/app-content";
import { LoadingFallback } from "@/components/modules/loading-fallback";
import { Button } from "@/components/ui/button";
import { TransformersList } from "@/features/actor/presentation/components/Transformers/TransformersList";
import Link from "next/link";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";

const TransformersPage: React.FC = () => {
  const { t } = useTranslation(["actor", "common"]);

  return (
    <Suspense
      fallback={<LoadingFallback message={t("common:messages.loadingView")} />}
    >
      <AppContent
        title={t("transformer.title")}
        icon={<Icon name="TransformerIcon" />}
        listContent
        topActionButton={[
          <Button variant="ghost" key="add-transformer" size="icon">
            <Link href="/actors/transformers/create">
              <Icon name="PlusIcon" />
            </Link>
          </Button>,
        ]}
      >
        <TransformersList />
      </AppContent>
    </Suspense>
  );
};

export default TransformersPage;
