"use client";

import { Icon } from "@/components/icon";
import { AppContent } from "@/components/layout/app-content";
import { LoadingFallback } from "@/components/modules/loading-fallback";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth";
import { ExporterBuyersTable } from "@/features/actor/presentation/components/DataTables";
import Link from "next/link";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";

const MyBuyersPage: React.FC = () => {
  const { t } = useTranslation(["actor", "common"]);
  const { user } = useAuth();

  // Récupérer l'ID de l'exportateur de l'utilisateur connecté
  const exporterId = user?.actor?.id;

  if (!exporterId) {
    return (
      <AppContent
        title={t("common:navigation.myBuyers")}
        icon={<Icon name="BuyerIcon" />}
        listContent
      >
        <div className="text-center py-8 text-muted-foreground">
          {t("actor:errors.noExporterAssociated")}
        </div>
      </AppContent>
    );
  }

  return (
    <Suspense
      fallback={<LoadingFallback message={t("common:messages.loading")} />}
    >
      <AppContent
        title={t("common:navigation.myBuyers")}
        icon={<Icon name="BuyerIcon" />}
        listContent
        topActionButton={[
          <Button variant="ghost" key="add-buyer" size="icon" asChild>
            <Link href={`/actors/exporters/edit/buyers?entityId=${exporterId}&returnTo=/my-buyers`}>
              <Icon name="PlusIcon" />
            </Link>
          </Button>,
        ]}
      >
        <ExporterBuyersTable exporterId={exporterId} />
      </AppContent>
    </Suspense>
  );
};

export default MyBuyersPage;
