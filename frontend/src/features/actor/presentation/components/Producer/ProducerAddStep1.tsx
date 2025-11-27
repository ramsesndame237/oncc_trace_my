"use client";

import { Icon } from "@/components/icon";
import { BaseCard } from "@/components/modules/base-card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { db, OfflineActorData } from "@/core/infrastructure/database/db";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useProducerAddFormStore } from "../../../infrastructure/store/producerAddFormStore";
import { useProducerAddFormNavigation } from "../../hooks/useProducerAddFormNavigation";
import ProducerFormLayout from "./ProducerFormLayout";

export default function ProducerAddStep1() {
  const { t } = useTranslation(["actor", "common"]);
  const router = useRouter();

  const { formData, updateStep1Data, setStepValidation, setCurrentStep } =
    useProducerAddFormStore();
  const { navigateToNext, handleCancel } = useProducerAddFormNavigation();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProducer, setSelectedProducer] = useState<string | null>(
    formData.step1.selectedProducerId
  );
  const [isNavigating, setIsNavigating] = useState(false);

  // Réinitialiser isNavigating quand le composant est monté (après PinGuard par exemple)
  useEffect(() => {
    setIsNavigating(false);
  }, []);

  // État de pagination local
  const [paginationState, setPaginationState] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  // État local pour stocker les producteurs depuis IndexedDB
  const [allActors, setAllActors] = useState<OfflineActorData[]>([]);

  useEffect(() => {
    // Charger tous les producteurs actifs depuis la base de données locale
    const loadProducersFromLocalDB = async () => {
      try {
        const producers = await db.actors
          .where("actorType")
          .equals("PRODUCER")
          .and((actor) => actor.status === "active")
          .toArray();

        setAllActors(producers);
      } catch (error) {
        console.error(
          "Erreur lors du chargement des producteurs depuis la DB locale:",
          error
        );
        setAllActors([]);
      }
    };

    loadProducersFromLocalDB();
  }, []);

  // Filtrer les producteurs (ceux qui n'ont pas encore de bassin de production)
  // TODO: Ajouter la logique pour filtrer les producteurs déjà dans un bassin
  const availableProducers = useMemo(() => {
    return allActors;
  }, [allActors]);

  // Filtrage par recherche
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

  // Initialiser l'étape courante
  useEffect(() => {
    setCurrentStep(1);
  }, [setCurrentStep]);

  // Gestion de la sélection unique
  const handleSelectProducer = useCallback(
    (producerId: string) => {
      setSelectedProducer(producerId);
      updateStep1Data({ selectedProducerId: producerId });
      setStepValidation("step1", true);
    },
    [updateStep1Data, setStepValidation]
  );

  const handleNext = useCallback(() => {
    if (!selectedProducer || isNavigating) return;

    setIsNavigating(true);
    // Naviguer vers l'étape suivante
    navigateToNext(1);
  }, [selectedProducer, isNavigating, navigateToNext]);

  // Colonnes du tableau
  const columns: ColumnDef<OfflineActorData>[] = [
    {
      id: "select",
      header: "",
      cell: ({ row }) => {
        const producer = row.original;
        // Utiliser serverId si disponible (producteur synced), sinon localId (producteur offline)
        const producerId = producer.serverId || producer.localId;
        return (
          <div className="flex items-center justify-center">
            <RadioGroupItem
              value={producerId || ""}
              id={`producer-${producerId}`}
              onClick={() => handleSelectProducer(producerId || "")}
            />
          </div>
        );
      },
    },
    {
      accessorKey: "fullName",
      header: t("producer.add.columns.name"),
      cell: ({ row }) => {
        const producer = row.original;
        const fullName =
          [producer.familyName, producer.givenName].filter(Boolean).join(" ") ||
          "---";
        return (
          <div className="flex flex-col">
            <span className="font-medium">{fullName}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "onccId",
      header: t("producer.add.columns.onccId"),
      cell: ({ row }) => {
        const onccId = row.original.onccId;
        return onccId ? (
          <span className="font-mono text-sm">{onccId}</span>
        ) : (
          <span className="text-muted-foreground">---</span>
        );
      },
    },
  ];

  const handleBack = () => {
    router.push("/actors/producer/choice");
  };

  const footerButtons = (
    <div className="flex justify-end space-x-3">
      <Button onClick={handleNext} disabled={!selectedProducer || isNavigating}>
        {t("common:actions.next")}
      </Button>
    </div>
  );

  const headerContent = (
    <div className="flex items-center space-x-3">
      <h1 className="text-xl font-medium text-gray-900">
        {t("producer.add.subtitle")}
      </h1>
    </div>
  );

  return (
    <ProducerFormLayout
      className="lg:flex items-start lg:space-x-4"
      onHandleCancel={handleCancel}
      title={t("producer.add.title")}
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
              placeholder={t("producer.add.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {filteredProducers.length} {t("producer.add.producersAvailable")}
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
                ? t("producer.add.noResultsForSearch", {
                    search: searchQuery,
                  })
                : t("producer.add.noAvailableProducers")}
            </p>
          </div>
        ) : (
          <RadioGroup value={selectedProducer || ""}>
            <DataTable
              columns={columns}
              data={paginatedProducers}
              pagination={paginationMeta}
              onPaginationChange={setPaginationState}
              emptyMessage={t("producer.add.noAvailableProducers")}
            />
          </RadioGroup>
        )}
      </BaseCard>
    </ProducerFormLayout>
  );
}
