"use client";

import { LoadingLoader } from "@/components/modules/loading-loader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { HierarchyDisplay } from "@/features/location/presentation/components";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { showError, showSuccess } from "@/lib/notifications/toast";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { Trash2 } from "lucide-react";
import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import type { ActorWithSync } from "../../../domain/actor.types";
import { useActorStore } from "../../../infrastructure/store/actorStore";
import { useActorModal } from "../../hooks/useActorModal";
import { useExporterBuyers } from "../../hooks/useExporterBuyers";

interface ExporterBuyersTableProps {
  exporterId: string;
  className?: string;
}

export const ExporterBuyersTable: React.FC<ExporterBuyersTableProps> = ({
  exporterId,
  className,
}) => {
  const { t } = useTranslation(["actor", "common"]);
  const { buyers, pagination, loading, error, loadBuyers } =
    useExporterBuyers();
  const isOnline = useOnlineStatus();
  const { confirmRemoveBuyer } = useActorModal();
  const { removeBuyerFromExporter } = useActorStore();

  // Gestion de la suppression d'un acheteur
  const handleRemoveBuyer = async (buyer: ActorWithSync) => {
    if (!buyer.id) {
      showError(t("actor:errors.missingBuyerId"));
      return;
    }

    try {
      const confirmed = await confirmRemoveBuyer(
        exporterId,
        buyer.id,
        buyer.id,
        async () => {
          await removeBuyerFromExporter(exporterId, buyer.id);
        }
      );

      if (confirmed) {
        showSuccess(t("actor:success.buyerRemoved"));
        // Recharger les données
        await loadBuyers({
          exporterId,
          page: pagination?.currentPage || 1,
          limit: pagination?.perPage || 10,
        });
      }
    } catch (error) {
      console.error("Error removing buyer:", error);
      showError(
        error instanceof Error
          ? error.message
          : t("actor:errors.removeBuyerFailed")
      );
    }
  };

  // Colonnes du tableau
  const columns: ColumnDef<ActorWithSync>[] = [
    {
      accessorKey: "familyName",
      header: () => (
        <span className="text-left text-sm !px-2 !text-foreground">
          {t("actor:buyersTable.columns.fullName")}
        </span>
      ),
      cell: ({ row }) => {
        const buyer = row.original;
        const fullName = [buyer.givenName, buyer.familyName]
          .filter(Boolean)
          .join(" ");
        return (
          <div className="flex flex-col px-2">
            <span className="font-medium text-sm">{fullName || "---"}</span>
            {buyer.onccId && (
              <span className="text-xs text-muted-foreground">
                {t("actor:buyersTable.columns.onccId")}: {buyer.onccId}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "locationCode",
      header: t("actor:buyersTable.columns.contact"),
      cell: ({ row }) => {
        const buyer = row.original;
        return (
          <div className="text-sm">
            <HierarchyDisplay code={buyer.locationCode} />
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: t("buyersTable.columns.status"),
      cell: ({ row }) => {
        const buyer = row.original;
        if (buyer.status === "active") {
          return (
            <Badge variant="outline" className="bg-green-100 text-green-800">
              {buyer.status ? t(`common:status.${buyer.status}`) : "---"}
            </Badge>
          );
        } else if (buyer.status === "inactive") {
          return (
            <Badge variant="outline" className="bg-red-100 text-red-800">
              {buyer.status ? t(`common:status.${buyer.status}`) : "---"}
            </Badge>
          );
        }
        return (
          <Badge variant="outline">
            {buyer.status ? t(`common:status.${buyer.status}`) : "---"}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const buyer = row.original;
        return (
          <div className="flex justify-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleRemoveBuyer(buyer)}
              className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
              title={t("actor:actions.removeBuyer")}
              disabled={!isOnline}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  // Charger les données initiales
  useEffect(() => {
    if (exporterId) {
      loadBuyers({
        exporterId,
        page: 1,
        limit: 10,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exporterId]);

  // Gestion de la pagination
  const handlePaginationChange = (paginationState: PaginationState) => {
    const page = paginationState.pageIndex + 1;
    const limit = paginationState.pageSize;

    loadBuyers({
      exporterId,
      page,
      limit,
    });
  };

  if (loading && buyers.length === 0) {
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
            loadBuyers({
              exporterId,
              page: 1,
              limit: 10,
            })
          }
          className="mt-2"
        >
          {t("common:actions.retry")}
        </Button>
      </div>
    );
  }

  return (
    <div className={className}>
      <DataTable
        columns={columns}
        data={buyers}
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
        emptyMessage={t("actor:buyersTable.empty")}
        previousLabel={t("common:actions.previous")}
        nextLabel={t("common:actions.next")}
      />
    </div>
  );
};
