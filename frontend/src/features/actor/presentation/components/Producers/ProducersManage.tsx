"use client";

import { Icon } from "@/components/icon";
import { BaseCard } from "@/components/modules/base-card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useActorStore } from "../../../infrastructure/store/actorStore";
import { useGetActorById } from "../../hooks/useGetActorById";
import ProducersFormLayout from "./ProducersFormLayout";

interface Producer {
  id: string;
  actorType: string;
  familyName: string;
  givenName: string;
  phone?: string;
  email?: string;
  onccId?: string;
  identifiantId?: string;
  locationCode: string;
  status?: string;
}

export default function ProducersManage() {
  const { t } = useTranslation(["actor", "common"]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const entityId = searchParams.get("entityId");
  const returnTo = searchParams.get("returnTo");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProducers, setSelectedProducers] = useState<Set<string>>(
    new Set()
  );
  const [addingProducers, setAddingProducers] = useState<Set<string>>(
    new Set()
  );
  const [isProcessing, setIsProcessing] = useState(false);

  // État de pagination local
  const [paginationState, setPaginationState] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  // Récupérer les informations de l'OPA
  const { actor: opa, refetch: refetchOpa } = useGetActorById(entityId || "");

  // Récupérer tous les producteurs depuis le store
  const { actors: allProducers, fetchActors } = useActorStore();

  useEffect(() => {
    // Charger tous les producteurs au montage
    fetchActors({
      actorType: "PRODUCER",
      status: "active",
      per_page: 1000, // Récupérer tous les producteurs actifs
    });
  }, [fetchActors]);

  // Construire le nom complet de l'OPA
  const opaName = useMemo(() => {
    if (!opa) return "OPA";

    return (
      [opa.givenName, opa.familyName].filter(Boolean).join(" ") ||
      opa.onccId ||
      opa.identifiantId ||
      "OPA"
    );
  }, [opa]);

  // Filtrer les producteurs déjà associés
  const existingProducerIds = useMemo(
    () => new Set((opa?.producers || []).map((p) => p.id)),
    [opa?.producers]
  );

  // Producteurs disponibles (non associés à l'OPA et actifs uniquement)
  const availableProducers = useMemo(() => {
    return allProducers.filter(
      (producer) =>
        producer.actorType === "PRODUCER" &&
        producer.status === "active" &&
        !existingProducerIds.has(producer.id)
    );
  }, [allProducers, existingProducerIds]);

  // Filtrage par recherche (nom, prénom, code ONCC uniquement)
  const filteredProducers = useMemo(() => {
    if (!searchQuery.trim()) return availableProducers;

    const query = searchQuery.toLowerCase();
    return availableProducers.filter((producer) => {
      const fullName =
        `${producer.familyName} ${producer.givenName}`.toLowerCase();
      const onccId = producer.onccId?.toLowerCase() || "";

      return fullName.includes(query) || onccId.includes(query);
    });
  }, [availableProducers, searchQuery]);

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
    setSelectedProducers((prev) => {
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
    if (selectedProducers.size === paginatedProducers.length) {
      setSelectedProducers(new Set());
    } else {
      setSelectedProducers(new Set(paginatedProducers.map((p) => p.id)));
    }
  }, [selectedProducers.size, paginatedProducers]);

  // Ajout séquentiel des producteurs
  const handleAddSelected = useCallback(async () => {
    if (!entityId || selectedProducers.size === 0) return;

    setIsProcessing(true);
    const producersToAdd = Array.from(selectedProducers);
    const totalCount = producersToAdd.length;
    let successCount = 0;
    let failureCount = 0;

    toast.info(
      t("producers.addingProducers", {
        count: totalCount,
      })
    );

    for (const producerId of producersToAdd) {
      // Marquer comme en cours d'ajout
      setAddingProducers((prev) => new Set(prev).add(producerId));

      try {
        const { addProducerToOpa } = useActorStore.getState();
        await addProducerToOpa(
          entityId,
          producerId
        );
        successCount++;

        // Toast de succès individuel
        const producer = availableProducers.find((p) => p.id === producerId);
        if (producer) {
          toast.success(
            t("producers.producerAdded", {
              name: `${producer.familyName} ${producer.givenName}`,
            })
          );
        }
      } catch (error) {
        console.error(
          `Erreur lors de l'ajout du producteur ${producerId}:`,
          error
        );
        failureCount++;

        const producer = availableProducers.find((p) => p.id === producerId);
        if (producer) {
          toast.error(
            t("producers.producerAddFailed", {
              name: `${producer.familyName} ${producer.givenName}`,
            })
          );
        }
      } finally {
        // Retirer du marqueur en cours
        setAddingProducers((prev) => {
          const newSet = new Set(prev);
          newSet.delete(producerId);
          return newSet;
        });
      }
    }

    // Toast récapitulatif
    if (successCount > 0) {
      toast.success(
        t("producers.addedSummary", {
          success: successCount,
          total: totalCount,
        })
      );
    }

    if (failureCount > 0) {
      toast.error(
        t("producers.addFailedSummary", {
          failed: failureCount,
          total: totalCount,
        })
      );
    }

    // Réinitialiser et rafraîchir
    setSelectedProducers(new Set());
    setIsProcessing(false);
    await refetchOpa();
    await fetchActors({
      actorType: "PRODUCER",
      status: "active",
      per_page: 1000,
    });

    // Rediriger vers la page de retour après l'ajout réussi
    if (successCount > 0) {
      const redirectUrl = returnTo || `/actors/producers/view?entityId=${entityId}`;
      router.push(redirectUrl);
    }
  }, [
    entityId,
    selectedProducers,
    availableProducers,
    refetchOpa,
    fetchActors,
    t,
    router,
    returnTo,
  ]);

  const handleCancel = useCallback(() => {
    if (!entityId) return;
    const redirectUrl = returnTo || `/actors/producers/view?entityId=${entityId}`;
    router.push(redirectUrl);
  }, [entityId, router, returnTo]);

  // Colonnes du tableau
  const columns: ColumnDef<Producer>[] = [
    {
      id: "select",
      header: () => (
        <Checkbox
          checked={
            paginatedProducers.length > 0 &&
            selectedProducers.size === paginatedProducers.length
          }
          onCheckedChange={handleToggleAll}
          aria-label={t("common:table.selectAll")}
          disabled={isProcessing}
        />
      ),
      cell: ({ row }) => {
        const producer = row.original;
        const isAdding = addingProducers.has(producer.id);

        return (
          <Checkbox
            checked={selectedProducers.has(producer.id)}
            onCheckedChange={() => handleToggleProducer(producer.id)}
            aria-label={t("common:table.selected")}
            disabled={isProcessing || isAdding}
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
        const isAdding = addingProducers.has(producer.id);

        return (
          <div className="flex items-center space-x-3 px-2">
            <Icon name="UserIcon" className="h-4 w-4 text-gray-500" />
            <div className={isAdding ? "opacity-50" : ""}>
              <p className="text-sm font-medium text-gray-700">{fullName}</p>
              {producer.onccId && (
                <p className="text-xs text-gray-500">
                  {t("producersTable.columns.onccId")}: {producer.onccId}
                </p>
              )}
              {isAdding && (
                <p className="text-xs text-blue-600">
                  {t("producers.adding")}...
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
        {t("producers.manageProducersTitle")}
      </h1>
    </div>
  );

  // Boutons du footer
  const footerButtons = [
    <Button
      key="add"
      type="button"
      onClick={handleAddSelected}
      disabled={selectedProducers.size === 0 || isProcessing}
      className="flex items-center space-x-2"
    >
      {isProcessing ? (
        <>
          <Icon name="Loader2" className="animate-spin" />
          <span>
            {t("producers.processing", {
              count: selectedProducers.size,
            })}
          </span>
        </>
      ) : (
        <>
          <Icon name="PlusIcon" className="h-4 w-4" />
          <span>
            {t("producers.addSelected", {
              count: selectedProducers.size,
            })}
          </span>
        </>
      )}
    </Button>,
  ];

  if (!entityId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">
          {t("producers.missingEntityId")}
        </p>
      </div>
    );
  }

  return (
    <ProducersFormLayout
      className="lg:flex items-start lg:space-x-4"
      title={`${t("producers.manageProducersTitle")}: ${opaName}`}
      onHandleCancel={handleCancel}
    >
      <div className="py-3">
        <Button variant="link" onClick={handleCancel}>
          <Icon name="ArrowLeft" />
          <span>{t("form.back")}</span>
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
              placeholder={t("producers.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              disabled={isProcessing}
            />
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {t("producers.availableCount", {
              count: filteredProducers.length,
            })}
          </p>
        </div>

        <Separator className="my-4" />

        {/* Tableau des producteurs disponibles */}
        {filteredProducers.length === 0 ? (
          <div className="text-center py-8">
            <Icon
              name="UsersIcon"
              className="h-12 w-12 text-gray-400 mx-auto mb-4"
            />
            <p className="text-sm text-muted-foreground">
              {searchQuery
                ? t("producers.noResultsFound")
                : t("producers.noAvailableProducers")}
            </p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={paginatedProducers}
            pagination={paginationMeta}
            onPaginationChange={setPaginationState}
            emptyMessage={t("producers.noAvailableProducers")}
          />
        )}
      </BaseCard>
    </ProducersFormLayout>
  );
}
