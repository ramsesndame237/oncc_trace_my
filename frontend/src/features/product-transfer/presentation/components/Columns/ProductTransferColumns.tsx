"use client";
/* eslint-disable react-hooks/rules-of-hooks */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import type { ColumnDef } from "@tanstack/react-table";
import type { TFunction } from "i18next";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import type { ProductTransfer } from "../../../domain";

/**
 * Factory function pour créer les colonnes Desktop avec traductions
 */
export const createColumns = (
  t: TFunction<["productTransfer"]>
): ColumnDef<ProductTransfer>[] => [
  {
    accessorKey: "code",
    header: t("table.headers.code"),
    cell: ({ row }) => (
      <span className="font-medium text-foreground">{row.original.code}</span>
    ),
  },
  {
    accessorKey: "transferDate",
    header: t("table.headers.transferDate"),
    cell: ({ row }) => {
      const date = new Date(row.original.transferDate);
      return (
        <span className="text-muted-foreground">
          {date.toLocaleDateString("fr-FR")}
        </span>
      );
    },
  },
  {
    id: "sender",
    header: t("table.headers.sender"),
    cell: ({ row }) => {
      const actor = row.original.senderActor;
      const store = row.original.senderStore;

      if (!actor) return <span className="text-muted-foreground">-</span>;

      return (
        <div className="flex flex-col">
          <span className="font-medium">
            {actor.familyName} {actor.givenName}
          </span>
          {store && (
            <span className="text-xs text-muted-foreground">{store.name}</span>
          )}
        </div>
      );
    },
  },
  {
    id: "receiver",
    header: t("table.headers.receiver"),
    cell: ({ row }) => {
      const actor = row.original.receiverActor;
      const store = row.original.receiverStore;

      if (!actor) return <span className="text-muted-foreground">-</span>;

      return (
        <div className="flex flex-col">
          <span className="font-medium">
            {actor.familyName} {actor.givenName}
          </span>
          {store && (
            <span className="text-xs text-muted-foreground">{store.name}</span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: t("table.headers.status"),
    cell: ({ row }) => {
      const status = row.original.status;

      // Utiliser les mêmes styles que UserList pour la cohérence
      if (status === "validated") {
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800">
            {t("statuses.validated")}
          </Badge>
        );
      } else if (status === "cancelled") {
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800">
            {t("statuses.cancelled")}
          </Badge>
        );
      } else if (status === "pending") {
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
            {t("statuses.pending")}
          </Badge>
        );
      }

      return <Badge variant="outline">{t("statuses.pending")}</Badge>;
    },
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => {
      const isOnline = useOnlineStatus();
      return (
        <div className="flex justify-end">
          <Button size="sm" asChild disabled={!isOnline}>
            <Link
              href={`/product-transfers/view?entityId=${row.original.id}`}
            >
              {t("actions.viewDetails")}
            </Link>
          </Button>
        </div>
      );
    },
  },
];

/**
 * Factory function pour créer les colonnes Mobile avec traductions
 */
export const createColumnsMobile = (
  t: TFunction<["productTransfer"]>
): ColumnDef<ProductTransfer>[] => [
  {
    id: "transfer",
    header: t("table.headers.code"),
    cell: ({ row }) => {
      const transfer = row.original;
      const date = new Date(transfer.transferDate);
      const isOnline = useOnlineStatus();

      return (
        <div className="flex flex-col gap-2 py-2">
          <div className="flex items-center justify-between">
            <span className="font-medium text-foreground">{transfer.code}</span>
            {transfer.status === "validated" ? (
              <Badge variant="outline" className="bg-green-100 text-green-800">
                {t("statuses.validated")}
              </Badge>
            ) : transfer.status === "cancelled" ? (
              <Badge variant="outline" className="bg-red-100 text-red-800">
                {t("statuses.cancelled")}
              </Badge>
            ) : transfer.status === "pending" ? (
              <Badge
                variant="outline"
                className="bg-yellow-100 text-yellow-800"
              >
                {t("statuses.pending")}
              </Badge>
            ) : (
              <Badge variant="outline">{t("statuses.pending")}</Badge>
            )}
          </div>

          <div className="text-sm text-muted-foreground">
            {date.toLocaleDateString("fr-FR")}
          </div>

          {transfer.senderActor && (
            <div className="text-sm">
              <span className="text-muted-foreground">De: </span>
              <span className="font-medium">
                {transfer.senderActor.familyName}{" "}
                {transfer.senderActor.givenName}
              </span>
            </div>
          )}

          {transfer.receiverActor && (
            <div className="text-sm">
              <span className="text-muted-foreground">À: </span>
              <span className="font-medium">
                {transfer.receiverActor.familyName}{" "}
                {transfer.receiverActor.givenName}
              </span>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button size="sm" asChild disabled={!isOnline}>
              <Link
                href={`/product-transfers/view?entityId=${transfer.id}`}
              >
                {t("actions.viewDetails")}
              </Link>
            </Button>
          </div>
        </div>
      );
    },
  },
];

/**
 * Hook pour obtenir les colonnes Desktop avec traductions
 * @deprecated Utiliser createColumns(t) directement
 */
export const useColumns = (): ColumnDef<ProductTransfer>[] => {
  const { t } = useTranslation("productTransfer");
  return createColumns(t);
};

/**
 * Hook pour obtenir les colonnes Mobile avec traductions
 * @deprecated Utiliser createColumnsMobile(t) directement
 */
export const useColumnsMobile = (): ColumnDef<ProductTransfer>[] => {
  const { t } = useTranslation("productTransfer");
  return createColumnsMobile(t);
};

/**
 * Exports pour compatibilité rétroactive
 * À préférer: useColumns() et useColumnsMobile()
 */
export const columns: ColumnDef<ProductTransfer>[] = [];
export const columnsMobile: ColumnDef<ProductTransfer>[] = [];
