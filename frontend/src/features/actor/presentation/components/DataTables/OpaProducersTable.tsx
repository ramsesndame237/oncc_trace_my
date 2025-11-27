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
import { useOpaProducers } from "../../hooks/useOpaProducers";

interface OpaProducersTableProps {
  opaId: string;
  className?: string;
}

export const OpaProducersTable: React.FC<OpaProducersTableProps> = ({
  opaId,
  className,
}) => {
  const { t } = useTranslation(["actor", "common"]);
  const { producers, pagination, loading, error, loadProducers } =
    useOpaProducers();
  const isOnline = useOnlineStatus();
  const { confirmRemoveProducer } = useActorModal();
  const { removeProducerFromOpa } = useActorStore();

  // Gestion de la suppression d'un producteur
  const handleRemoveProducer = async (producer: ActorWithSync) => {
    if (!producer.id) {
      showError(t("actor:errors.missingProducerId"));
      return;
    }

    try {
      const confirmed = await confirmRemoveProducer(
        opaId,
        producer.id,
        producer.id,
        async () => {
          await removeProducerFromOpa(opaId, producer.id);
        }
      );

      if (confirmed) {
        showSuccess(t("actor:success.producerRemoved"));
        // Recharger les données
        await loadProducers({
          opaId,
          page: pagination?.currentPage || 1,
          limit: pagination?.perPage || 10,
        });
      }
    } catch (error) {
      console.error("Error removing producer:", error);
      showError(
        error instanceof Error
          ? error.message
          : t("actor:errors.removeProducerFailed")
      );
    }
  };

  // Colonnes du tableau
  const columns: ColumnDef<ActorWithSync>[] = [
    {
      accessorKey: "familyName",
      header: () => (
        <span className="text-left text-sm !px-2 !text-foreground">
          {t("actor:producersTable.columns.fullName")}
        </span>
      ),
      cell: ({ row }) => {
        const producer = row.original;
        const fullName = [producer.givenName, producer.familyName]
          .filter(Boolean)
          .join(" ");
        return (
          <div className="flex flex-col px-2">
            <span className="font-medium text-sm">{fullName || "---"}</span>
            {producer.onccId && (
              <span className="text-xs text-muted-foreground">
                {t("actor:producersTable.columns.onccId")}: {producer.onccId}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "locationCode",
      header: t("actor:producersTable.columns.contact"),
      cell: ({ row }) => {
        const producer = row.original;
        return (
          <div className="text-sm">
            <HierarchyDisplay code={producer.locationCode} />
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: t("producersTable.columns.status"),
      cell: ({ row }) => {
        const producer = row.original;
        if (producer.status === "active") {
          return (
            <Badge variant="outline" className="bg-green-100 text-green-800">
              {producer.status ? t(`common:status.${producer.status}`) : "---"}
            </Badge>
          );
        } else if (producer.status === "inactive") {
          return (
            <Badge variant="outline" className="bg-red-100 text-red-800">
              {producer.status ? t(`common:status.${producer.status}`) : "---"}
            </Badge>
          );
        }
        return (
          <Badge variant="outline">
            {producer.status ? t(`common:status.${producer.status}`) : "---"}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const producer = row.original;
        return (
          <div className="flex justify-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleRemoveProducer(producer)}
              className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
              title={t("actor:actions.removeProducer")}
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
    if (opaId) {
      loadProducers({
        opaId,
        page: 1,
        limit: 10,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opaId]);

  // Gestion de la pagination
  const handlePaginationChange = (paginationState: PaginationState) => {
    const page = paginationState.pageIndex + 1;
    const limit = paginationState.pageSize;

    loadProducers({
      opaId,
      page,
      limit,
    });
  };

  if (loading && producers.length === 0) {
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
            loadProducers({
              opaId,
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
        data={producers}
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
        emptyMessage={t("actor:producersTable.empty")}
        previousLabel={t("common:actions.previous")}
        nextLabel={t("common:actions.next")}
      />
    </div>
  );
};
