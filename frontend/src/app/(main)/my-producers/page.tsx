"use client";

import { Icon } from "@/components/icon";
import { AppContent } from "@/components/layout/app-content";
import { LoadingFallback } from "@/components/modules/loading-fallback";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth";
import { OpaProducersTable } from "@/features/actor/presentation/components/DataTables";
import Link from "next/link";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";

const MyProducersPage: React.FC = () => {
  const { t } = useTranslation(["actor", "common"]);
  const { user } = useAuth();

  // Récupérer l'ID de l'OPA de l'utilisateur connecté
  const opaId = user?.actor?.id;

  if (!opaId) {
    return (
      <AppContent
        title={t("common:navigation.myProducers")}
        icon={<Icon name="ProducerIcon" />}
        listContent
      >
        <div className="text-center py-8 text-muted-foreground">
          {t("actor:errors.noOpaAssociated")}
        </div>
      </AppContent>
    );
  }

  return (
    <Suspense
      fallback={<LoadingFallback message={t("common:messages.loading")} />}
    >
      <AppContent
        title={t("common:navigation.myProducers")}
        icon={<Icon name="ProducerIcon" />}
        listContent
        topActionButton={[
          <Button variant="ghost" key="add-producer" size="icon" asChild>
            <Link href={`/actors/producers/edit/producers?entityId=${opaId}&returnTo=/my-producers`}>
              <Icon name="PlusIcon" />
            </Link>
          </Button>,
        ]}
      >
        <OpaProducersTable opaId={opaId} />
      </AppContent>
    </Suspense>
  );
};

export default MyProducersPage;
