"use client";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/icon";
import {
  getQualityLabel,
  type ProductQuality,
} from "@/core/domain/generated/cacao-types.types";
import type { ProductItem } from "@/features/product-transfer/domain";
import type { TranslateFn } from "@/i18n/types";
import { ColumnDef } from "@tanstack/react-table";

interface ProductColumnsOptions {
  t: TranslateFn;
  onDelete?: (index: number) => void;
  showActions?: boolean;
}

export const createProductColumns = ({
  t,
  onDelete,
  showActions = true,
}: ProductColumnsOptions): ColumnDef<ProductItem>[] => {
  const columns: ColumnDef<ProductItem>[] = [
    {
      accessorKey: "quality",
      header: t("productTransfer:form.step2.quality"),
      cell: ({ row }) => {
        const quality = row.getValue("quality") as ProductQuality;
        return <div className="text-sm">{getQualityLabel(quality)}</div>;
      },
    },
    {
      accessorKey: "weight",
      header: t("productTransfer:form.step2.weight"),
      cell: ({ row }) => {
        const weight = row.getValue("weight") as number;
        return <div className="text-sm">{weight.toLocaleString()} kg</div>;
      },
    },
    {
      accessorKey: "numberOfBags",
      header: t("productTransfer:form.step2.numberOfBags"),
      cell: ({ row }) => {
        const bags = row.getValue("numberOfBags") as number;
        return <div className="text-sm">{bags.toLocaleString()}</div>;
      },
    },
  ];

  // Ajouter la colonne Actions seulement si showActions est true
  if (showActions && onDelete) {
    columns.push({
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const index = row.index;
        return (
          <div className="flex items-center justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(index)}
              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Icon name="Trash2" className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    });
  }

  return columns;
};
