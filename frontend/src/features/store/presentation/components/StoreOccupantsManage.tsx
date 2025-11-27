"use client";

import { Icon } from "@/components/icon";
import { BaseCard } from "@/components/modules/base-card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import type { Actor } from "@/core/domain/actor.types";
import { ActorServiceProvider } from "@/features/actor/infrastructure/di/actorServiceProvider";
import { useActorStore } from "@/features/actor/infrastructure/store/actorStore";
import { HierarchyDisplay } from "@/features/location/presentation/components";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { StoreServiceProvider } from "../../infrastructure/di/storeServiceProvider";
import { useGetStoreById } from "../hooks/useGetStoreById";

export default function StoreOccupantsManage() {
  const { t } = useTranslation(["store", "common"]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const entityId = searchParams.get("entityId");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOccupants, setSelectedOccupants] = useState<Set<string>>(
    new Set()
  );
  const [addingOccupants, setAddingOccupants] = useState<Set<string>>(
    new Set()
  );
  const [isProcessing, setIsProcessing] = useState(false);

  // État de pagination local
  const [paginationState, setPaginationState] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  // Récupérer les informations du magasin
  const { store, refetch: refetchStore } = useGetStoreById(entityId || "");

  // Récupérer tous les acteurs depuis le store
  const { actors: allActors } = useActorStore();

  useEffect(() => {
    // Charger tous les acteurs actifs au montage
    // On utilise directement fetchActors avec des filtres qui écrasent le state
    // Mais comme le state.filters peut contenir actorType, on doit le gérer différemment

    // Solution temporaire : appeler directement le use case pour bypass le store
    const loadAllActors = async () => {
      const getActorsUseCase = ActorServiceProvider.getGetActorsUseCase();
      const result = await getActorsUseCase.execute(
        {
          page: 1,
          per_page: 1000,
          status: "active",
          // actorType non spécifié = tous les types
        },
        true // isOnline
      );

      // Mettre à jour le store avec les résultats
      useActorStore.setState({
        actors: result.actors,
        meta: result.meta,
        filters: {
          page: 1,
          per_page: 1000,
          status: "active",
        },
      });
    };

    loadAllActors().catch(console.error);
  }, []);

  // IDs des occupants déjà associés
  const existingOccupantIds = useMemo(
    () => new Set((store?.occupants || []).map((o) => o.id)),
    [store?.occupants]
  );

  // Acteurs disponibles (non associés au magasin et actifs uniquement)
  const availableActors = useMemo(() => {
    return allActors.filter(
      (actor) => actor.status === "active" && !existingOccupantIds.has(actor.id)
    );
  }, [allActors, existingOccupantIds]);

  // Filtrage par recherche (nom, prénom, code ONCC)
  const filteredActors = useMemo(() => {
    if (!searchQuery.trim()) return availableActors;

    const query = searchQuery.toLowerCase();
    return availableActors.filter((actor) => {
      const fullName = `${actor.familyName} ${actor.givenName}`.toLowerCase();
      const onccId = actor.onccId?.toLowerCase() || "";
      const actorType = actor.actorType?.toLowerCase() || "";

      return (
        fullName.includes(query) ||
        onccId.includes(query) ||
        actorType.includes(query)
      );
    });
  }, [availableActors, searchQuery]);

  // Réinitialiser la pagination quand la recherche change
  useEffect(() => {
    setPaginationState((prev) => ({ ...prev, pageIndex: 0 }));
  }, [searchQuery]);

  // Pagination des résultats filtrés
  const paginatedActors = useMemo(() => {
    const startIndex = paginationState.pageIndex * paginationState.pageSize;
    const endIndex = startIndex + paginationState.pageSize;
    return filteredActors.slice(startIndex, endIndex);
  }, [filteredActors, paginationState]);

  // Métadonnées de pagination
  const paginationMeta = useMemo(() => {
    const totalPages = Math.ceil(
      filteredActors.length / paginationState.pageSize
    );
    const currentPage = paginationState.pageIndex + 1;

    return {
      currentPage,
      perPage: paginationState.pageSize,
      total: filteredActors.length,
      lastPage: totalPages,
      firstPage: 1,
      firstPageUrl: "",
      lastPageUrl: "",
      nextPageUrl: currentPage < totalPages ? "" : null,
      previousPageUrl: currentPage > 1 ? "" : null,
    };
  }, [filteredActors.length, paginationState]);

  // Gestion de la sélection
  const handleToggleOccupant = useCallback((actorId: string) => {
    setSelectedOccupants((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(actorId)) {
        newSet.delete(actorId);
      } else {
        newSet.add(actorId);
      }
      return newSet;
    });
  }, []);

  const handleToggleAll = useCallback(() => {
    if (selectedOccupants.size === paginatedActors.length) {
      setSelectedOccupants(new Set());
    } else {
      setSelectedOccupants(new Set(paginatedActors.map((a) => a.id)));
    }
  }, [selectedOccupants.size, paginatedActors]);

  // Ajout séquentiel des occupants
  const handleAddSelected = useCallback(async () => {
    if (!entityId || selectedOccupants.size === 0) return;

    setIsProcessing(true);
    const occupantsToAdd = Array.from(selectedOccupants);
    const totalCount = occupantsToAdd.length;
    let successCount = 0;
    let failureCount = 0;

    toast.info(
      t("occupants.manage.addingOccupants", {
        count: totalCount,
      })
    );

    const addOccupantUseCase = StoreServiceProvider.getAddOccupantUseCase();

    for (const actorId of occupantsToAdd) {
      // Marquer comme en cours d'ajout
      setAddingOccupants((prev) => new Set(prev).add(actorId));

      try {
        await addOccupantUseCase.execute(entityId, actorId, true);
        successCount++;

        // Toast de succès individuel
        const actor = availableActors.find((a) => a.id === actorId);
        if (actor) {
          toast.success(
            t("occupants.manage.occupantAdded", {
              name: `${actor.familyName} ${actor.givenName}`,
            })
          );
        }
      } catch (error) {
        console.error(
          `Erreur lors de l'ajout de l'occupant ${actorId}:`,
          error
        );
        failureCount++;

        const actor = availableActors.find((a) => a.id === actorId);
        if (actor) {
          toast.error(
            t("occupants.manage.occupantAddFailed", {
              name: `${actor.familyName} ${actor.givenName}`,
            })
          );
        }
      } finally {
        // Retirer du marqueur en cours
        setAddingOccupants((prev) => {
          const newSet = new Set(prev);
          newSet.delete(actorId);
          return newSet;
        });
      }
    }

    // Toast récapitulatif
    if (successCount > 0) {
      toast.success(
        t("occupants.manage.addedSummary", {
          success: successCount,
          total: totalCount,
        })
      );
    }

    if (failureCount > 0) {
      toast.error(
        t("occupants.manage.addFailedSummary", {
          failed: failureCount,
          total: totalCount,
        })
      );
    }

    // Réinitialiser et rafraîchir
    setSelectedOccupants(new Set());
    setIsProcessing(false);
    await refetchStore();

    // Rediriger vers la page de consultation du magasin
    if (successCount > 0) {
      router.push(`/stores/view?entityId=${entityId}`);
    }
  }, [entityId, selectedOccupants, availableActors, refetchStore, router, t]);

  const handleCancel = useCallback(() => {
    if (!entityId) return;
    router.push(`/stores/view?entityId=${entityId}`);
  }, [entityId, router]);

  // Colonnes du tableau
  const columns: ColumnDef<Actor>[] = [
    {
      id: "select",
      header: () => (
        <Checkbox
          checked={
            paginatedActors.length > 0 &&
            selectedOccupants.size === paginatedActors.length
          }
          onCheckedChange={handleToggleAll}
          aria-label={t("common:table.selectAll")}
          disabled={isProcessing}
        />
      ),
      cell: ({ row }) => {
        const actor = row.original;
        const isAdding = addingOccupants.has(actor.id);

        return (
          <Checkbox
            checked={selectedOccupants.has(actor.id)}
            onCheckedChange={() => handleToggleOccupant(actor.id)}
            aria-label={t("common:table.selected")}
            disabled={isProcessing || isAdding}
          />
        );
      },
    },
    {
      accessorKey: "fullName",
      header: t("occupants.manage.columns.name"),
      cell: ({ row }) => {
        const actor = row.original;
        const fullName =
          [actor.familyName, actor.givenName].filter(Boolean).join(" ") ||
          "---";
        return (
          <div className="flex flex-col">
            <span className="font-medium">{fullName}</span>
            {actor.actorType && (
              <span className="text-xs text-muted-foreground">
                {t(`actorTypes.${actor.actorType}`)}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "locationCode",
      header: t("occupants.manage.columns.location"),
      cell: ({ row }) =>
        row.original.locationCode ? (
          <HierarchyDisplay code={row.original.locationCode} />
        ) : (
          "---"
        ),
    },
  ];

  // Header avec titre
  const headerContent = (
    <div className="flex items-center space-x-3">
      <h1 className="text-xl font-medium text-gray-900">
        {t("occupants.manage.pageTitle")}
      </h1>
    </div>
  );

  // Boutons du footer
  const footerButtons = [
    <Button
      key="add"
      type="button"
      onClick={handleAddSelected}
      disabled={selectedOccupants.size === 0 || isProcessing}
      className="flex items-center space-x-2"
    >
      {isProcessing ? (
        <>
          <Icon name="Loader2" className="animate-spin" />
          <span>
            {t("occupants.manage.processing", {
              count: selectedOccupants.size,
            })}
          </span>
        </>
      ) : (
        <>
          <Icon name="PlusIcon" className="h-4 w-4" />
          <span>
            {t("occupants.manage.addSelected", {
              count: selectedOccupants.size,
            })}
          </span>
        </>
      )}
    </Button>,
  ];

  if (!entityId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">{t("missingEntityId")}</p>
      </div>
    );
  }

  return (
    <div className="py-3 lg:flex items-start lg:space-x-4">
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
              placeholder={t("occupants.manage.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              disabled={isProcessing}
            />
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {filteredActors.length} {t("occupants.manage.actorsAvailable")}
          </p>
        </div>

        <Separator className="my-4" />

        {/* Tableau des acteurs disponibles */}
        {filteredActors.length === 0 ? (
          <div className="text-center py-8">
            <Icon
              name="UsersIcon"
              className="h-12 w-12 text-gray-400 mx-auto mb-4"
            />
            <p className="text-sm text-muted-foreground">
              {searchQuery
                ? t("occupants.manage.noResultsForSearch", {
                    search: searchQuery,
                  })
                : t("occupants.manage.noAvailableActors")}
            </p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={paginatedActors}
            pagination={paginationMeta}
            onPaginationChange={setPaginationState}
            emptyMessage={t("occupants.manage.noAvailableActors")}
          />
        )}
      </BaseCard>
    </div>
  );
}
