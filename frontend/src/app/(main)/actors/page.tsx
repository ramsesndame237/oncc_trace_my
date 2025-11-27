"use client";

import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/icon";
import { AppContent } from "@/components/layout/app-content";
import { LoadingFallback } from "@/components/modules/loading-fallback";
import { ActorList } from "@/features/actor/presentation/components/ActorList";
import Link from "next/link";
import { useTranslation } from "react-i18next";

const ActorsPage: React.FC = () => {
  const { t } = useTranslation(["actor", "common"]);

  return (
    <Suspense
      fallback={
        <LoadingFallback message={t("common:messages.loadingView")} />
      }
    >
      <AppContent
        title={t("common:navigation.actors")}
        icon={<Icon name="UsersIcon" />}
        listContent
        topActionButton={[
          <Button variant="ghost" key="add-actor" size="icon">
            <Link href="/actors/edit">
              <Icon name="PlusIcon" />
            </Link>
          </Button>,
        ]}
      >
        <ActorList />
      </AppContent>
    </Suspense>
  );
};

export default ActorsPage;