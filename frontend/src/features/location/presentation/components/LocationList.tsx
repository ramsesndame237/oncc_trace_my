"use client";

import { SearchInput } from "@/components/forms";
import { LoadingLoader } from "@/components/modules/loading-loader";
import { DataTable } from "@/components/ui/data-table";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSearchParams } from "next/navigation";
import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLocationStore } from "../../infrastructure/store/locationStore";
import {
  resetSearchParams,
  searchParamsToFilters,
  useLocationSearchParams,
} from "../hooks";
import { columns, columnsMobile } from "./Columns";

/**
 * Composant de liste des localisations
 */
export const LocationList: React.FC = () => {
  const { t } = useTranslation(["location", "common"]);
  const { locations, isLoading, setFilters } = useLocationStore();
  const [searchParams, setSearchParams] = useLocationSearchParams();
  const nextSearchParams = useSearchParams();
  const locationCode = nextSearchParams.get("locationCode");

  const [isMobile, setIsMobile] = React.useState(false);
  const useMobile = useIsMobile();

  React.useEffect(() => {
    setIsMobile(useMobile);
  }, [useMobile]);

  // Synchroniser les paramètres URL avec le store au montage
  useEffect(() => {
    const filters = searchParamsToFilters(searchParams);
    // Maintenir le support de locationCode pour la navigation hiérarchique
    const finalFilters = {
      ...filters,
      parentCode: locationCode ?? filters.parentCode,
    };
    setFilters(finalFilters);
  }, [searchParams, setFilters, locationCode]);

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
    <div className="space-y-4">
      {/* Barre de recherche et filtres */}
      <div className="flex items-center lg:justify-end space-x-2">
        <SearchInput
          value={searchParams.search}
          onChange={handleSearchChange}
          onReset={handleResetFilters}
          placeholder={t("search.placeholder")}
          hasActiveFilters={hasActiveFilters}
        />
      </div>

      {/* Tableau des données */}
      {isLoading ? (
        <LoadingLoader />
      ) : (
        <DataTable
          columns={isMobile ? columnsMobile : columns}
          data={locations}
          pageSize={10}
          emptyMessage={
            searchParams.search
              ? t("table.noLocationsSearch", { search: searchParams.search })
              : t("table.noLocations")
          }
          previousLabel={t("common:actions.previous")}
          nextLabel={t("common:actions.next")}
        />
      )}
    </div>
  );
};
