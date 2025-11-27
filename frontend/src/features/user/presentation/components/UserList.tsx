"use client";

import { SearchInput } from "@/components/forms";
import { LoadingLoader } from "@/components/modules/loading-loader";
import { DataTable } from "@/components/ui/data-table";
import { useIsMobile } from "@/hooks/use-mobile";
import type { PaginationState } from "@tanstack/react-table";
import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useUserStore } from "../../infrastructure/store/userStore";
import {
  resetSearchParams,
  searchParamsToFilters,
  useUserSearchParams,
} from "../hooks";
import { columns, columnsMobile } from "./Columns/ListColumns";

export const UserList: React.FC = () => {
  const { t } = useTranslation(["user", "common"]);
  const { users, meta, isLoading, setFilters } = useUserStore();
  const [searchParams, setSearchParams] = useUserSearchParams();

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
          data={users}
          pagination={meta || undefined}
          onPaginationChange={handlePaginationChange}
          emptyMessage={
            searchParams.search
              ? t("table.noUsersForSearch", { search: searchParams.search })
              : t("table.noUsers")
          }
          isMobile={isMobile}
          previousLabel={t("common:actions.previous")}
          nextLabel={t("common:actions.next")}
        />
      )}
    </div>
  );
};
