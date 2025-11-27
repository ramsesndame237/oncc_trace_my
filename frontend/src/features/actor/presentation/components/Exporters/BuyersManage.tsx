"use client";

import { Icon } from "@/components/icon";
import { BaseCard } from "@/components/modules/base-card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { CampaignServiceProvider } from "@/features/campaign/infrastructure/di/campaignServiceProvider";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useActorStore } from "../../../infrastructure/store/actorStore";
import { useGetActorById } from "../../hooks/useGetActorById";
import ExportersFormLayout from "./ExportersFormLayout";

interface Buyer {
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
  mandators?: Array<{
    id: string;
    familyName: string;
    givenName: string;
    onccId?: string;
    mandateDate?: string | null;
    status?: string;
    campaignId?: string | null;
  }>;
}

export default function BuyersManage() {
  const { t } = useTranslation(["actor", "common"]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const entityId = searchParams.get("entityId");
  const returnTo = searchParams.get("returnTo");
  const isOnline = useOnlineStatus();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBuyers, setSelectedBuyers] = useState<Set<string>>(new Set());
  const [addingBuyers, setAddingBuyers] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeCampaignId, setActiveCampaignId] = useState<string | null>(null);

  // État de pagination local
  const [paginationState, setPaginationState] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  // Récupérer les informations de l'exportateur
  const { actor: exporter, refetch: refetchExporter } = useGetActorById(
    entityId || ""
  );

  // Récupérer tous les acheteurs mandataires depuis le store
  const { actors: allBuyers, fetchActors } = useActorStore();

  // Charger la campagne active
  useEffect(() => {
    const loadActiveCampaign = async () => {
      try {
        const getActiveCampaignUseCase =
          CampaignServiceProvider.getGetActiveCampaignUseCase();
        const activeCampaign = await getActiveCampaignUseCase.execute(isOnline);
        if (activeCampaign) {
          setActiveCampaignId(activeCampaign.id);
        }
      } catch (error) {
        console.error("Error loading active campaign:", error);
      }
    };
    loadActiveCampaign();
  }, [isOnline]);

  useEffect(() => {
    // Charger tous les acheteurs mandataires au montage
    fetchActors({
      actorType: "BUYER",
      status: "active",
      per_page: 1000, // Récupérer tous les acheteurs actifs
    });
  }, [fetchActors]);

  // Construire le nom complet de l'exportateur
  const exporterName = useMemo(() => {
    if (!exporter) return "Exportateur";

    return (
      [exporter.givenName, exporter.familyName].filter(Boolean).join(" ") ||
      exporter.onccId ||
      exporter.identifiantId ||
      "Exportateur"
    );
  }, [exporter]);

  // Filtrer les acheteurs déjà associés
  const existingBuyerIds = useMemo(
    () => new Set((exporter?.buyers || []).map((b: Buyer) => b.id)),
    [exporter?.buyers]
  );

  // Acheteurs disponibles (non associés à l'exportateur, actifs, et non mandataires pour un autre exportateur dans la campagne en cours)
  const availableBuyers = useMemo(() => {
    return allBuyers.filter((buyer) => {
      // Vérifier que c'est bien un acheteur actif non déjà associé
      if (
        buyer.actorType !== "BUYER" ||
        buyer.status !== "active" ||
        existingBuyerIds.has(buyer.id)
      ) {
        return false;
      }

      // Vérifier que l'acheteur n'est pas déjà mandataire pour un autre exportateur dans la campagne en cours
      if (activeCampaignId && buyer.mandators && buyer.mandators.length > 0) {
        const hasOtherMandatorInCurrentCampaign = buyer.mandators.filter(
          (mandator) =>
            mandator.campaignId === activeCampaignId && mandator.id !== entityId // Exclure l'exportateur actuel
        );
        if (hasOtherMandatorInCurrentCampaign.length > 0) {
          return false;
        }
      }

      return true;
    });
  }, [allBuyers, existingBuyerIds, activeCampaignId, entityId]);

  // Filtrage par recherche (nom, prénom, code ONCC uniquement)
  const filteredBuyers = useMemo(() => {
    if (!searchQuery.trim()) return availableBuyers;

    const query = searchQuery.toLowerCase();
    return availableBuyers.filter((buyer) => {
      const fullName = `${buyer.familyName} ${buyer.givenName}`.toLowerCase();
      const onccId = buyer.onccId?.toLowerCase() || "";

      return fullName.includes(query) || onccId.includes(query);
    });
  }, [availableBuyers, searchQuery]);

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
    setSelectedBuyers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(buyerId)) {
        newSet.delete(buyerId);
      } else {
        newSet.add(buyerId);
      }
      return newSet;
    });
  }, []);

  const handleToggleAll = useCallback(() => {
    if (selectedBuyers.size === paginatedBuyers.length) {
      setSelectedBuyers(new Set());
    } else {
      setSelectedBuyers(new Set(paginatedBuyers.map((b) => b.id)));
    }
  }, [selectedBuyers.size, paginatedBuyers]);

  // Ajout séquentiel des acheteurs
  const handleAddSelected = useCallback(async () => {
    if (!entityId || selectedBuyers.size === 0) return;

    setIsProcessing(true);
    const buyersToAdd = Array.from(selectedBuyers);
    const totalCount = buyersToAdd.length;
    let successCount = 0;
    let failureCount = 0;

    toast.info(
      t("exporter.addingBuyers", {
        count: totalCount,
      })
    );

    for (const buyerId of buyersToAdd) {
      // Marquer comme en cours d'ajout
      setAddingBuyers((prev) => new Set(prev).add(buyerId));

      try {
        const { addBuyerToExporter } = useActorStore.getState();
        await addBuyerToExporter(
          entityId,
          buyerId
        );
        successCount++;

        // Toast de succès individuel
        const buyer = availableBuyers.find((b) => b.id === buyerId);
        if (buyer) {
          toast.success(
            t("exporter.buyerAdded", {
              name: `${buyer.familyName} ${buyer.givenName}`,
            })
          );
        }
      } catch (error) {
        console.error(
          `Erreur lors de l'ajout de l'acheteur ${buyerId}:`,
          error
        );
        failureCount++;

        const buyer = availableBuyers.find((b) => b.id === buyerId);
        if (buyer) {
          toast.error(
            t("exporter.buyerAddFailed", {
              name: `${buyer.familyName} ${buyer.givenName}`,
            })
          );
        }
      } finally {
        // Retirer du marqueur en cours
        setAddingBuyers((prev) => {
          const newSet = new Set(prev);
          newSet.delete(buyerId);
          return newSet;
        });
      }
    }

    // Toast récapitulatif
    if (successCount > 0) {
      toast.success(
        t("exporter.addedSummary", {
          success: successCount,
          total: totalCount,
        })
      );
    }

    if (failureCount > 0) {
      toast.error(
        t("exporter.addFailedSummary", {
          failed: failureCount,
          total: totalCount,
        })
      );
    }

    // Réinitialiser et rafraîchir
    setSelectedBuyers(new Set());
    setIsProcessing(false);
    await refetchExporter();
    await fetchActors({
      actorType: "BUYER",
      status: "active",
      per_page: 1000,
    });

    // Rediriger vers la page de retour après l'ajout réussi
    if (successCount > 0) {
      const redirectUrl = returnTo || `/actors/exporters/view?entityId=${entityId}`;
      router.push(redirectUrl);
    }
  }, [
    entityId,
    selectedBuyers,
    availableBuyers,
    refetchExporter,
    fetchActors,
    t,
    router,
    returnTo,
  ]);

  const handleCancel = useCallback(() => {
    if (!entityId) return;
    const redirectUrl = returnTo || `/actors/exporters/view?entityId=${entityId}`;
    router.push(redirectUrl);
  }, [entityId, router, returnTo]);

  // Colonnes du tableau
  const columns: ColumnDef<Buyer>[] = [
    {
      id: "select",
      header: () => (
        <Checkbox
          checked={
            paginatedBuyers.length > 0 &&
            selectedBuyers.size === paginatedBuyers.length
          }
          onCheckedChange={handleToggleAll}
          aria-label={t("common:table.selectAll")}
          disabled={isProcessing}
        />
      ),
      cell: ({ row }) => {
        const buyer = row.original;
        const isAdding = addingBuyers.has(buyer.id);

        return (
          <Checkbox
            checked={selectedBuyers.has(buyer.id)}
            onCheckedChange={() => handleToggleBuyer(buyer.id)}
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
          {t("buyersTable.columns.fullName")}
        </span>
      ),
      cell: ({ row }) => {
        const buyer = row.original;
        const fullName = `${buyer.familyName} ${buyer.givenName}`;
        const isAdding = addingBuyers.has(buyer.id);

        return (
          <div className="flex items-center space-x-3 px-2">
            <Icon name="UserIcon" className="h-4 w-4 text-gray-500" />
            <div className={isAdding ? "opacity-50" : ""}>
              <p className="text-sm font-medium text-gray-700">{fullName}</p>
              {buyer.onccId && (
                <p className="text-xs text-gray-500">
                  {t("buyersTable.columns.onccId")}: {buyer.onccId}
                </p>
              )}
              {isAdding && (
                <p className="text-xs text-blue-600">
                  {t("exporter.adding")}...
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
        {t("exporter.manageBuyersTitle")}
      </h1>
    </div>
  );

  // Boutons du footer
  const footerButtons = [
    <Button
      key="add"
      type="button"
      onClick={handleAddSelected}
      disabled={selectedBuyers.size === 0 || isProcessing}
      className="flex items-center space-x-2"
    >
      {isProcessing ? (
        <>
          <Icon name="Loader2" className="animate-spin" />
          <span>
            {t("exporter.processing", {
              count: selectedBuyers.size,
            })}
          </span>
        </>
      ) : (
        <>
          <Icon name="PlusIcon" className="h-4 w-4" />
          <span>
            {t("exporter.addSelected", {
              count: selectedBuyers.size,
            })}
          </span>
        </>
      )}
    </Button>,
  ];

  if (!entityId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">{t("exporter.missingEntityId")}</p>
      </div>
    );
  }

  return (
    <ExportersFormLayout
      className="lg:flex items-start lg:space-x-4"
      title={`${t("exporter.manageBuyersTitle")}: ${exporterName}`}
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
              placeholder={t("exporter.searchBuyersPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              disabled={isProcessing}
            />
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {t("exporter.availableBuyersCount", {
              count: filteredBuyers.length,
            })}
          </p>
        </div>

        <Separator className="my-4" />

        {/* Tableau des acheteurs disponibles */}
        {filteredBuyers.length === 0 ? (
          <div className="text-center py-8">
            <Icon
              name="UsersIcon"
              className="h-12 w-12 text-gray-400 mx-auto mb-4"
            />
            <p className="text-sm text-muted-foreground">
              {searchQuery
                ? t("exporter.noResultsFound")
                : t("exporter.noAvailableBuyers")}
            </p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={paginatedBuyers}
            pagination={paginationMeta}
            onPaginationChange={setPaginationState}
            emptyMessage={t("exporter.noAvailableBuyers")}
          />
        )}
      </BaseCard>
    </ExportersFormLayout>
  );
}
