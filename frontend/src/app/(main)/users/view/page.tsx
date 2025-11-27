"use client";

import { LoadingFallback } from "@/components/modules/loading-fallback";
import { UserViewContent } from "@/features/user/presentation/components/UserViewContent";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";

const UserViewPage: React.FC = () => {
  const { t } = useTranslation(["user", "common"]);

  return (
    <Suspense
      fallback={
        <LoadingFallback message={t("common:messages.loadingView")} />
      }
    >
      <UserViewContent />
    </Suspense>
  );
};

export default UserViewPage;