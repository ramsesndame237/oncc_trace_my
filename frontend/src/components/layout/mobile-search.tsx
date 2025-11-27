"use client";

import { Icon } from "@/components/icon";
import { Button } from "@/components/ui/button";
import { InputSelect } from "@/components/ui/input-select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { USER_ROLES_CONSTANTS } from "@/core/domain/generated/user-roles.types";
import { useAuth } from "@/features/auth";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { showError } from "@/lib/notifications/toast";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

type SearchType =
  | "conventions"
  | "transactions"
  | "calendars"
  | "productTransfers"
  | "advancedSearch"
  | "all";

export const MobileSearch = () => {
  const { t } = useTranslation(["common"]);
  const router = useRouter();
  const { user } = useAuth();
  const isOnline = useOnlineStatus();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<SearchType>("all");
  const [open, setOpen] = useState(false);

  const searchTypeOptions = useMemo(
    () => {
      const allOptions = [
        { value: "all", label: t("search.types.all") },
        { value: "conventions", label: t("search.types.conventions") },
        { value: "transactions", label: t("search.types.transactions") },
        { value: "calendars", label: t("search.types.calendars") },
        { value: "productTransfers", label: t("search.types.productTransfers") },
        // TODO: Recherche avancée - à implémenter plus tard
        // {
        //   value: "advancedSearch",
        //   label: t("search.types.advancedSearch"),
        //   className: "border-t border-border mt-1 pt-1",
        // },
      ];

      // ⭐ Filtrer les options en fonction du rôle et du type d'acteur
      return allOptions.filter((option) => {
        // Conventions : uniquement pour basin_admin, field_agent et actor_manager (BUYER, PRODUCERS, EXPORTER)
        if (option.value === "conventions") {
          const isAdmin = user?.role === USER_ROLES_CONSTANTS.BASIN_ADMIN;
          const isFieldAgent = user?.role === USER_ROLES_CONSTANTS.FIELD_AGENT;
          const isActorManagerBPE =
            user?.role === USER_ROLES_CONSTANTS.ACTOR_MANAGER &&
            ["BUYER", "PRODUCERS", "EXPORTER"].includes(user?.actor?.actorType || "");

          return isAdmin || isFieldAgent || isActorManagerBPE;
        }

        return true;
      });
    },
    [t, user]
  );

  const handleSearchTypeChange = (value: string) => {
    // TODO: Recherche avancée - à implémenter plus tard
    // Si recherche avancée, rediriger immédiatement
    // if (value === "advancedSearch") {
    //   setOpen(false);
    //   router.push("/advanced-search");
    //   return;
    // }

    setSearchType(value as SearchType);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    // ⭐ Vérifier si l'utilisateur est en ligne
    if (!isOnline) {
      showError(t("search.offlineError"));
      return;
    }

    // Fermer le sheet
    setOpen(false);

    // Rediriger vers la page de recherche globale avec le type de recherche
    if (searchType === "all") {
      // Pour "all", rediriger vers la page de recherche globale sans type
      router.push(`/search?search=${encodeURIComponent(searchQuery)}`);
    } else {
      // Pour les autres types, ajouter le paramètre type
      router.push(`/search?search=${encodeURIComponent(searchQuery)}&type=${searchType}`);
    }

    // Réinitialiser
    setSearchQuery("");
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          aria-label={t("search.openSearch")}
        >
          <Icon name="Search" className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="top" className="h-auto">
        <SheetHeader>
          <SheetTitle>{t("search.title")}</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSearch} className="space-y-4 px-4 pb-4">
          <div className="space-y-2">
            {/* Input group unifié : barre de recherche + select type */}
            <div className="relative flex items-center bg-white border-2 border-input rounded-full overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 transition-all">
              {/* Icône de recherche */}
              <Icon
                name="Search"
                className="absolute left-4 h-4 w-4 text-muted-foreground pointer-events-none z-10"
              />

              {/* Input de recherche */}
              <input
                id="search-input"
                type="text"
                placeholder={t("search.placeholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 h-12 pl-11 pr-4 bg-transparent border-0 outline-none text-sm placeholder:text-muted-foreground"
              />

              {/* Séparateur vertical */}
              <div className="h-6 w-px bg-input" />

              {/* Select Type intégré avec InputSelect */}
              <div className="w-44 [&_button]:!h-12 [&_button]:!border-0 [&_button]:!bg-transparent [&_button]:!rounded-none [&_button]:focus:!ring-0 [&_button]:focus:!ring-offset-0 [&_button]:!text-sm [&_button]:!font-medium [&_button]:!shadow-none">
                <InputSelect
                  value={searchType}
                  onValueChange={handleSearchTypeChange}
                  options={searchTypeOptions}
                  placeholder={t("search.type")}
                  className="!h-12 !border-0 !bg-transparent !rounded-none focus:!ring-0 focus:!ring-offset-0 !text-sm !font-medium !shadow-none"
                />
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full">
            <Icon name="Search" className="mr-2 h-4 w-4" />
            {t("search.search")}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
};
