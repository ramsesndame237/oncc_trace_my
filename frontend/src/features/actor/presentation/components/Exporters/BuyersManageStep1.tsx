"use client";

import { Icon } from "@/components/icon";
import { BaseCard } from "@/components/modules/base-card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { db, type OfflineActorData } from "@/core/infrastructure/database/db";
import { useExporterManageFormStore } from "@/features/actor/infrastructure/store/exporterManageFormStore";
import { useExporterManageFormNavigation } from "@/features/actor/presentation/hooks/useExporterManageFormNavigation";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import ExportersFormLayout from "./ExportersFormLayout";

export default function BuyersManageStep1() {
  const { t } = useTranslation(["actor", "common"]);
  const router = useRouter();

  const { formData, updateStep1Data, setStepValidation, setCurrentStep } =
    useExporterManageFormStore();

  const { navigateToNext, handleCancel } = useExporterManageFormNavigation();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedExporterId, setSelectedExporterId] = useState<string | null>(
    formData.step1.selectedExporterId
  );
  const [isNavigating, setIsNavigating] = useState(false);
  const [allExporters, setAllExporters] = useState<OfflineActorData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Réinitialiser isNavigating quand le composant est monté
  useEffect(() => {
    setIsNavigating(false);
  }, []);

  // État de pagination local
  const [paginationState, setPaginationState] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  // Charger les Exporters depuis IndexedDB
  useEffect(() => {
    const loadExporters = async () => {
      setIsLoading(true);
      try {
        // Récupérer tous les acteurs de type EXPORTER actifs
        const exporters = await db.actors
          .where("actorType")
          .equals("EXPORTER")
          .filter((actor) => actor.status === "active")
          .toArray();

        setAllExporters(exporters);
      } catch (error) {
        console.error(
          "Erreur lors du chargement des Exporters depuis IndexedDB:",
          error
        );
        setAllExporters([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadExporters();
  }, []);

  // Marquer l'étape comme active
  useEffect(() => {
    setCurrentStep(1);
  }, [setCurrentStep]);

  // Filtrage par recherche
  const filteredExporters = useMemo(() => {
    if (!searchQuery.trim()) return allExporters;

    const query = searchQuery.toLowerCase();
    return allExporters.filter((exporter) => {
      const fullName =
        `${exporter.familyName} ${exporter.givenName}`.toLowerCase();
      const onccId = exporter.onccId?.toLowerCase() || "";

      return fullName.includes(query) || onccId.includes(query);
    });
  }, [allExporters, searchQuery]);

  // Réinitialiser la pagination quand la recherche change
  useEffect(() => {
    setPaginationState((prev) => ({ ...prev, pageIndex: 0 }));
  }, [searchQuery]);

  // Pagination des résultats filtrés
  const paginatedExporters = useMemo(() => {
    const startIndex = paginationState.pageIndex * paginationState.pageSize;
    const endIndex = startIndex + paginationState.pageSize;
    return filteredExporters.slice(startIndex, endIndex);
  }, [filteredExporters, paginationState]);

  // Métadonnées de pagination
  const paginationMeta = useMemo(() => {
    const totalPages = Math.ceil(
      filteredExporters.length / paginationState.pageSize
    );
    const currentPage = paginationState.pageIndex + 1;

    return {
      currentPage,
      perPage: paginationState.pageSize,
      total: filteredExporters.length,
      lastPage: totalPages,
      firstPage: 1,
      firstPageUrl: "",
      lastPageUrl: "",
      nextPageUrl: currentPage < totalPages ? "" : null,
      previousPageUrl: currentPage > 1 ? "" : null,
    };
  }, [filteredExporters.length, paginationState]);

  // Gestion de la sélection unique
  const handleSelectExporter = useCallback(
    (exporterId: string) => {
      setSelectedExporterId(exporterId);
      updateStep1Data({ selectedExporterId: exporterId });
      setStepValidation("step1", true);
    },
    [updateStep1Data, setStepValidation]
  );

  const handleNext = useCallback(() => {
    if (!selectedExporterId || isNavigating) return;

    setIsNavigating(true);
    // Naviguer vers l'étape suivante
    navigateToNext(1);
  }, [selectedExporterId, isNavigating, navigateToNext]);

  const handleBack = () => {
    router.push("/actors/exporters/choice");
  };

  // Colonnes du tableau
  const columns: ColumnDef<OfflineActorData>[] = [
    {
      id: "select",
      header: "",
      cell: ({ row }) => {
        const exporter = row.original;
        const exporterId = exporter.serverId || exporter.localId;
        return (
          <div className="flex items-center justify-center">
            <RadioGroupItem
              value={exporterId || ""}
              id={`exporter-${exporterId}`}
              onClick={() => exporterId && handleSelectExporter(exporterId)}
            />
          </div>
        );
      },
    },
    {
      accessorKey: "fullName",
      header: t("exporter.manage.columns.name"),
      cell: ({ row }) => {
        const exporter = row.original;
        const fullName =
          [exporter.familyName, exporter.givenName].filter(Boolean).join(" ") ||
          "---";
        return (
          <div className="flex flex-col">
            <span className="font-medium">{fullName}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "location",
      header: t("exporter.manage.columns.location"),
      cell: ({ row }) =>
        row.original.onccId ? (
          <span className="text-xs text-muted-foreground">
            {row.original.onccId}
          </span>
        ) : (
          "---"
        ),
    },
  ];

  const footerButtons = (
    <div className="flex justify-end space-x-3">
      <Button
        onClick={handleNext}
        disabled={!selectedExporterId || isNavigating}
      >
        {t("common:actions.next")}
      </Button>
    </div>
  );

  const headerContent = (
    <div className="flex flex-col space-y-2">
      <h1 className="text-xl font-medium text-gray-900">
        {t("exporter.manage.selectExporter")}
      </h1>
    </div>
  );

  return (
    <ExportersFormLayout
      className="lg:flex items-start lg:space-x-4"
      title={t("exporter.manage.title")}
      onHandleCancel={handleCancel}
    >
      <div className="py-3">
        <Button variant="link" onClick={handleBack}>
          <Icon name="ArrowLeft" />
          <span>{t("common:actions.back")}</span>
        </Button>
      </div>
      <BaseCard
        title={headerContent}
        footer={footerButtons}
        className="w-full flex-1"
      >
        {/* Barre de recherche */}
        <div className="mb-6">
          <div className="relative">
            <Icon
              name="SearchIcon"
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
            />
            <Input
              type="text"
              placeholder={t("exporter.manage.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              disabled={isLoading}
            />
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {filteredExporters.length} {t("exporter.manage.exportersAvailable")}
          </p>
        </div>

        <Separator className="my-4" />

        {/* Tableau des Exporters disponibles */}
        {isLoading ? (
          <div className="text-center py-8">
            <Icon
              name="Loader2"
              className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-spin"
            />
            <p className="text-sm text-muted-foreground">
              {t("form.loadingData")}
            </p>
          </div>
        ) : filteredExporters.length === 0 ? (
          <div className="text-center py-8">
            <Icon
              name="ExporterIcon"
              className="h-12 w-12 text-gray-400 mx-auto mb-4"
            />
            <p className="text-sm text-muted-foreground">
              {searchQuery
                ? t("exporter.manage.noResultsForSearch", {
                    search: searchQuery,
                  })
                : t("exporter.manage.noAvailableExporters")}
            </p>
          </div>
        ) : (
          <RadioGroup value={selectedExporterId || ""}>
            <DataTable
              columns={columns}
              data={paginatedExporters}
              pagination={paginationMeta}
              onPaginationChange={setPaginationState}
              emptyMessage={t("exporter.manage.noAvailableExporters")}
            />
          </RadioGroup>
        )}
      </BaseCard>
    </ExportersFormLayout>
  );
}
