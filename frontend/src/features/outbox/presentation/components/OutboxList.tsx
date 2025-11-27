"use client";

import { LoadingLoader } from "@/components/modules/loading-loader";
import { DataTable } from "@/components/ui/data-table";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { PaginationState } from "@tanstack/react-table";
import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/features/auth/infrastructure/store/authStore";
import { useOutboxStore } from "../../infrastructure/store/outboxStore";
import {
  searchParamsToFilters,
  useOutboxSearchParams,
} from "../hooks/useOutboxSearchParams";
import { columns, columnsMobile } from "./Columns/ListColumns";

interface OutboxListProps {
  className?: string;
  showToolbar?: boolean;
  showSyncStatus?: boolean;
  compactMode?: boolean;
}

export function OutboxList({ className }: OutboxListProps) {
  const { t } = useTranslation(["outbox", "common"]);
  const [isMobile, setIsMobile] = React.useState(false);
  const useMobile = useIsMobile();
  const [searchParams, setSearchParams] = useOutboxSearchParams();

  // ✅ Écouter l'utilisateur connecté pour recharger quand il change
  const user = useAuthStore((state) => state.user);

  // Utiliser le nouveau store complet
  const { operations, isLoading, error, meta, fetchOperations, setFilters } =
    useOutboxStore();

  React.useEffect(() => {
    setIsMobile(useMobile);
  }, [useMobile]);

  // Synchroniser les paramètres URL avec le store au montage et lors des changements
  useEffect(() => {
    const filters = searchParamsToFilters(searchParams);
    setFilters(filters);
  }, [searchParams, setFilters]);

  // ✅ Charger les données quand l'utilisateur change OU les paramètres changent
  useEffect(() => {
    const filters = searchParamsToFilters(searchParams);
    console.log("[OutboxList] 🔄 Rechargement des données, user:", user?.id);
    fetchOperations(filters);
  }, [fetchOperations, searchParams, user?.id]); // ✅ Ajouter user?.id aux dépendances

  // Gestion des changements de pagination
  const handlePaginationChange = (paginationState: PaginationState) => {
    const page = paginationState.pageIndex + 1; // react-table utilise un index basé sur 0
    const per_page = paginationState.pageSize;

    // Mettre à jour les paramètres URL
    setSearchParams({
      page,
      per_page,
    });
  };

  // Messages d'erreur et d'état vide personnalisés
  const getEmptyMessage = () => {
    if (searchParams.entityType && searchParams.entityType !== "") {
      return t("list.noOperationsType", { type: searchParams.entityType });
    }
    if (searchParams.status === "failed") {
      return t("list.noOperationsFailed");
    }
    if (searchParams.status === "pending") {
      return t("list.noOperationsPending");
    }
    return t("list.noOperationsDefault");
  };

  // Gestion des erreurs avec retry
  if (error) {
    return (
      <div className={cn(className, "space-y-4")}>
        <div className="text-center py-12 space-y-4">
          <div className="space-y-2">
            <p className="text-destructive text-lg font-semibold">
              {t("list.errorTitle")}
            </p>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              {error}
            </p>
          </div>
          <div className="space-x-2">
            <button
              onClick={() =>
                fetchOperations(searchParamsToFilters(searchParams))
              }
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              {t("common:actions.retry")}
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 border border-border rounded-md hover:bg-accent"
            >
              {t("list.refreshPage")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(className)}>
      {/* Tableau des données avec colonnes améliorées */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingLoader />
        </div>
      ) : (
        <DataTable
          columns={isMobile ? columnsMobile : columns}
          data={operations}
          pagination={meta}
          onPaginationChange={handlePaginationChange}
          emptyMessage={getEmptyMessage()}
          isMobile={isMobile}
          previousLabel={t("common:pagination.previous")}
          nextLabel={t("common:pagination.next")}
        />
      )}
    </div>
  );
}
