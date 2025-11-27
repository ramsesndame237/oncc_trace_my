"use client";

import { Icon } from "@/components/icon";
import { AppContent } from "@/components/layout/app-content";
import { LoadingFallback } from "@/components/modules/loading-fallback";
import { Button } from "@/components/ui/button";
import { CampaignList } from "@/features/campaign";
import Link from "next/link";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";

export default function CampaignPage() {
  const { t } = useTranslation("campaign");

  return (
    <Suspense
      fallback={<LoadingFallback message={t("page.loading")} />}
    >
      <AppContent
        title={t("page.title")}
        icon={<Icon name="CampaignIcon" />}
        listContent
        topActionButton={[
          <Button variant="ghost" key="add-campaign" size={"icon"}>
            <Link href="/campaign/edit">
              <Icon name="PlusIcon" />
            </Link>
          </Button>,
        ]}
      >
        <CampaignList />
      </AppContent>
    </Suspense>
  );
}
