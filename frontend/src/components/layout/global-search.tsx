"use client";

import { Icon } from "@/components/icon";
import { InputSelect } from "@/components/ui/input-select";
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

export const GlobalSearch = () => {
  const { t } = useTranslation(["common"]);
  const router = useRouter();
  const { user } = useAuth();
  const isOnline = useOnlineStatus();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<SearchType>("all");

  const searchTypeOptions = useMemo(() => {
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
      //   className: "border-t border-border mt-1 pt-3",
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
          ["BUYER", "PRODUCERS", "EXPORTER"].includes(
            user?.actor?.actorType || ""
          );

        return isAdmin || isFieldAgent || isActorManagerBPE;
      }

      return true;
    });
  }, [t, user]);

  const handleSearchTypeChange = (value: string) => {
    // TODO: Recherche avancée - à implémenter plus tard
    // Si recherche avancée, rediriger immédiatement
    // if (value === "advancedSearch") {
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

    // Rediriger vers la page de recherche globale avec le type de recherche
    if (searchType === "all") {
      // Pour "all", rediriger vers la page de recherche globale sans type
      router.push(`/search?search=${encodeURIComponent(searchQuery)}`);
    } else {
      // Pour les autres types, ajouter le paramètre type
      router.push(`/search?search=${encodeURIComponent(searchQuery)}&type=${searchType}`);
    }
  };

  return (
    <form onSubmit={handleSearch} className="flex items-center w-full min-w-xl">
      {/* Input group unifié : barre de recherche + select type */}
      <div className="relative flex items-center flex-1 bg-white border-2 border-input rounded-full overflow-hidden focus-within:ring-0 focus-within:ring-primary focus-within:border-primary transition-all">
        {/* Icône de recherche */}
        <Icon
          name="Search"
          className="absolute left-4 h-4 w-4 text-muted-foreground pointer-events-none z-10"
        />

        {/* Input de recherche */}
        <input
          type="text"
          placeholder={t("search.placeholder")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 h-10 pl-11 pr-4 bg-transparent border-0 outline-none text-sm placeholder:text-muted-foreground"
        />

        {/* Séparateur vertical */}
        <div className="h-6 w-px bg-input" />

        {/* Select Type intégré avec InputSelect */}
        <div className="w-44 [&_button]:!h-10 [&_button]:!border-0 [&_button]:!bg-transparent [&_button]:!rounded-none [&_button]:focus:!ring-0 [&_button]:focus:!ring-offset-0 [&_button]:!text-sm [&_button]:!font-medium [&_button]:!shadow-none">
          <InputSelect
            value={searchType}
            onValueChange={handleSearchTypeChange}
            options={searchTypeOptions}
            placeholder={t("search.type")}
            className="!h-10 !border-0 !bg-transparent !rounded-none focus:!ring-0 focus:!ring-offset-0 !text-sm !font-medium !shadow-none"
          />
        </div>
      </div>
    </form>
  );
};
