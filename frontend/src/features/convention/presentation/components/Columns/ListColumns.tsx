"use client";
/* eslint-disable react-hooks/rules-of-hooks */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Convention } from "@/features/convention/domain/types";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { TranslateFn } from "@/i18n/types";
import { dayjs } from "@/lib/dayjs";
import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { useTranslation } from "react-i18next";

export const conventionColumns = (t: TranslateFn): ColumnDef<Convention>[] => [
  {
    accessorKey: "code",
    header: () => t("table.columns.code") as string,
    cell: ({ row }) => {
      const code = row.original.code;
      return (
        <span className="font-mono font-medium text-primary">{code}</span>
      );
    },
  },
  {
    accessorKey: "buyerExporter",
    header: () => t("table.columns.buyerExporter") as string,
    cell: ({ row }) => {
      const buyerExporter = row.original.buyerExporter;
      if (!buyerExporter) return "---";

      const fullName = `${buyerExporter.familyName} ${buyerExporter.givenName}`;
      const actorType = buyerExporter.actorType;

      return (
        <div className="flex flex-col">
          <span className="font-medium">{fullName}</span>
          {buyerExporter.onccId && (
            <span className="text-xs text-muted-foreground">
              {buyerExporter.onccId}
            </span>
          )}
          <span className="text-xs text-muted-foreground capitalize">
            {actorType}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "producers",
    header: () => t("table.columns.opa") as string,
    cell: ({ row }) => {
      const producers = row.original.producers;
      if (!producers) return "---";

      const fullName = `${producers.familyName} ${producers.givenName}`;

      return (
        <div className="flex flex-col">
          <span className="font-medium">{fullName}</span>
          {producers.onccId && (
            <span className="text-xs text-muted-foreground">
              {producers.onccId}
            </span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "signatureDate",
    header: () => t("table.columns.signatureDate") as string,
    cell: ({ row }) => {
      const date = row.original.signatureDate;
      return dayjs(date).format("DD/MM/YYYY");
    },
  },
  {
    accessorKey: "status",
    header: () => t("table.columns.status") as string,
    cell: ({ row }) => {
      const status = row.original.status;

      if (status === "inactive") {
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800">
            {t("status.inactive") as string}
          </Badge>
        );
      }

      return (
        <Badge variant="outline" className="bg-green-100 text-green-800">
          {t("status.active") as string}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const { t } = useTranslation("common");
      const isOnline = useOnlineStatus();
      return (
        <div className="flex justify-end">
          <Button size="sm" asChild disabled={!isOnline}>
            <Link href={`/conventions/view?entityId=${row.original.id}`}>
              {t("actions.viewDetails")}
            </Link>
          </Button>
        </div>
      );
    },
  },
];
