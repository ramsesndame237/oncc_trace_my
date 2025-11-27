"use client";

import { Icon } from "@/components/icon";
import { AppContent } from "@/components/layout/app-content";
import { LoadingFallback } from "@/components/modules/loading-fallback";
import { USER_ROLES_CONSTANTS } from "@/core/domain/generated/user-roles.types";
import { useAuth } from "@/features/auth";
import { CalendarList } from "@/features/calendar/presentation/components";
import { Suspense, useMemo } from "react";
import { useTranslation } from "react-i18next";

const CalendarsPage: React.FC = () => {
  const { t } = useTranslation(["calendar", "common"]);
  const { user } = useAuth();

  // ⭐ Vérifier si l'utilisateur est un actor_manager de type TRANSFORMER
  const isActorManagerTransformer =
    user?.role === USER_ROLES_CONSTANTS.ACTOR_MANAGER &&
    user?.actor?.actorType === "TRANSFORMER";

  const tabContent = useMemo(() => {
    const tabs = [
      {
        title: t("calendar:types.MARCHE"),
        key: "marche",
        content: <CalendarList type="MARCHE" />,
      },
    ];

    // ⭐ Masquer l'onglet ENLEVEMENT pour les TRANSFORMER
    if (!isActorManagerTransformer) {
      tabs.push({
        title: t("calendar:types.ENLEVEMENT"),
        key: "enlevement",
        content: <CalendarList type="ENLEVEMENT" />,
      });
    }

    return tabs;
  }, [t, isActorManagerTransformer]);

  return (
    <Suspense fallback={<LoadingFallback message={t("page.loading")} />}>
      <AppContent
        title={t("page.title")}
        icon={<Icon name="IconCalendar" />}
        tabContent={tabContent}
        defautValue="marche"
        listContent
      />
    </Suspense>
  );
};

export default CalendarsPage;
