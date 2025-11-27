"use client";

import { LoadingLoader } from "@/components/modules/loading-loader";
import { DataTable } from "@/components/ui/data-table";
import { useIsMobile } from "@/hooks/use-mobile";
import type { PaginationState } from "@tanstack/react-table";
import React, { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { TransferType } from "../../domain";
import { useProductTransferStore } from "../../infrastructure/store/productTransferStore";
import {
  searchParamsToFilters,
  useProductTransferSearchParams,
} from "../hooks";
import {
  createColumns,
  createColumnsMobile,
} from "./Columns/ProductTransferColumns";

interface ProductTransferListProps {
  /** Type de transfert à filtrer (optionnel) */
  transferType?: TransferType;
}

export const ProductTransferList: React.FC<ProductTransferListProps> = ({
  transferType,
}) => {
  const { t } = useTranslation("productTransfer");
  const { productTransfers, meta, isLoading, setFilters } =
    useProductTransferStore();
  const [searchParams, setSearchParams] = useProductTransferSearchParams();

  const [isMobile, setIsMobile] = React.useState(false);
  const useMobile = useIsMobile();

  // Créer les colonnes avec traductions
  const columns = useMemo(() => createColumns(t), [t]);
  const columnsMobileList = useMemo(() => createColumnsMobile(t), [t]);

  useEffect(() => {
    setIsMobile(useMobile);
  }, [useMobile]);

  // Sync URL params with store filters on mount and when params change
  useEffect(() => {
    const filters = searchParamsToFilters(searchParams);

    // Si un type de transfert spécifique est demandé, l'ajouter aux filtres
    if (transferType) {
      const filtersWithType = { ...filters, transferType };
      setFilters(filtersWithType);
    } else {
      setFilters(filters);
    }
  }, [searchParams, setFilters, transferType]);

  const handlePaginationChange = (paginationState: PaginationState) => {
    const page = paginationState.pageIndex + 1;
    const per_page = paginationState.pageSize;
    setSearchParams({ page, per_page });
  };

  // Messages personnalisés
  const getEmptyMessage = () => {
    return t("messages.noTransfers");
  };

  return (
    <div className="space-y-4">
      {isLoading ? (
        <LoadingLoader />
      ) : (
        <DataTable
          columns={isMobile ? columnsMobileList : columns}
          data={productTransfers}
          pagination={meta || undefined}
          onPaginationChange={handlePaginationChange}
          emptyMessage={getEmptyMessage()}
          isMobile={isMobile}
        />
      )}
    </div>
  );
};
