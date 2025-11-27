"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ColumnDef } from "@tanstack/react-table";

import { dayjs } from "@/lib/dayjs";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { CampaignResponse } from "../../../domain/types";

export const useColumns = (): ColumnDef<CampaignResponse>[] => {
  const { t } = useTranslation("campaign");

  return [
    {
      accessorKey: "code",
      header: () => (
        <span className="text-left text-sm !px-2 !text-foreground">
          {t("table.columns.code")}
        </span>
      ),
      cell: ({ row }) => {
        const campaign = row.original;
        return (
          <div>
            <Button size={"sm"} variant={"link"} asChild>
              <Link href={`/campaign/view?entityId=${campaign.id}`}>
                {campaign.code}
              </Link>
            </Button>
          </div>
        );
      },
    },
    {
      accessorKey: "startDate",
      header: t("table.columns.startDate"),
      cell: ({ row }) => {
        const startDate = row.getValue("startDate") as string;
        return dayjs(startDate).format("DD MMM YYYY");
      },
    },
    {
      accessorKey: "endDate",
      header: t("table.columns.endDate"),
      cell: ({ row }) => {
        const endDate = row.getValue("endDate") as string;
        return dayjs(endDate).format("DD MMM YYYY");
      },
    },
    {
      accessorKey: "status",
      header: t("table.columns.status"),
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        if (status === "active") {
          return (
            <Badge variant="outline" className="bg-green-100 text-green-800">
              {t("table.statusLabels.active")}
            </Badge>
          );
        }
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800">
            {t("table.statusLabels.inactive")}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        return (
          <div className="flex justify-end">
            <Button size="sm">
              <Link href={`/campaign/view?entityId=${row.original.id}`}>
                {t("table.viewDetails")}
              </Link>
            </Button>
          </div>
        );
      },
    },
  ];
};

export const useColumnsMobile = (): ColumnDef<CampaignResponse>[] => {
  const { t } = useTranslation("campaign");

  return [
    {
      // accessorKey: "name",
      id: "name",
      cell: ({ row }) => {
        return (
          <div className="border border-border rounded-md p-4 bg-white">
            <div className="flex justify-between items-center">
              <div className="text-lg font-medium">{row.original.code}</div>
              <Button size={"sm"} variant={"link"} asChild>
                <Link href={`/campaign/view?entityId=${row.original.id}`}>
                  {t("table.viewDetails")}
                </Link>
              </Button>
            </div>
          </div>
        );
      },
    },
  ];
};
