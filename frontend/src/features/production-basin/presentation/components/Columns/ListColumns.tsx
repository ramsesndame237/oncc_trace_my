"use client";

import { Button } from "@/components/ui/button";
import i18n from "@/i18n/client";
import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { ProductionBasinResponse } from "../../../domain";

export const columns: ColumnDef<ProductionBasinResponse>[] = [
  {
    accessorKey: "name",
    header: () => (
      <span className="text-left text-sm !px-2 !text-foreground">
        {i18n.t("table.columns.basinName", { ns: "productionBasin" })}
      </span>
    ),
    cell: ({ row }) => {
      return (
        <>
          <Button size={"sm"} variant={"link"} asChild>
            <Link href={`/production-basin/view?entityId=${row.original.id}`}>
              {row.original.name}
            </Link>
          </Button>
          {row.original.description && (
            <div className="px-2 text-[10px] text-muted-foreground break-words text-wrap w-[350px]">
              {row.original.description}
            </div>
          )}
        </>
      );
    },
  },
  {
    accessorKey: "locations",
    header: i18n.t("table.columns.locationsCount", { ns: "productionBasin" }),
    cell: ({ row }) => {
      return <>{row.original.locations?.length || 0} </>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      return (
        <div className="flex justify-end">
          <Button size="sm">
            <Link href={`/production-basin/view?entityId=${row.original.id}`}>
              {i18n.t("table.columns.viewDetails", { ns: "productionBasin" })}
            </Link>
          </Button>
        </div>
      );
    },
  },
];

export const columnsMobile: ColumnDef<ProductionBasinResponse>[] = [
  {
    // accessorKey: "name",
    id: "name",
    cell: ({ row }) => {
      return (
        <div className="border border-border rounded-md p-4 bg-white">
          <div className="flex justify-between items-center">
            <div className="text-lg font-medium">{row.original.name}</div>
            <Button size={"sm"} variant={"link"} asChild>
              <Link href={`/production-basin/view?entityId=${row.original.id}`}>
                {i18n.t("table.columns.seeDetails", { ns: "productionBasin" })}
              </Link>
            </Button>
          </div>
          {row.original.description && (
            <div className="text-[10px] text-muted-foreground line-clamp-2 break-words mt-1">
              {row.original.description}
            </div>
          )}
          <div className="flex flex-col">
            {row.original.locations?.map((localisation, index) => (
              <div key={index}>{localisation.name}</div>
            ))}
          </div>
        </div>
      );
    },
  },
];
