"use client";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/icon";
import {
  PRODUCT_QUALITIES_CONSTANTS,
  PRODUCT_STANDARDS_CONSTANTS,
} from "@/core/domain/generated/cacao-types.types";
import type { TransactionProductForm } from "@/features/transaction/infrastructure/store/saleAddFormStore";
import type { TranslateFn } from "@/i18n/types";
import { ColumnDef } from "@tanstack/react-table";

interface SaleProductColumnsOptions {
  t: TranslateFn;
  onDelete?: (index: number) => void;
  showActions?: boolean;
  producerOptions?: Array<{ value: string; label: string }>;
}

// Fonction pour obtenir le label de qualité traduit
const getQualityLabel = (quality: string, t: TranslateFn): string => {
  switch (quality) {
    case PRODUCT_QUALITIES_CONSTANTS.GRADE_1:
      return t("transaction:saleAdd.qualityOptions.grade1");
    case PRODUCT_QUALITIES_CONSTANTS.GRADE_2:
      return t("transaction:saleAdd.qualityOptions.grade2");
    case PRODUCT_QUALITIES_CONSTANTS.HS:
      return t("transaction:saleAdd.qualityOptions.hs");
    default:
      return quality;
  }
};

// Fonction pour obtenir le label de standard traduit
const getStandardLabel = (standard: string, t: TranslateFn): string => {
  switch (standard) {
    case PRODUCT_STANDARDS_CONSTANTS.CERTIFIE:
      return t("transaction:saleAdd.standardOptions.certifie");
    case PRODUCT_STANDARDS_CONSTANTS.EXCELLENT:
      return t("transaction:saleAdd.standardOptions.excellent");
    case PRODUCT_STANDARDS_CONSTANTS.FIN:
      return t("transaction:saleAdd.standardOptions.fin");
    case PRODUCT_STANDARDS_CONSTANTS.CONVENTIONNEL:
      return t("transaction:saleAdd.standardOptions.conventionnel");
    default:
      return standard;
  }
};

export const createSaleProductColumns = ({
  t,
  onDelete,
  showActions = true,
  producerOptions,
}: SaleProductColumnsOptions): ColumnDef<TransactionProductForm>[] => {
  const columns: ColumnDef<TransactionProductForm>[] = [];

  // Colonne Producteur (en premier si disponible)
  if (producerOptions && producerOptions.length > 0) {
    columns.push({
      accessorKey: "producerId",
      header: t("transaction:saleAdd.fields.producer"),
      cell: ({ row }) => {
        const producerId = row.getValue("producerId") as string | null;
        if (!producerId) return <div className="text-sm">-</div>;

        const producer = producerOptions.find((p) => p.value === producerId);
        return (
          <div className="text-sm">
            {producer ? producer.label : producerId}
          </div>
        );
      },
    });
  }

  // Colonne Produit (Qualité + Standard combinés)
  columns.push({
    id: "product",
    header: t("transaction:saleAdd.fields.product"),
    cell: ({ row }) => {
      const quality = row.original.quality;
      const standard = row.original.standard;
      return (
        <div className="text-sm">
          <div className="font-medium">{getQualityLabel(quality, t)}</div>
          <div className="text-gray-500">{getStandardLabel(standard, t)}</div>
        </div>
      );
    },
  });

  // Colonne Poids
  columns.push({
    accessorKey: "weight",
    header: t("transaction:saleAdd.fields.weight"),
    cell: ({ row }) => {
      const weight = row.getValue("weight") as number;
      return <div className="text-sm">{weight.toLocaleString("fr-FR")} kg</div>;
    },
  });

  // Colonne Nombre de sacs
  columns.push({
    accessorKey: "bagCount",
    header: t("transaction:saleAdd.fields.bagCount"),
    cell: ({ row }) => {
      const bagCount = row.getValue("bagCount") as number;
      return <div className="text-sm">{bagCount.toLocaleString("fr-FR")}</div>;
    },
  });

  // Colonne Taux d'humidité
  columns.push({
    accessorKey: "humidity",
    header: t("transaction:saleAdd.fields.humidity"),
    cell: ({ row }) => {
      const humidity = row.getValue("humidity") as number | null;
      return (
        <div className="text-sm">
          {humidity !== null ? `${humidity}%` : "-"}
        </div>
      );
    },
  });

  // Colonne Prix total
  columns.push({
    accessorKey: "totalPrice",
    header: t("transaction:saleAdd.fields.totalPrice"),
    cell: ({ row }) => {
      const totalPrice = row.getValue("totalPrice") as number;
      return (
        <div className="text-sm font-semibold">
          {totalPrice.toLocaleString("fr-FR")} FCFA
        </div>
      );
    },
  });

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
