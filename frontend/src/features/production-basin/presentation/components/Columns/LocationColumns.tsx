import { HierarchyDisplay } from "@/features/location/presentation/components/HierarchyDisplay";
import { ColumnDef } from "@tanstack/react-table";
import i18n from "@/i18n/client";
import { LocationResponse } from "../../../domain/types/response";

// Colonnes pour les localisations dans le contexte des bassins de production
export const locationColumns: ColumnDef<LocationResponse>[] = [
  {
    accessorKey: "name",
    header: () => (
      <span className="text-left text-sm !px-2 !text-foreground">
        {i18n.t("table.columns.name", { ns: "productionBasin" })}
      </span>
    ),
    cell: ({ row }) => (
      <div className="px-2">
        <div className="font-medium">
          {row.original.name} {" - "}
          <span className="text-muted-foreground text-xs">
            ({row.original.code})
          </span>
        </div>
        <div className="text-xs text-muted-foreground">{row.original.type}</div>
      </div>
    ),
  },
  {
    accessorKey: "hierarchy",
    header: i18n.t("table.columns.hierarchy", { ns: "productionBasin" }),
    cell: ({ row }) => (
      <div className="text-sm">
        <HierarchyDisplay code={row.original.code} />
      </div>
    ),
  },
];
