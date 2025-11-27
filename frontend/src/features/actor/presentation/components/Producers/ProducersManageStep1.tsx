"use client";

import { Icon } from "@/components/icon";
import { BaseCard } from "@/components/modules/base-card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { db, type OfflineActorData } from "@/core/infrastructure/database/db";
import { useOPAManageFormStore } from "@/features/actor/infrastructure/store/opaManageFormStore";
import ProducersFormLayout from "@/features/actor/presentation/components/Producers/ProducersFormLayout";
import { useOPAManageFormNavigation } from "@/features/actor/presentation/hooks/useOPAManageFormNavigation";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

export default function ProducersManageStep1() {
  const { t } = useTranslation(["actor", "common"]);
  const router = useRouter();

  const { formData, updateStep1Data, setStepValidation, setCurrentStep } =
    useOPAManageFormStore();

  const { navigateToNext, handleCancel } = useOPAManageFormNavigation();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOPAId, setSelectedOPAId] = useState<string | null>(
    formData.step1.selectedOPAId
  );
  const [isNavigating, setIsNavigating] = useState(false);
  const [allOPAs, setAllOPAs] = useState<OfflineActorData[]>([]);
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

  // Charger les OPAs depuis IndexedDB
  useEffect(() => {
    const loadOPAs = async () => {
      setIsLoading(true);
      try {
        // Récupérer tous les acteurs de type PRODUCERS (OPA) actifs
        const opas = await db.actors
          .where("actorType")
          .equals("PRODUCERS")
          .filter((actor) => actor.status === "active")
          .toArray();

        setAllOPAs(opas);
      } catch (error) {
        console.error(
          "Erreur lors du chargement des OPAs depuis IndexedDB:",
          error
        );
        setAllOPAs([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadOPAs();
  }, []);

  // Marquer l'étape comme active
  useEffect(() => {
    setCurrentStep(1);
  }, [setCurrentStep]);

  // Filtrage par recherche
  const filteredOPAs = useMemo(() => {
    if (!searchQuery.trim()) return allOPAs;

    const query = searchQuery.toLowerCase();
    return allOPAs.filter((opa) => {
      const fullName = `${opa.familyName} ${opa.givenName}`.toLowerCase();
      const onccId = opa.onccId?.toLowerCase() || "";

      return fullName.includes(query) || onccId.includes(query);
    });
  }, [allOPAs, searchQuery]);

  // Réinitialiser la pagination quand la recherche change
  useEffect(() => {
    setPaginationState((prev) => ({ ...prev, pageIndex: 0 }));
  }, [searchQuery]);

  // Pagination des résultats filtrés
  const paginatedOPAs = useMemo(() => {
    const startIndex = paginationState.pageIndex * paginationState.pageSize;
    const endIndex = startIndex + paginationState.pageSize;
    return filteredOPAs.slice(startIndex, endIndex);
  }, [filteredOPAs, paginationState]);

  // Métadonnées de pagination
  const paginationMeta = useMemo(() => {
    const totalPages = Math.ceil(
      filteredOPAs.length / paginationState.pageSize
    );
    const currentPage = paginationState.pageIndex + 1;

    return {
      currentPage,
      perPage: paginationState.pageSize,
      total: filteredOPAs.length,
      lastPage: totalPages,
      firstPage: 1,
      firstPageUrl: "",
      lastPageUrl: "",
      nextPageUrl: currentPage < totalPages ? "" : null,
      previousPageUrl: currentPage > 1 ? "" : null,
    };
  }, [filteredOPAs.length, paginationState]);

  // Gestion de la sélection unique
  const handleSelectOPA = useCallback(
    (opaId: string) => {
      setSelectedOPAId(opaId);
      updateStep1Data({ selectedOPAId: opaId });
      setStepValidation("step1", true);
    },
    [updateStep1Data, setStepValidation]
  );

  const handleNext = useCallback(() => {
    if (!selectedOPAId || isNavigating) return;

    setIsNavigating(true);
    // Naviguer vers l'étape suivante
    navigateToNext(1);
  }, [selectedOPAId, isNavigating, navigateToNext]);

  const handleBack = () => {
    router.push("/actors/producers/choice");
  };

  // Colonnes du tableau
  const columns: ColumnDef<OfflineActorData>[] = [
    {
      id: "select",
      header: "",
      cell: ({ row }) => {
        const opa = row.original;
        const opaId = opa.serverId || opa.localId;
        return (
          <div className="flex items-center justify-center">
            <RadioGroupItem
              value={opaId || ""}
              id={`opa-${opaId}`}
              onClick={() => opaId && handleSelectOPA(opaId)}
            />
          </div>
        );
      },
    },
    {
      accessorKey: "fullName",
      header: t("producers.manage.columns.name"),
      cell: ({ row }) => {
        const opa = row.original;
        const fullName =
          [opa.familyName, opa.givenName].filter(Boolean).join(" ") || "---";
        return (
          <div className="flex flex-col">
            <span className="font-medium">{fullName}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "onccId",
      header: t("producers.manage.columns.location"),
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
      <Button onClick={handleNext} disabled={!selectedOPAId || isNavigating}>
        {t("common:actions.next")}
      </Button>
    </div>
  );

  const headerContent = (
    <div className="flex flex-col space-y-2">
      <h1 className="text-xl font-medium text-gray-900">
        {t("producers.manage.selectOPA")}
      </h1>
    </div>
  );

  return (
    <ProducersFormLayout
      className="lg:flex items-start lg:space-x-4"
      title={t("producers.manage.title")}
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
              placeholder={t("producers.manage.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              disabled={isLoading}
            />
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {filteredOPAs.length} {t("producers.manage.opasAvailable")}
          </p>
        </div>

        <Separator className="my-4" />

        {/* Tableau des OPAs disponibles */}
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
        ) : filteredOPAs.length === 0 ? (
          <div className="text-center py-8">
            <Icon
              name="OpaIcon"
              className="h-12 w-12 text-gray-400 mx-auto mb-4"
            />
            <p className="text-sm text-muted-foreground">
              {searchQuery
                ? t("producers.manage.noResultsForSearch", {
                    search: searchQuery,
                  })
                : t("producers.manage.noAvailableOPAs")}
            </p>
          </div>
        ) : (
          <RadioGroup value={selectedOPAId || ""}>
            <DataTable
              columns={columns}
              data={paginatedOPAs}
              pagination={paginationMeta}
              onPaginationChange={setPaginationState}
              emptyMessage={t("producers.manage.noAvailableOPAs")}
            />
          </RadioGroup>
        )}
      </BaseCard>
    </ProducersFormLayout>
  );
}
