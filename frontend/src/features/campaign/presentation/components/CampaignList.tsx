"use client";

import { SearchInput } from "@/components/forms";
import { LoadingLoader } from "@/components/modules/loading-loader";
import { DataTable } from "@/components/ui/data-table";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { PaginationState } from "@tanstack/react-table";
import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useCampaignStore } from "../../infrastructure/store/campaignStore";
import {
  resetSearchParams,
  searchParamsToFilters,
  useCampaignSearchParams,
} from "../hooks";
import { useColumns, useColumnsMobile } from "./Columns/ListColumns";

interface CampaignListProps {
  className?: string;
}

export function CampaignList({ className }: CampaignListProps) {
  const { t } = useTranslation("campaign");
  const { campaigns, isLoading, meta, setFilters } = useCampaignStore();
  const [searchParams, setSearchParams] = useCampaignSearchParams();

  const [isMobile, setIsMobile] = React.useState(false);
  const useMobile = useIsMobile();

  const columns = useColumns();
  const columnsMobile = useColumnsMobile();

  React.useEffect(() => {
    setIsMobile(useMobile);
  }, [useMobile]);

  // Synchroniser les paramètres URL avec le store au montage
  useEffect(() => {
    const filters = searchParamsToFilters(searchParams);
    setFilters(filters);
  }, [searchParams, setFilters]);

  const handlePaginationChange = (paginationState: PaginationState) => {
    const page = paginationState.pageIndex + 1; // react-table utilise un index basé sur 0
    const per_page = paginationState.pageSize;
    // Mettre à jour les paramètres URL
    setSearchParams({
      page,
      per_page,
    });
  };

  // Fonction pour gérer les changements de recherche
  const handleSearchChange = (search: string) => {
    setSearchParams({
      search: search || "",
      page: 1,
    });
  };

  // Fonction pour réinitialiser tous les filtres
  const handleResetFilters = () => {
    resetSearchParams(setSearchParams);
  };

  // Vérifier s'il y a des filtres actifs
  const hasActiveFilters =
    searchParams.search !== "" || searchParams.page !== 1;

  return (
    <div className={cn(className, "space-y-4")}>
      {/* Barre de recherche et filtres */}
      <div className="flex items-center lg:justify-end space-x-2">
        <SearchInput
          value={searchParams.search}
          onChange={handleSearchChange}
          onReset={handleResetFilters}
          placeholder={t("table.searchPlaceholder")}
          hasActiveFilters={hasActiveFilters}
        />
      </div>

      {/* Tableau des données */}
      {isLoading ? (
        <LoadingLoader />
      ) : (
        <DataTable
          columns={isMobile ? columnsMobile : columns}
          data={campaigns}
          pagination={meta}
          onPaginationChange={handlePaginationChange}
          emptyMessage={
            searchParams.search
              ? t("table.noCampaignsForSearch", { search: searchParams.search })
              : t("table.noCampaigns")
          }
          isMobile={isMobile}
        />
      )}
    </div>
  );
}
