"use client";

import { SearchInput } from "@/components/forms";
import { LoadingLoader } from "@/components/modules/loading-loader";
import { DataTable } from "@/components/ui/data-table";
import { useIsMobile } from "@/hooks/use-mobile";
import type { PaginationState } from "@tanstack/react-table";
import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useActorStore } from "../../infrastructure/store/actorStore";
import {
  resetSearchParams,
  searchParamsToFilters,
  useActorSearchParams,
} from "../hooks";
import { columns, columnsMobile } from "./Columns/ActorColumns";

interface ActorListProps {
  /** Type d'acteur à filtrer (optionnel) */
  actorType?: string;
}

export const ActorList: React.FC<ActorListProps> = ({ actorType }) => {
  const { t } = useTranslation("actor");
  const { actors, meta, isLoading, setFilters } = useActorStore();
  const [searchParams, setSearchParams] = useActorSearchParams();

  const [isMobile, setIsMobile] = React.useState(false);
  const useMobile = useIsMobile();

  useEffect(() => {
    setIsMobile(useMobile);
  }, [useMobile]);

  // Sync URL params with store filters on mount and when params change
  useEffect(() => {
    const filters = searchParamsToFilters(searchParams);

    // Si un type d'acteur spécifique est demandé, l'ajouter aux filtres
    if (actorType) {
      const filtersWithType = { ...filters, actorType };
      setFilters(filtersWithType);
    } else {
      setFilters(filters);
    }
  }, [searchParams, setFilters, actorType]);

  const handlePaginationChange = (paginationState: PaginationState) => {
    const page = paginationState.pageIndex + 1;
    const per_page = paginationState.pageSize;
    setSearchParams({ page, per_page });
  };

  const handleSearchChange = (search: string) => {
    setSearchParams({
      search: search || "",
      page: 1, // Reset to first page when searching
    });
  };

  // Fonction pour réinitialiser tous les filtres
  const handleResetFilters = () => {
    resetSearchParams(setSearchParams);
  };

  const hasActiveFilters =
    searchParams.search !== "" || searchParams.page !== 1;

  // Messages personnalisés selon le type
  const getEmptyMessage = () => {
    if (searchParams.search) {
      return actorType === "PRODUCER"
        ? t("list.noProducerFoundSearch", { search: searchParams.search })
        : t("list.noActorFoundSearch", { search: searchParams.search });
    }
    return actorType === "PRODUCER"
      ? t("list.noProducerFound")
      : t("list.noActorFound");
  };

  const getSearchPlaceholder = () => {
    return actorType === "PRODUCER"
      ? t("list.searchProducer")
      : t("list.searchActor");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center lg:justify-end space-x-2">
        <SearchInput
          value={searchParams.search}
          onChange={handleSearchChange}
          onReset={handleResetFilters}
          placeholder={getSearchPlaceholder()}
          hasActiveFilters={hasActiveFilters}
        />
      </div>

      {isLoading ? (
        <LoadingLoader />
      ) : (
        <DataTable
          columns={isMobile ? columnsMobile : columns}
          data={actors}
          pagination={meta || undefined}
          onPaginationChange={handlePaginationChange}
          emptyMessage={getEmptyMessage()}
          isMobile={isMobile}
        />
      )}
    </div>
  );
};