"use client";

import { LoadingLoader } from "@/components/modules/loading-loader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { HierarchyDisplay } from "@/features/location/presentation/components";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import type { ActorWithSync } from "../../../domain/actor.types";
import { useBuyerExporters } from "../../hooks/useBuyerExporters";

interface BuyerExportersTableProps {
  buyerId: string;
  className?: string;
}

export const BuyerExportersTable: React.FC<BuyerExportersTableProps> = ({
  buyerId,
  className,
}) => {
  const { t } = useTranslation(["actor", "common"]);
  const { exporters, pagination, loading, error, loadExporters } =
    useBuyerExporters();

  // Colonnes du tableau
  const columns: ColumnDef<ActorWithSync>[] = [
    {
      accessorKey: "familyName",
      header: () => (
        <span className="text-left text-sm !px-2 !text-foreground">
          {t("exporter.table.columns.name")}
        </span>
      ),
      cell: ({ row }) => {
        const exporter = row.original;
        const fullName = [exporter.givenName, exporter.familyName]
          .filter(Boolean)
          .join(" ");
        return (
          <div className="flex flex-col px-2">
            <span className="font-medium text-sm">{fullName || "---"}</span>
            {exporter.onccId && (
              <span className="text-xs text-muted-foreground">
                {t("form.onccId")}: {exporter.onccId}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "locationCode",
      header: t("exporter.table.columns.location"),
      cell: ({ row }) => {
        const exporter = row.original;
        return (
          <div className="text-sm">
            <HierarchyDisplay code={exporter.locationCode} />
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: t("view.status"),
      cell: ({ row }) => {
        const exporter = row.original;
        if (exporter.status === "active") {
          return (
            <Badge variant="outline" className="bg-green-100 text-green-800">
              {exporter.status ? t(`common:status.${exporter.status}`) : "---"}
            </Badge>
          );
        } else if (exporter.status === "inactive") {
          return (
            <Badge variant="outline" className="bg-red-100 text-red-800">
              {exporter.status ? t(`common:status.${exporter.status}`) : "---"}
            </Badge>
          );
        }
        return (
          <Badge variant="outline">
            {exporter.status ? t(`common:status.${exporter.status}`) : "---"}
          </Badge>
        );
      },
    },
  ];

  // Charger les données initiales
  useEffect(() => {
    if (buyerId) {
      loadExporters({
        buyerId,
        page: 1,
        limit: 10,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buyerId]);

  // Gestion de la pagination
  const handlePaginationChange = (paginationState: PaginationState) => {
    const page = paginationState.pageIndex + 1;
    const limit = paginationState.pageSize;

    loadExporters({
      buyerId,
      page,
      limit,
    });
  };

  if (loading && exporters.length === 0) {
    return (
      <div className={className}>
        <LoadingLoader />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className} text-center py-8`}>
        <p className="text-destructive">{error}</p>
        <Button
          variant="outline"
          onClick={() =>
            loadExporters({
              buyerId,
              page: 1,
              limit: 10,
            })
          }
          className="mt-2"
        >
          {t("exporter.table.retry")}
        </Button>
      </div>
    );
  }

  return (
    <div className={className}>
      <DataTable
        columns={columns}
        data={exporters}
        pagination={
          pagination
            ? {
                total: pagination.total,
                perPage: pagination.perPage,
                currentPage: pagination.currentPage,
                lastPage: pagination.lastPage,
                firstPage: pagination.firstPage,
                firstPageUrl: pagination.firstPageUrl,
                lastPageUrl: pagination.lastPageUrl,
                nextPageUrl: pagination.nextPageUrl,
                previousPageUrl: pagination.previousPageUrl,
              }
            : undefined
        }
        onPaginationChange={handlePaginationChange}
        emptyMessage={t("actor:exporter.table.empty")}
        previousLabel={t("common:actions.previous")}
        nextLabel={t("common:actions.next")}
      />
    </div>
  );
};
