"use client";

import { LoadingLoader } from "@/components/modules/loading-loader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import type { Actor } from "@/core/domain/actor.types";
import { apiClient } from "@/core/infrastructure/api";
import { HierarchyDisplay } from "@/features/location/presentation/components";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import type { ColumnDef } from "@tanstack/react-table";
import { Trash2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useStoreModal } from "../hooks/useStoreModal";
import { useStoreStore } from "../../infrastructure/store/storeStore";

interface StoreOccupantsTableProps {
  storeId: string;
  className?: string;
  canManage?: boolean; // ⭐ Permet de masquer les actions de gestion
}

export const StoreOccupantsTable: React.FC<StoreOccupantsTableProps> = ({
  storeId,
  className,
  canManage = true, // Par défaut, on peut gérer
}) => {
  const { t } = useTranslation(["store", "common"]);
  const [occupants, setOccupants] = useState<Actor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isOnline = useOnlineStatus();

  const { confirmRemoveOccupant } = useStoreModal();
  const { removeOccupantFromStore } = useStoreStore();

  // Charger les occupants
  const loadOccupants = async () => {
    if (!storeId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<Actor[]>(
        `/stores/${storeId}/occupants`
      );
      if (response.success) {
        setOccupants(response.data || []);
      } else {
        throw new Error(response.message);
      }
    } catch (err) {
      console.error("Error loading store occupants:", err);
      setError(
        err instanceof Error ? err.message : t("occupants.errors.loadFailed")
      );
      setOccupants([]);
    } finally {
      setLoading(false);
    }
  };

  // Handler pour retirer un occupant
  const handleRemoveOccupant = async (occupant: Actor) => {
    if (!occupant.id) {
      toast.error(t("occupants.errors.missingOccupantId"));
      return;
    }

    try {
      const confirmed = await confirmRemoveOccupant(
        storeId,
        occupant.id,
        occupant.id,
        async () => {
          await removeOccupantFromStore(storeId, occupant.id);
        }
      );

      if (confirmed) {
        toast.success(t("occupants.success.occupantRemoved"));
        await loadOccupants();
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t("occupants.errors.removeOccupantFailed")
      );
    }
  };

  // Colonnes du tableau
  const baseColumns: ColumnDef<Actor>[] = [
    {
      accessorKey: "fullName",
      header: () => (
        <span className="text-left text-sm !px-2 !text-foreground">
          {t("occupants.table.columns.name")}
        </span>
      ),
      cell: ({ row }) => {
        const occupant = row.original;
        const fullName =
          [occupant.givenName, occupant.familyName].filter(Boolean).join(" ") ||
          "---";

        return (
          <div className="flex flex-col px-2">
            <span className="font-medium text-sm">{fullName}</span>
            {occupant.actorType && (
              <span className="text-xs text-muted-foreground">
                {t(`actorTypes.${occupant.actorType}`)}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "locationCode",
      header: t("occupants.manage.columns.location"),
      cell: ({ row }) => {
        const occupant = row.original;
        return (
          <div className="text-sm">
            {occupant.locationCode ? (
              <HierarchyDisplay code={occupant.locationCode} />
            ) : (
              <span className="text-muted-foreground">---</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: t("occupants.table.columns.status"),
      cell: ({ row }) => {
        const occupant = row.original;
        if (occupant.status === "active") {
          return (
            <Badge variant="outline" className="bg-green-100 text-green-800">
              {occupant.status ? t(`status.${occupant.status}`) : "---"}
            </Badge>
          );
        } else if (occupant.status === "inactive") {
          return (
            <Badge variant="outline" className="bg-red-100 text-red-800">
              {occupant.status ? t(`status.${occupant.status}`) : "---"}
            </Badge>
          );
        }
        return (
          <Badge variant="outline">
            {occupant.status ? t(`status.${occupant.status}`) : "---"}
          </Badge>
        );
      },
    },
  ];

  // ⭐ Ajouter la colonne d'actions seulement si canManage est true
  const columns: ColumnDef<Actor>[] = canManage
    ? [
        ...baseColumns,
        {
          id: "actions",
          header: "",
          cell: ({ row }) => {
            const occupant = row.original;
            return (
              <div className="flex justify-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveOccupant(occupant)}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                  title={t("occupants.actions.removeOccupant")}
                  disabled={!isOnline}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            );
          },
        },
      ]
    : baseColumns;

  // Charger les occupants au montage
  useEffect(() => {
    loadOccupants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  if (loading && occupants.length === 0) {
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
          onClick={() => window.location.reload()}
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
        data={occupants}
        emptyMessage={t("occupants.table.empty")}
      />
    </div>
  );
};
