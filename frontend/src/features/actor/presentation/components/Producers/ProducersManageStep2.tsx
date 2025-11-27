"use client";

import { Icon } from "@/components/icon";
import { BaseCard } from "@/components/modules/base-card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { db, type OfflineActorData } from "@/core/infrastructure/database/db";
import { useOPAManageFormStore } from "@/features/actor/infrastructure/store/opaManageFormStore";
import ProducersFormLayout from "@/features/actor/presentation/components/Producers/ProducersFormLayout";
import { useOPAManageFormNavigation } from "@/features/actor/presentation/hooks/useOPAManageFormNavigation";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

export default function ProducersManageStep2() {
  const { t } = useTranslation(["actor", "common"]);

  const {
    formData,
    updateStep2Data,
    setStepValidation,
    setCurrentStep,
    markStepCompleted,
    saveProgress,
  } = useOPAManageFormStore();

  const { navigateToNext, navigateToPrevious, handleCancel } =
    useOPAManageFormNavigation();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProducerIds, setSelectedProducerIds] = useState<Set<string>>(
    new Set()
  );
  const [initialProducerIds, setInitialProducerIds] = useState<Set<string>>(
    new Set()
  );
  const [isNavigating, setIsNavigating] = useState(false);
  const [allProducers, setAllProducers] = useState<OfflineActorData[]>([]);
  const [currentOPA, setCurrentOPA] = useState<OfflineActorData | null>(null);
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

  // Charger l'OPA et les producteurs depuis IndexedDB
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const selectedOPAId = formData.step1.selectedOPAId;
        if (!selectedOPAId) {
          console.warn("Aucun OPA sélectionné");
          setIsLoading(false);
          return;
        }

        // Charger l'OPA sélectionné (recherche par serverId ou localId)
        let opa = await db.actors
          .where("serverId")
          .equals(selectedOPAId)
          .first();

        if (!opa) {
          opa = await db.actors
            .where("localId")
            .equals(selectedOPAId)
            .first();
        }

        setCurrentOPA(opa || null);

        // Charger tous les producteurs actifs
        // NOTE: Un producteur peut être associé à PLUSIEURS OPAs en même temps
        // Donc on affiche TOUS les producteurs actifs sans filtrage
        const producers = await db.actors
          .where("actorType")
          .equals("PRODUCER")
          .filter((actor) => actor.status === "active")
          .toArray();

        setAllProducers(producers);

        // Charger les relations pour CETTE OPA spécifiquement
        const thisOPARelations = await db.producerOpaRelations
          .filter(
            (rel) =>
              rel.opaServerId === selectedOPAId ||
              rel.opaLocalId === selectedOPAId
          )
          .toArray();

        // Extraire les IDs des producteurs déjà associés à CETTE OPA
        const thisProducerIds = thisOPARelations
          .map((rel) => rel.producerServerId || rel.producerLocalId)
          .filter((id): id is string => Boolean(id));

        // Récupérer les IDs déjà sélectionnés dans le formulaire (nouvelles sélections)
        const formProducerIds = formData.step2?.selectedProducerIds || [];

        // Combiner les deux : relations existantes (thisProducerIds) + nouvelles sélections (sans doublons)
        const combinedIds = Array.from(
          new Set([...thisProducerIds, ...formProducerIds])
        );

        // Initialiser avec tous les IDs combinés
        setSelectedProducerIds(new Set(combinedIds));
        // Sauvegarder les IDs initiaux pour détecter les changements
        setInitialProducerIds(new Set(combinedIds));

        // Ne mettre à jour le formulaire que si c'est différent
        if (
          JSON.stringify(combinedIds.sort()) !==
          JSON.stringify(formProducerIds.sort())
        ) {
          updateStep2Data({ selectedProducerIds: combinedIds });
        }

        setIsInitialized(true);
      } catch (error) {
        console.error(
          "Erreur lors du chargement des données depuis IndexedDB:",
          error
        );
        setAllProducers([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.step1.selectedOPAId]);

  // Marquer l'étape comme active
  useEffect(() => {
    setCurrentStep(2);
  }, [setCurrentStep]);

  // Filtrage par recherche
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
      const wasSelected = newSet.has(producerId);
      if (wasSelected) {
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

  // Sauvegarder les IDs sélectionnés dans le store (seulement si initialisé)
  useEffect(() => {
    const ids = Array.from(selectedProducerIds);
    const currentIds = formData.step2?.selectedProducerIds || [];

    // Ne sauvegarder que si le composant est initialisé (évite de sauvegarder lors du chargement initial)
    if (isInitialized) {
      // Ne sauvegarder que si les IDs ont vraiment changé
      if (JSON.stringify(ids.sort()) !== JSON.stringify(currentIds.sort())) {
        updateStep2Data({ selectedProducerIds: ids });
        saveProgress();
      }
    }
  }, [
    selectedProducerIds,
    isInitialized,
    updateStep2Data,
    saveProgress,
    formData.step2?.selectedProducerIds,
  ]);

  // Validation: L'étape est toujours valide (même avec 0 producteur sélectionné - optionnel)
  useEffect(() => {
    setStepValidation("step2", true);
  }, [setStepValidation]);

  // Vérifier s'il y a eu des changements par rapport à l'état initial
  const hasChanges = useMemo(() => {
    if (!isInitialized) return false;

    const currentIds = Array.from(selectedProducerIds).sort();
    const initialIds = Array.from(initialProducerIds).sort();

    return JSON.stringify(currentIds) !== JSON.stringify(initialIds);
  }, [selectedProducerIds, initialProducerIds, isInitialized]);

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
            paginatedProducers.length > 0 &&
            selectedProducerIds.size === paginatedProducers.length
          }
          onCheckedChange={handleToggleAll}
          aria-label={t("common:table.selectAll")}
          disabled={isLoading}
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
            disabled={isLoading || !producerId}
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
        {t("producers.manage.manageProducers")}
      </h1>
      {currentOPA && (
        <p className="text-sm text-muted-foreground">
          {t("producers.manage.opaName")}: {currentOPA.familyName}{" "}
          {currentOPA.givenName}
        </p>
      )}
    </div>
  );

  return (
    <ProducersFormLayout
      className="lg:flex items-start lg:space-x-4"
      onHandleCancel={handleCancel}
      title={t("producers.manage.title")}
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
            {t("producers.manage.selectProducersDescription")}
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
              placeholder={t("producers.manage.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              disabled={isLoading}
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
