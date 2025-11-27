"use client";

import React, { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useTransactionStore } from "../../infrastructure/store/transactionStore";
import { searchParamsToFilters } from "../hooks/useTransactionSearchParams";
import { TransactionType } from "../../domain/Transaction";
import { DataTable } from "@/components/ui/data-table";
import {
  getTransactionColumns,
  getTransactionColumnsMobile,
} from "./Columns/TransactionColumns";
import { useIsMobile } from "@/hooks/use-mobile";

interface TransactionListProps {
  transactionType?: TransactionType;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactionType,
}) => {
  const { t } = useTranslation(["transaction", "common"]);
  const searchParams = useSearchParams();
  const isMobile = useIsMobile();

  const {
    transactions,
    meta,
    filters,
    isLoading,
    error,
    setFilters,
    clearError,
  } = useTransactionStore();

  // Synchroniser les filtres avec les search params et le type de transaction
  useEffect(() => {
    const filters = searchParamsToFilters(searchParams);
    if (transactionType) {
      const filtersWithType = { ...filters, transactionType };
      setFilters(filtersWithType);
    } else {
      setFilters(filters);
    }
  }, [searchParams, setFilters, transactionType]);

  // Colonnes du tableau
  const columns = isMobile
    ? getTransactionColumnsMobile({ t, transactionType })
    : getTransactionColumns({ t, transactionType });

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md bg-destructive/15 p-3">
          <div className="flex items-center gap-2">
            <p className="text-sm text-destructive">{error}</p>
            <button
              onClick={clearError}
              className="ml-auto text-sm text-destructive underline"
            >
              {t("common:actions.dismiss")}
            </button>
          </div>
        </div>
      )}

      <DataTable
        columns={columns}
        data={transactions}
        meta={meta}
        filters={filters}
        onFiltersChange={setFilters}
        isLoading={isLoading}
        searchPlaceholder={t("transaction:list.searchPlaceholder")}
        noResultsMessage={t("transaction:list.noResults")}
      />
    </div>
  );
};
