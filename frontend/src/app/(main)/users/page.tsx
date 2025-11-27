"use client";

import { Suspense } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/icon";
import { AppContent } from "@/components/layout/app-content";
import { LoadingFallback } from "@/components/modules/loading-fallback";
import { UserList } from "@/features/user/presentation/components/UserList";
import Link from "next/link";

const UsersPage: React.FC = () => {
  const { t } = useTranslation(["user", "common"]);

  return (
    <Suspense
      fallback={
        <LoadingFallback message={t("page.loading")} />
      }
    >
      <AppContent
        title={t("page.title")}
        icon={<Icon name="UserIcon" />}
        listContent
        topActionButton={[
          <Button variant="ghost" key="add-user" size="icon">
            <Link href="/users/edit">
              <Icon name="PlusIcon" />
            </Link>
          </Button>,
        ]}
      >
        <UserList />
      </AppContent>
    </Suspense>
  );
};

export default UsersPage;