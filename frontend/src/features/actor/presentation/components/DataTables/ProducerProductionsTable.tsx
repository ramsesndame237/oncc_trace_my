"use client";

import { LoadingLoader } from "@/components/modules/loading-loader";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { getQualityLabel, type ProductQuality } from "@/core/domain/generated/cacao-types.types";
import type { ProductionByQuality } from "@/features/actor/domain/production.types";
import { useActorStore } from "@/features/actor/infrastructure/store/actorStore";
import type { ColumnDef } from "@tanstack/react-table";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ProducerProductionsResponse } from "@/features/actor/domain/production.types";

interface ProducerProductionsTableProps {
  producerId: string;
  className?: string;
}

export const ProducerProductionsTable: React.FC<
  ProducerProductionsTableProps
> = ({ producerId, className }) => {
  const { t } = useTranslation(["actor", "common"]);
  const { getProducerProductions } = useActorStore();
  const [data, setData] = useState<ProducerProductionsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProductions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getProducerProductions(producerId);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (producerId) {
      loadProductions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [producerId]);

  // Colonnes du tableau
  const columns: ColumnDef<ProductionByQuality>[] = [
    {
      accessorKey: "quality",
      header: () => (
        <span className="text-left text-sm !px-2 !text-foreground">
          {t("common:fields.quality")}
        </span>
      ),
      cell: ({ row }) => {
        const quality = row.original.quality;
        const label = getQualityLabel(quality as ProductQuality);
        return (
          <div className="px-2">
            <span className="font-medium text-sm">{label}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "totalWeight",
      header: () => (
        <span className="text-left text-sm !px-2 !text-foreground">
          {t("common:fields.totalWeight")} (kg)
        </span>
      ),
      cell: ({ row }) => {
        const weight = Number(row.original.totalWeight || 0);
        return (
          <div className="px-2">
            <span className="text-sm">
              {weight.toLocaleString("fr-FR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "totalBags",
      header: () => (
        <span className="text-left text-sm !px-2 !text-foreground">
          {t("common:fields.totalBags")}
        </span>
      ),
      cell: ({ row }) => {
        const bags = Number(row.original.totalBags || 0);
        return (
          <div className="px-2">
            <span className="text-sm">{bags.toLocaleString("fr-FR")}</span>
          </div>
        );
      },
    },
  ];

  if (isLoading) {
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
          onClick={loadProductions}
          className="mt-2"
        >
          {t("common:actions.retry")}
        </Button>
      </div>
    );
  }

  if (!data || data.totalsByQuality.length === 0) {
    return (
      <div className={`${className} text-center py-8 text-muted-foreground`}>
        {t("producer.noProductions")}
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Tableau des totaux par qualité */}
      <DataTable
        columns={columns}
        data={data.totalsByQuality}
        emptyMessage={t("producer.noProductions")}
      />

      {/* Totaux globaux */}
      <div className="mt-6 rounded-md border bg-muted/50 p-4">
        <h3 className="text-lg font-semibold mb-3">
          {t("producer.globalTotals")}
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">
              {t("common:fields.totalWeight")}
            </p>
            <p className="text-2xl font-bold">
              {Number(data.totals.totalWeight || 0).toLocaleString("fr-FR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{" "}
              kg
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              {t("common:fields.totalBags")}
            </p>
            <p className="text-2xl font-bold">
              {Number(data.totals.totalBags || 0).toLocaleString("fr-FR")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
