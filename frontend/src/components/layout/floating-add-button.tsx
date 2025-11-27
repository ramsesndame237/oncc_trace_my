"use client";

import { Icon } from "@/components/icon";
import { Button } from "@/components/ui/button";
import { USER_ROLES_CONSTANTS } from "@/core/domain/generated/user-roles.types";
import { useNavigationStore } from "@/core/infrastructure/store/navigationStore";
import { useAuth } from "@/features/auth";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";

export const FloatingAddButton = () => {
  const { t } = useTranslation(["common"]);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { setReturnPath } = useNavigationStore();
  const { user } = useAuth();

  // Ne pas afficher le bouton pour les admins techniques
  if (user?.role === USER_ROLES_CONSTANTS.TECHNICAL_ADMIN) {
    return null;
  }

  return (
    <Button
      size="icon"
      className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 z-50 lg:hidden"
      aria-label={t("quickActions.add")}
      onClick={() => {
        // Sauvegarder l'URL complète avec les query params
        const queryString = searchParams.toString();
        const fullPath = queryString ? `${pathname}?${queryString}` : pathname;
        setReturnPath(fullPath);
        router.push("/quick-menu");
      }}
    >
      <Icon name="Plus" className="h-6 w-6 text-white" />
    </Button>
  );
};
