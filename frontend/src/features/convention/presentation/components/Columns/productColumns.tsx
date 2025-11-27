"use client";

import { Button } from "@/components/ui/button";
import {
  getQualityLabel,
  getStandardLabel,
} from "@/core/domain/generated/cacao-types.types";
import {
  ConventionProduct,
  ProductQuality,
  ProductStandard,
} from "@/features/convention/domain/types/convention.types";
import { TranslateFn } from "@/i18n/types";
import { ColumnDef } from "@tanstack/react-table";
import { Trash2 } from "lucide-react";

interface ProductColumnsOptions {
  t: TranslateFn;
  onDelete?: (index: number) => void;
  showActions?: boolean;
}

export const createProductColumns = ({
  t,
  onDelete,
  showActions = true,
}: ProductColumnsOptions): ColumnDef<ConventionProduct>[] => {
  const columns: ColumnDef<ConventionProduct>[] = [
    {
      accessorKey: "quality",
      header: t("convention:form.step2.tableHeaders.quality"),
      cell: ({ row }) => {
        const quality = row.getValue("quality") as ProductQuality;
        return <div className="text-sm">{getQualityLabel(quality)}</div>;
      },
    },
    {
      accessorKey: "standard",
      header: t("convention:form.step2.tableHeaders.standard"),
      cell: ({ row }) => {
        const standard = row.getValue("standard") as ProductStandard;
        return <div className="text-sm">{getStandardLabel(standard)}</div>;
      },
    },
    {
      accessorKey: "weight",
      header: t("convention:form.step2.tableHeaders.weight"),
      cell: ({ row }) => {
        const weight = row.getValue("weight") as number;
        return <div className="text-sm">{weight} Kg</div>;
      },
    },
    {
      accessorKey: "bags",
      header: t("convention:form.step2.tableHeaders.bags"),
      cell: ({ row }) => {
        const bags = row.getValue("bags") as number;
        return <div className="text-sm">{bags}</div>;
      },
    },
    {
      accessorKey: "humidity",
      header: t("convention:form.step2.tableHeaders.humidity"),
      cell: ({ row }) => {
        const humidity = row.getValue("humidity") as number;
        return <div className="text-sm">{humidity} %</div>;
      },
    },
    {
      accessorKey: "pricePerKg",
      header: t("convention:form.step2.tableHeaders.pricePerKg"),
      cell: ({ row }) => {
        const pricePerKg = row.getValue("pricePerKg") as number;
        return (
          <div className="text-sm">
            {pricePerKg.toLocaleString("fr-FR")} XAF
          </div>
        );
      },
    },
  ];

  // Ajouter la colonne Actions seulement si showActions est true
  if (showActions && onDelete) {
    columns.push({
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const index = row.index; // Utiliser row.index au lieu de row.original.index
        return (
          <div className="flex items-center justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(index)}
              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    });
  }

  return columns;
};
