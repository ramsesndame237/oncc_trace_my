"use client";

import { Icon } from "@/components/icon";
import { BaseCard } from "@/components/modules/base-card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { db, type OfflineActorData } from "@/core/infrastructure/database/db";
import { useExporterManageFormStore } from "@/features/actor/infrastructure/store/exporterManageFormStore";
import ExportersFormLayout from "@/features/actor/presentation/components/Exporters/ExportersFormLayout";
import { useExporterManageFormNavigation } from "@/features/actor/presentation/hooks/useExporterManageFormNavigation";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

export default function BuyersManageStep2() {
  const { t } = useTranslation(["actor", "common"]);

  const {
    formData,
    updateStep2Data,
    setStepValidation,
    setCurrentStep,
    markStepCompleted,
    saveProgress,
  } = useExporterManageFormStore();

  const { navigateToNext, navigateToPrevious, handleCancel } =
    useExporterManageFormNavigation();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBuyerIds, setSelectedBuyerIds] = useState<Set<string>>(
    new Set()
  );
  const [initialBuyerIds, setInitialBuyerIds] = useState<Set<string>>(
    new Set()
  );
  const [isNavigating, setIsNavigating] = useState(false);
  const [allBuyers, setAllBuyers] = useState<OfflineActorData[]>([]);
  const [currentExporter, setCurrentExporter] =
    useState<OfflineActorData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Réinitialiser isNavigating quand le composant est monté
  useEffect(() => {
    setIsNavigating(false);
  }, []);

  // État de pagination local
  const [paginationState, setPaginationState] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  // Charger l'Exporter et les buyers depuis IndexedDB
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const selectedExporterId = formData.step1.selectedExporterId;
        if (!selectedExporterId) {
          console.warn("Aucun Exporter sélectionné");
          setIsLoading(false);
          return;
        }

        // Charger l'Exporter sélectionné (recherche par serverId ou localId)
        let exporter = await db.actors
          .where("serverId")
          .equals(selectedExporterId)
          .first();

        if (!exporter) {
          exporter = await db.actors
            .where("localId")
            .equals(selectedExporterId)
            .first();
        }

        setCurrentExporter(exporter || null);

        // Charger tous les buyers actifs
        const allActiveBuyers = await db.actors
          .where("actorType")
          .equals("BUYER")
          .filter((actor) => actor.status === "active")
          .toArray();

        // Charger TOUTES les relations exportateur-buyer
        const allRelations = await db.exporterMandates.toArray();

        // Charger les relations pour CET exportateur spécifiquement
        const thisExporterRelations = allRelations.filter(
          (rel) =>
            rel.exporterServerId === selectedExporterId ||
            rel.exporterLocalId === selectedExporterId
        );

        // Extraire les IDs des buyers déjà associés à CET exportateur
        const thisBuyerIds = thisExporterRelations
          .map((rel) => rel.buyerServerId || rel.buyerLocalId)
          .filter((id): id is string => Boolean(id));

        // Extraire les IDs des buyers associés à D'AUTRES exportateurs
        const otherExportersBuyerIds = allRelations
          .filter(
            (rel) =>
              rel.exporterServerId !== selectedExporterId &&
              rel.exporterLocalId !== selectedExporterId
          )
          .map((rel) => rel.buyerServerId || rel.buyerLocalId)
          .filter((id): id is string => Boolean(id));

        // Filtrer pour afficher uniquement:
        // 1. Les buyers non associés à aucun exportateur
        // 2. Les buyers déjà associés à CET exportateur
        const availableBuyers = allActiveBuyers.filter((buyer) => {
          const buyerId = buyer.serverId || buyer.localId;
          if (!buyerId) return false;

          // Si le buyer est déjà associé à CET exportateur, l'afficher
          if (thisBuyerIds.includes(buyerId)) return true;

          // Si le buyer est associé à un AUTRE exportateur, NE PAS l'afficher
          if (otherExportersBuyerIds.includes(buyerId)) return false;

          // Sinon, c'est un buyer disponible (non associé)
          return true;
        });

        setAllBuyers(availableBuyers);

        // Récupérer les IDs déjà sélectionnés dans le formulaire (nouvelles sélections)
        const formBuyerIds = formData.step2?.selectedBuyerIds || [];

        // Combiner les deux : relations existantes (thisBuyerIds) + nouvelles sélections (sans doublons)
        const combinedIds = Array.from(
          new Set([...thisBuyerIds, ...formBuyerIds])
        );

        // Filtrer les IDs combinés pour ne garder que ceux qui sont disponibles (visibles)
        const availableBuyerIds = availableBuyers
          .map((b) => b.serverId || b.localId)
          .filter((id): id is string => Boolean(id));

        const validCombinedIds = combinedIds.filter((id) =>
          availableBuyerIds.includes(id)
        );

        // Initialiser avec tous les IDs combinés ET disponibles
        setSelectedBuyerIds(new Set(validCombinedIds));
        // Sauvegarder les IDs initiaux pour détecter les changements
        setInitialBuyerIds(new Set(validCombinedIds));

        // Ne mettre à jour le formulaire que si c'est différent
        if (
          JSON.stringify(validCombinedIds.sort()) !==
          JSON.stringify(formBuyerIds.sort())
        ) {
          updateStep2Data({ selectedBuyerIds: validCombinedIds });
        }

        setIsInitialized(true);
      } catch (error) {
        console.error(
          "Erreur lors du chargement des données depuis IndexedDB:",
          error
        );
        setAllBuyers([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.step1.selectedExporterId]);

  // Marquer l'étape comme active
  useEffect(() => {
    setCurrentStep(2);
  }, [setCurrentStep]);

  // Filtrage par recherche
  const filteredBuyers = useMemo(() => {
    if (!searchQuery.trim()) return allBuyers;

    const query = searchQuery.toLowerCase();
    return allBuyers.filter((buyer) => {
      const fullName = `${buyer.familyName} ${buyer.givenName}`.toLowerCase();
      const onccId = buyer.onccId?.toLowerCase() || "";

      return fullName.includes(query) || onccId.includes(query);
    });
  }, [allBuyers, searchQuery]);

  // Réinitialiser la pagination quand la recherche change
  useEffect(() => {
    setPaginationState((prev) => ({ ...prev, pageIndex: 0 }));
  }, [searchQuery]);

  // Pagination des résultats filtrés
  const paginatedBuyers = useMemo(() => {
    const startIndex = paginationState.pageIndex * paginationState.pageSize;
    const endIndex = startIndex + paginationState.pageSize;
    return filteredBuyers.slice(startIndex, endIndex);
  }, [filteredBuyers, paginationState]);

  // Métadonnées de pagination
  const paginationMeta = useMemo(() => {
    const totalPages = Math.ceil(
      filteredBuyers.length / paginationState.pageSize
    );
    const currentPage = paginationState.pageIndex + 1;

    return {
      currentPage,
      perPage: paginationState.pageSize,
      total: filteredBuyers.length,
      lastPage: totalPages,
      firstPage: 1,
      firstPageUrl: "",
      lastPageUrl: "",
      nextPageUrl: currentPage < totalPages ? "" : null,
      previousPageUrl: currentPage > 1 ? "" : null,
    };
  }, [filteredBuyers.length, paginationState]);

  // Gestion de la sélection
  const handleToggleBuyer = useCallback((buyerId: string) => {
    setSelectedBuyerIds((prev) => {
      const newSet = new Set(prev);
      const wasSelected = newSet.has(buyerId);
      if (wasSelected) {
        newSet.delete(buyerId);
      } else {
        newSet.add(buyerId);
      }
      return newSet;
    });
  }, []);

  const handleToggleAll = useCallback(() => {
    if (selectedBuyerIds.size === paginatedBuyers.length) {
      setSelectedBuyerIds(new Set());
    } else {
      const ids = paginatedBuyers
        .map((p) => p.serverId || p.localId)
        .filter((id): id is string => Boolean(id));
      setSelectedBuyerIds(new Set(ids));
    }
  }, [selectedBuyerIds.size, paginatedBuyers]);

  // Sauvegarder les IDs sélectionnés dans le store (seulement si initialisé)
  useEffect(() => {
    const ids = Array.from(selectedBuyerIds);
    const currentIds = formData.step2?.selectedBuyerIds || [];

    // Ne sauvegarder que si le composant est initialisé (évite de sauvegarder lors du chargement initial)
    if (isInitialized) {
      // Ne sauvegarder que si les IDs ont vraiment changé
      if (JSON.stringify(ids.sort()) !== JSON.stringify(currentIds.sort())) {
        updateStep2Data({ selectedBuyerIds: ids });
        saveProgress();
      }
    }
  }, [
    selectedBuyerIds,
    isInitialized,
    updateStep2Data,
    saveProgress,
    formData.step2?.selectedBuyerIds,
  ]);

  // Validation: L'étape est toujours valide (même avec 0 buyer sélectionné - optionnel)
  useEffect(() => {
    setStepValidation("step2", true);
  }, [setStepValidation]);

  // Vérifier s'il y a eu des changements par rapport à l'état initial
  const hasChanges = useMemo(() => {
    if (!isInitialized) return false;

    const currentIds = Array.from(selectedBuyerIds).sort();
    const initialIds = Array.from(initialBuyerIds).sort();

    return JSON.stringify(currentIds) !== JSON.stringify(initialIds);
  }, [selectedBuyerIds, initialBuyerIds, isInitialized]);

  const handleNext = useCallback(async () => {
    if (!isNavigating) {
      setIsNavigating(true);
      markStepCompleted(2);
      navigateToNext(2);
    }
  }, [isNavigating, markStepCompleted, navigateToNext]);

  const handlePrevious = useCallback(() => {
    if (!isNavigating) {
      setIsNavigating(true);
      navigateToPrevious();
    }
  }, [isNavigating, navigateToPrevious]);

  // Colonnes du tableau
  const columns: ColumnDef<OfflineActorData>[] = [
    {
      id: "select",
      header: () => (
        <Checkbox
          checked={
            paginatedBuyers.length > 0 &&
            selectedBuyerIds.size === paginatedBuyers.length
          }
          onCheckedChange={handleToggleAll}
          aria-label={t("common:table.selectAll")}
          disabled={isLoading}
        />
      ),
      cell: ({ row }) => {
        const buyer = row.original;
        const buyerId = buyer.serverId || buyer.localId;

        return (
          <Checkbox
            checked={buyerId ? selectedBuyerIds.has(buyerId) : false}
            onCheckedChange={() => buyerId && handleToggleBuyer(buyerId)}
            aria-label={t("common:table.selected")}
            disabled={isLoading || !buyerId}
          />
        );
      },
    },
    {
      accessorKey: "fullName",
      header: () => (
        <span className="text-left text-sm !px-2 !text-foreground">
          {t("buyersTable.columns.fullName")}
        </span>
      ),
      cell: ({ row }) => {
        const buyer = row.original;
        const fullName = `${buyer.familyName} ${buyer.givenName}`;

        return (
          <div className="flex items-center space-x-3 px-2">
            <Icon name="UserIcon" className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-sm font-medium text-gray-700">{fullName}</p>
              {buyer.onccId && (
                <p className="text-xs text-gray-500">
                  {t("buyersTable.columns.onccId")}: {buyer.onccId}
                </p>
              )}
            </div>
          </div>
        );
      },
    },
  ];

  const footerButtons = [
    <Button
      key="next"
      type="button"
      onClick={handleNext}
      disabled={!hasChanges || isNavigating}
      className="flex items-center space-x-2"
    >
      <span>{t("common:actions.next")}</span>
    </Button>,
  ];

  const headerContent = (
    <div className="flex flex-col space-y-2">
      <h1 className="text-xl font-medium text-gray-900">
        {t("buyer.manage.manageBuyers")}
      </h1>
      {currentExporter && (
        <p className="text-sm text-muted-foreground">
          {t("exporter.manage.exporterName")}: {currentExporter.familyName}{" "}
          {currentExporter.givenName}
        </p>
      )}
    </div>
  );

  return (
    <ExportersFormLayout
      className="lg:flex items-start lg:space-x-4"
      onHandleCancel={handleCancel}
      title={t("buyer.manage.title")}
    >
      <div className="py-3">
        <Button variant="link" onClick={handlePrevious}>
          <Icon name="ArrowLeft" />
          <span>{t("common:actions.back")}</span>
        </Button>
      </div>
      <BaseCard
        title={headerContent}
        footer={footerButtons}
        className="w-full flex-1"
        classNameFooter="!justify-between"
      >
        {/* Description */}
        <div className="mb-6">
          <p className="text-sm text-muted-foreground">
            {t("buyer.manage.selectBuyersDescription")}
          </p>
        </div>

        {/* Barre de recherche */}
        <div className="mb-6">
          <div className="relative">
            <Icon
              name="SearchIcon"
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
            />
            <Input
              type="text"
              placeholder={t("buyer.manage.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              disabled={isLoading}
            />
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-sm text-muted-foreground">
              {t("buyer.availableCount", {
                count: filteredBuyers.length,
              })}
            </p>
            {selectedBuyerIds.size > 0 && (
              <p className="text-sm font-medium text-primary">
                {t("buyer.selectedCount", {
                  count: selectedBuyerIds.size,
                })}
              </p>
            )}
          </div>
        </div>

        <Separator className="my-4" />

        {/* Tableau des buyers disponibles */}
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
        ) : filteredBuyers.length === 0 ? (
          <div className="text-center py-8">
            <Icon
              name="UsersIcon"
              className="h-12 w-12 text-gray-400 mx-auto mb-4"
            />
            <p className="text-sm text-muted-foreground">
              {searchQuery
                ? t("buyer.noResultsFound")
                : t("buyer.noAvailableBuyersForSelection")}
            </p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={paginatedBuyers}
            pagination={paginationMeta}
            onPaginationChange={setPaginationState}
            emptyMessage={t("buyer.noAvailableBuyersForSelection")}
          />
        )}
      </BaseCard>
    </ExportersFormLayout>
  );
}
