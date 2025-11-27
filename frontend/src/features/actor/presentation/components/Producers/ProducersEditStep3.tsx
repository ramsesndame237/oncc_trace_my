"use client";

import { Icon } from "@/components/icon";
import { BaseCard } from "@/components/modules/base-card";
import { SyncErrorAlert } from "@/components/modules/sync-error-alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { db, OfflineActorData } from "@/core/infrastructure/database/db";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useProducersFormStore } from "../../../infrastructure/store/producersFormStore";
import { useProducersFormNavigation } from "../../hooks/useProducersFormNavigation";
import ProducersFormLayout from "./ProducersFormLayout";

export default function ProducersEditStep3() {
  const { t } = useTranslation(["actor", "common"]);
  const searchParams = useSearchParams();
  const entityId = searchParams.get("entityId");
  const editOffline = searchParams.has("editOffline");

  const {
    formData,
    updateStep3Data,
    setStepValidation,
    setCurrentStep,
    markStepCompleted,
    saveProgress,
  } = useProducersFormStore();

  const { navigateToNext, handleCancel } = useProducersFormNavigation();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProducerIds, setSelectedProducerIds] = useState<Set<string>>(
    new Set(formData.step3?.selectedProducerIds || [])
  );
  const [allProducers, setAllProducers] = useState<OfflineActorData[]>([]);
  const [isLoadingProducers, setIsLoadingProducers] = useState(true);
  const [isLoadingOfflineData, setIsLoadingOfflineData] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  // Réinitialiser isNavigating quand le composant est monté
  useEffect(() => {
    setIsNavigating(false);
  }, []);

  // État de pagination local
  const [paginationState, setPaginationState] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  // Charger les données depuis pendingOperations si en mode offline
  useEffect(() => {
    const loadOfflineData = async () => {
      if (entityId && editOffline) {
        setIsLoadingOfflineData(true);
        try {
          const pendingOperation = await db.pendingOperations
            .where("entityId")
            .equals(entityId)
            .first();

          if (pendingOperation && pendingOperation.payload) {
            const payload = pendingOperation.payload as Record<string, unknown>;
            const producers = (payload.producers as Array<Record<string, unknown>>) || [];

            // Extraire les IDs des producteurs
            const producerIds = producers
              .map((p) => p.producerId as string)
              .filter((id): id is string => Boolean(id));

            // Mettre à jour le store et l'état local
            setSelectedProducerIds(new Set(producerIds));
            updateStep3Data({ selectedProducerIds: producerIds });
          }
        } catch (error) {
          console.error(
            "Erreur lors du chargement des données offline:",
            error
          );
        } finally {
          setIsLoadingOfflineData(false);
        }
      }
    };

    loadOfflineData();
  }, [entityId, editOffline, updateStep3Data]);

  // Charger les producteurs depuis IndexedDB
  useEffect(() => {
    const loadProducers = async () => {
      setIsLoadingProducers(true);
      try {
        // Récupérer tous les producteurs actifs
        const producers = await db.actors
          .where("actorType")
          .equals("PRODUCER")
          .filter((actor) => actor.status === "active")
          .toArray();

        setAllProducers(producers);
      } catch (error) {
        console.error(
          "Erreur lors du chargement des producteurs depuis IndexedDB:",
          error
        );
        setAllProducers([]);
      } finally {
        setIsLoadingProducers(false);
      }
    };

    loadProducers();
  }, []);

  // Marquer l'étape comme active
  useEffect(() => {
    setCurrentStep(3);
  }, [setCurrentStep]);

  // Filtrage par recherche (nom, prénom, code ONCC uniquement)
  const filteredProducers = useMemo(() => {
    if (!searchQuery.trim()) return allProducers;

    const query = searchQuery.toLowerCase();
    return allProducers.filter((producer) => {
      const fullName =
        `${producer.familyName} ${producer.givenName}`.toLowerCase();
      const onccId = producer.onccId?.toLowerCase() || "";

      return fullName.includes(query) || onccId.includes(query);
    });
  }, [allProducers, searchQuery]);

  // Réinitialiser la pagination quand la recherche change
  useEffect(() => {
    setPaginationState((prev) => ({ ...prev, pageIndex: 0 }));
  }, [searchQuery]);

  // Pagination des résultats filtrés
  const paginatedProducers = useMemo(() => {
    const startIndex = paginationState.pageIndex * paginationState.pageSize;
    const endIndex = startIndex + paginationState.pageSize;
    return filteredProducers.slice(startIndex, endIndex);
  }, [filteredProducers, paginationState]);

  // Métadonnées de pagination
  const paginationMeta = useMemo(() => {
    const totalPages = Math.ceil(
      filteredProducers.length / paginationState.pageSize
    );
    const currentPage = paginationState.pageIndex + 1;

    return {
      currentPage,
      perPage: paginationState.pageSize,
      total: filteredProducers.length,
      lastPage: totalPages,
      firstPage: 1,
      firstPageUrl: "",
      lastPageUrl: "",
      nextPageUrl: currentPage < totalPages ? "" : null,
      previousPageUrl: currentPage > 1 ? "" : null,
    };
  }, [filteredProducers.length, paginationState]);

  // Gestion de la sélection
  const handleToggleProducer = useCallback((producerId: string) => {
    setSelectedProducerIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(producerId)) {
        newSet.delete(producerId);
      } else {
        newSet.add(producerId);
      }
      return newSet;
    });
  }, []);

  const handleToggleAll = useCallback(() => {
    if (selectedProducerIds.size === paginatedProducers.length) {
      setSelectedProducerIds(new Set());
    } else {
      const ids = paginatedProducers
        .map((p) => p.serverId || p.localId)
        .filter((id): id is string => Boolean(id));
      setSelectedProducerIds(new Set(ids));
    }
  }, [selectedProducerIds.size, paginatedProducers]);

  // Sauvegarder les IDs sélectionnés dans le store
  useEffect(() => {
    const ids = Array.from(selectedProducerIds);
    updateStep3Data({ selectedProducerIds: ids });
    saveProgress();
  }, [selectedProducerIds, updateStep3Data, saveProgress]);

  // Validation: L'étape est toujours valide (même avec 0 producteur sélectionné - optionnel)
  useEffect(() => {
    setStepValidation(3, true);
  }, [setStepValidation]);

  const handleNext = useCallback(async () => {
    if (!isNavigating) {
      setIsNavigating(true);
      markStepCompleted(3);
      navigateToNext();
    }
  }, [isNavigating, markStepCompleted, navigateToNext]);

  // Colonnes du tableau
  const columns: ColumnDef<OfflineActorData>[] = [
    {
      id: "select",
      header: () => (
        <Checkbox
          checked={
            paginatedProducers.length > 0 &&
            selectedProducerIds.size === paginatedProducers.length
          }
          onCheckedChange={handleToggleAll}
          aria-label={t("common:table.selectAll")}
          disabled={isLoadingProducers}
        />
      ),
      cell: ({ row }) => {
        const producer = row.original;
        const producerId = producer.serverId || producer.localId;

        return (
          <Checkbox
            checked={producerId ? selectedProducerIds.has(producerId) : false}
            onCheckedChange={() =>
              producerId && handleToggleProducer(producerId)
            }
            aria-label={t("common:table.selected")}
            disabled={isLoadingProducers || !producerId}
          />
        );
      },
    },
    {
      accessorKey: "fullName",
      header: () => (
        <span className="text-left text-sm !px-2 !text-foreground">
          {t("producersTable.columns.fullName")}
        </span>
      ),
      cell: ({ row }) => {
        const producer = row.original;
        const fullName = `${producer.familyName} ${producer.givenName}`;

        return (
          <div className="flex items-center space-x-3 px-2">
            <Icon name="UserIcon" className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-sm font-medium text-gray-700">{fullName}</p>
              {producer.onccId && (
                <p className="text-xs text-gray-500">
                  {t("producersTable.columns.onccId")}: {producer.onccId}
                </p>
              )}
            </div>
          </div>
        );
      },
    },
  ];

  // Header avec titre
  const headerContent = (
    <div className="flex items-center space-x-3">
      <h1 className="text-xl font-medium text-gray-900">
        {t("producers.sections.members")}
      </h1>
    </div>
  );

  // Boutons du footer
  const footerButtons = [
    <Button
      key="next"
      type="button"
      onClick={handleNext}
      disabled={isNavigating}
      className="flex items-center space-x-2"
    >
      <span>{t("common:actions.next")}</span>
    </Button>,
  ];

  return (
    <ProducersFormLayout
      className="lg:flex items-start lg:space-x-4"
      onHandleCancel={handleCancel}
    >
      <div className="py-3">
        <Button variant="link" onClick={handleCancel}>
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
        {/* Alerte d'erreur de synchronisation */}
        {editOffline && entityId && (
          <SyncErrorAlert entityId={entityId} entityType="actor" />
        )}

        {isLoadingOfflineData && (
          <div className="p-4 text-center text-muted-foreground">
            {t("form.loadingData")}
          </div>
        )}

        {/* Description */}
        <div className="mb-6">
          <p className="text-sm text-muted-foreground">
            {t("producers.descriptions.membersInfo")}
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
              placeholder={t("producers.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              disabled={isLoadingProducers}
            />
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-sm text-muted-foreground">
              {t("producers.availableCount", {
                count: filteredProducers.length,
              })}
            </p>
            {selectedProducerIds.size > 0 && (
              <p className="text-sm font-medium text-primary">
                {t("producers.selectedCount", {
                  count: selectedProducerIds.size,
                })}
              </p>
            )}
          </div>
        </div>

        <Separator className="my-4" />

        {/* Tableau des producteurs disponibles */}
        {isLoadingProducers ? (
          <div className="text-center py-8">
            <Icon
              name="Loader2"
              className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-spin"
            />
            <p className="text-sm text-muted-foreground">
              {t("form.loadingData")}
            </p>
          </div>
        ) : filteredProducers.length === 0 ? (
          <div className="text-center py-8">
            <Icon
              name="UsersIcon"
              className="h-12 w-12 text-gray-400 mx-auto mb-4"
            />
            <p className="text-sm text-muted-foreground">
              {searchQuery
                ? t("producers.noResultsFound")
                : t("producers.noAvailableProducersForSelection")}
            </p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={paginatedProducers}
            pagination={paginationMeta}
            onPaginationChange={setPaginationState}
            emptyMessage={t("producers.noAvailableProducersForSelection")}
          />
        )}
      </BaseCard>
    </ProducersFormLayout>
  );
}
