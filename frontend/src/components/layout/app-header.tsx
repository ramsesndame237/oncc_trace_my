"use client";

import { USER_ROLES_CONSTANTS } from "@/core/domain/generated/user-roles.types";
import { useNavigationStore } from "@/core/infrastructure/store/navigationStore";
import { useAuth } from "@/features/auth";
import { useNavigationControl } from "@/hooks/use-navigation-control";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SyncStatusIndicator } from "../../features/auth/presentation/components/SyncStatusIndicator";
import { Icon } from "../icon";
import { Header } from "../modules/header";
import { Button } from "../ui/button";
import { SidebarTrigger } from "../ui/sidebar";
import { AppUser } from "./app-user";
import { FloatingAddButton } from "./floating-add-button";
import { GlobalSearch } from "./global-search";
import { MobileSearch } from "./mobile-search";

export const AppHeader = () => {
  const { canGoBack, canGoForward, goBack, goForward } = useNavigationControl();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { setReturnPath } = useNavigationStore();
  const { user } = useAuth();

  // Ne pas afficher le bouton Quick Menu pour les admins techniques
  const shouldShowQuickMenu =
    user?.role !== USER_ROLES_CONSTANTS.TECHNICAL_ADMIN;

  return (
    <>
      <Header
        className="bg-white border-b border-border sticky top-0 z-10"
        leftClassName="flex items-center"
        leftContent={
          <>
            <div className="lg:hidden flex items-center gap-2">
              <SidebarTrigger className="-ml-1 text-xl text-primary bg-transparent hover:bg-transparent" />
              <Image src="/logo/logo.png" alt="logo" width={32} height={32} />
            </div>
            <div className={"lg:flex gap-2 items-center hidden text-primary"}>
              <Button
                size={"icon"}
                variant="ghost"
                className="!size-8"
                onClick={goBack}
                disabled={!canGoBack}
                title="Retour"
              >
                <Icon name={"ArrowLeft"} className={"w-6 h-6"} />
              </Button>
              <Button
                size={"icon"}
                variant="ghost"
                className="!size-8"
                onClick={goForward}
                disabled={!canGoForward}
                title="Avancer"
              >
                <Icon name={"ArrowRight"} className={"w-6 h-6"} />
              </Button>
            </div>
          </>
        }
        centerContent={
          <div
            className={cn(
              "hidden lg:flex items-center gap-3 flex-1 justify-center px-4",
              !shouldShowQuickMenu && "min-h-11"
            )}
          >
            {shouldShowQuickMenu && (
              <>
                <Button
                  size="icon"
                  className="h-10 w-10 rounded-full bg-primary hover:bg-primary/90 flex-shrink-0"
                  onClick={() => {
                    // Sauvegarder l'URL complète avec les query params
                    const queryString = searchParams.toString();
                    const fullPath = queryString ? `${pathname}?${queryString}` : pathname;
                    setReturnPath(fullPath);
                    router.push("/quick-menu");
                  }}
                  title="Ajouter"
                >
                  <Icon name="Plus" className="h-5 w-5 text-white" />
                </Button>
                <GlobalSearch />
              </>
            )}
          </div>
        }
        rightContent={
          <div className="flex items-center gap-3">
            {shouldShowQuickMenu && <MobileSearch />}
            <SyncStatusIndicator />
            <AppUser />
          </div>
        }
      />
      {shouldShowQuickMenu && <FloatingAddButton />}
    </>
  );
};
