"use client";

import { Button } from "@/components/ui/button";
import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { LocationResponse } from "../../domain";
import { HierarchyDisplay } from "./HierarchyDisplay";

const NameHeader = () => {
  const { t } = useTranslation("location");
  return (
    <span className="text-left text-sm !px-2 !text-foreground">
      {t("table.name")}
    </span>
  );
};

const HierarchyHeader = () => {
  const { t } = useTranslation("location");
  return t("table.hierarchy");
};

export const columns: ColumnDef<LocationResponse>[] = [
  {
    accessorKey: "name",
    header: NameHeader,
    cell: ({ row }) => {
      const isClickable = row.original.type !== "village";

      if (!isClickable) {
        return <div>{row.original.name}</div>;
      }

      return (
        <>
          <Button size={"sm"} variant={"link"} className="!py-0">
            <Link href={`/locations?locationCode=${row.original.code}`}>
              {row.original.name}
            </Link>
          </Button>
          <div className="px-2 text-[10px] capitalize">{row.original.type}</div>
        </>
      );
    },
  },
  {
    accessorKey: "hierarchy",
    header: HierarchyHeader,
    cell: ({ row }) => <HierarchyDisplay code={row.original.code} />,
  },
];

export const columnsMobile: ColumnDef<LocationResponse>[] = [
  {
    // accessorKey: "name",
    id: "name",
    cell: ({ row }) => {
      const isClickable = row.original.type !== "village";

      const nameContent = (
        <div className="text-lg font-medium">{row.original.name}</div>
      );

      return (
        <div className="border border-border rounded-md p-4 bg-white">
          <div className="flex justify-between items-center">
            {isClickable ? (
              <Link href={`/locations?locationCode=${row.original.code}`}>
                {nameContent}
              </Link>
            ) : (
              nameContent
            )}
          </div>
          <HierarchyDisplay code={row.original.code} />
        </div>
      );
    },
  },
];
