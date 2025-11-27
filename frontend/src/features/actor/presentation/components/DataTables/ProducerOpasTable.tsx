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
import { useProducerOpas } from "../../hooks/useProducerOpas";

interface ProducerOpasTableProps {
  producerId: string;
  className?: string;
}

export const ProducerOpasTable: React.FC<ProducerOpasTableProps> = ({
  producerId,
  className,
}) => {
  const { t } = useTranslation(["actor", "common"]);
  const { opas, pagination, loading, error, loadOpas } = useProducerOpas();

  // Colonnes du tableau
  const columns: ColumnDef<ActorWithSync>[] = [
    {
      accessorKey: "familyName",
      header: () => (
        <span className="text-left text-sm !px-2 !text-foreground">
          {t("opa.table.columns.name")}
        </span>
      ),
      cell: ({ row }) => {
        const opa = row.original;
        const fullName = [opa.givenName, opa.familyName]
          .filter(Boolean)
          .join(" ");
        return (
          <div className="flex flex-col px-2">
            <span className="font-medium text-sm">{fullName || "---"}</span>
            {opa.onccId && (
              <span className="text-xs text-muted-foreground">
                {t("form.onccId")}: {opa.onccId}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "locationCode",
      header: t("opa.table.columns.location"),
      cell: ({ row }) => {
        const opa = row.original;
        return (
          <div className="text-sm">
            <HierarchyDisplay code={opa.locationCode} />
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: t("opa.table.columns.status"),
      cell: ({ row }) => {
        const opa = row.original;
        if (opa.status === "active") {
          return (
            <Badge variant="outline" className="bg-green-100 text-green-800">
              {opa.status ? t(`common:status.${opa.status}`) : "---"}
            </Badge>
          );
        } else if (opa.status === "inactive") {
          return (
            <Badge variant="outline" className="bg-red-100 text-red-800">
              {opa.status ? t(`common:status.${opa.status}`) : "---"}
            </Badge>
          );
        }
        return (
          <Badge variant="outline">
            {opa.status ? t(`common:status.${opa.status}`) : "---"}
          </Badge>
        );
      },
    },
  ];

  // Charger les données initiales
  useEffect(() => {
    if (producerId) {
      loadOpas({
        producerId,
        page: 1,
        limit: 10,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [producerId]);

  // Gestion de la pagination
  const handlePaginationChange = (paginationState: PaginationState) => {
    const page = paginationState.pageIndex + 1;
    const limit = paginationState.pageSize;

    loadOpas({
      producerId,
      page,
      limit,
    });
  };

  if (loading && opas.length === 0) {
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
            loadOpas({
              producerId,
              page: 1,
              limit: 10,
            })
          }
          className="mt-2"
        >
          {t("opa.table.retry")}
        </Button>
      </div>
    );
  }

  return (
    <div className={className}>
      <DataTable
        columns={columns}
        data={opas}
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
        emptyMessage={t("actor:opa.table.empty")}
        previousLabel={t("common:actions.previous")}
        nextLabel={t("common:actions.next")}
      />
    </div>
  );
};
