"use client";

import { SearchInput } from "@/components/forms";
import { LoadingLoader } from "@/components/modules/loading-loader";
import { DataTable } from "@/components/ui/data-table";
import type { PaginationState } from "@tanstack/react-table";
import React, { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "next/navigation";
import { useConventionStore } from "../../infrastructure/store/conventionStore";
import { conventionColumns } from "./Columns/ListColumns";

export const ConventionList: React.FC<{ hiddenSearch?: boolean }> = ({
  hiddenSearch = false,
}) => {
  const { t } = useTranslation("convention");
  const { t: tc } = useTranslation("common");
  const { conventions, meta, isLoading, setFilters, filters } =
    useConventionStore();
  const searchParams = useSearchParams();

  // Récupérer le paramètre de recherche de l'URL (recherche globale)
  const urlSearchParam = searchParams.get("search");
  const [searchQuery, setSearchQuery] = React.useState(urlSearchParam || filters.search || "");

  // Charger les conventions au montage
  useEffect(() => {
    setFilters({
      page: 1,
      per_page: 10,
      // Si recherche globale dans URL, l'utiliser, sinon reset à undefined
      search: urlSearchParam || undefined,
    });
  }, [setFilters, urlSearchParam]);

  const handlePaginationChange = (paginationState: PaginationState) => {
    const page = paginationState.pageIndex + 1;
    const per_page = paginationState.pageSize;
    setFilters({ page, per_page });
  };

  const handleSearchChange = (search: string) => {
    setSearchQuery(search);
    setFilters({
      search: search || undefined,
      page: 1, // Reset to first page when searching
    });
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setFilters({
      search: undefined,
      page: 1,
      per_page: 10,
    });
  };

  const hasActiveFilters = searchQuery !== "" || (filters.page ?? 1) !== 1;

  const columns = useMemo(() => conventionColumns(t), [t]);

  return (
    <div className="space-y-4">
      {!hiddenSearch && (
        <div className="flex items-center lg:justify-end space-x-2">
          <SearchInput
            value={searchQuery}
            onChange={handleSearchChange}
            onReset={handleResetFilters}
            placeholder={t("table.searchPlaceholder")}
            hasActiveFilters={hasActiveFilters}
          />
        </div>
      )}
      {isLoading ? (
        <LoadingLoader />
      ) : (
        <DataTable
          columns={columns}
          data={conventions}
          pagination={meta || undefined}
          onPaginationChange={handlePaginationChange}
          emptyMessage={
            searchQuery
              ? t("table.noConventionsForSearch", { search: searchQuery })
              : t("table.noConventions")
          }
          previousLabel={tc("actions.previous")}
          nextLabel={tc("actions.next")}
        />
      )}
    </div>
  );
};
