"use client";

import { SearchInput } from "@/components/forms";
import { LoadingLoader } from "@/components/modules/loading-loader";
import { DataTable } from "@/components/ui/data-table";
import { useIsMobile } from "@/hooks/use-mobile";
import type { PaginationState } from "@tanstack/react-table";
import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useStoreStore } from "../../infrastructure/store/storeStore";
import {
  resetSearchParams,
  searchParamsToFilters,
  useStoreSearchParams,
} from "../hooks";
import { useColumns, useColumnsMobile } from "./Columns/ListColumns";

export const StoreList: React.FC = () => {
  const { t } = useTranslation("store");
  const { stores, meta, isLoading, setFilters } = useStoreStore();
  const [searchParams, setSearchParams] = useStoreSearchParams();
  const columns = useColumns();
  const columnsMobile = useColumnsMobile();

  const [isMobile, setIsMobile] = React.useState(false);
  const useMobile = useIsMobile();

  useEffect(() => {
    setIsMobile(useMobile);
  }, [useMobile]);

  // Sync URL params with store filters on mount and when params change
  useEffect(() => {
    const filters = searchParamsToFilters(searchParams);
    setFilters(filters);
  }, [searchParams, setFilters]);

  const handlePaginationChange = (paginationState: PaginationState) => {
    const page = paginationState.pageIndex + 1;
    const limit = paginationState.pageSize;
    setSearchParams({ page, limit });
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

  return (
    <div className="space-y-4">
      <div className="flex items-center lg:justify-end space-x-2">
        <SearchInput
          value={searchParams.search}
          onChange={handleSearchChange}
          onReset={handleResetFilters}
          placeholder={t("table.searchPlaceholder")}
          hasActiveFilters={hasActiveFilters}
        />
      </div>

      {isLoading ? (
        <LoadingLoader />
      ) : (
        <DataTable
          columns={isMobile ? columnsMobile : columns}
          data={stores}
          pagination={meta || undefined}
          onPaginationChange={handlePaginationChange}
          emptyMessage={
            searchParams.search
              ? t("table.noStoresForSearch", { search: searchParams.search })
              : t("table.noStores")
          }
          isMobile={isMobile}
        />
      )}
    </div>
  );
};
