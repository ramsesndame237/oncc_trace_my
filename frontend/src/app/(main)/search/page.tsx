"use client";

import { Icon } from "@/components/icon";
import { AppContent } from "@/components/layout/app-content";
import { USER_ROLES_CONSTANTS } from "@/core/domain/generated/user-roles.types";
import { useAuth } from "@/features/auth";
import { useCalendarStore } from "@/features/calendar/infrastructure/store/calendarStore";
import { CalendarList } from "@/features/calendar/presentation/components/CalendarList";
import { useConventionStore } from "@/features/convention/infrastructure/store/conventionStore";
import { ConventionList } from "@/features/convention/presentation/components/ConventionList";
import { useProductTransferStore } from "@/features/product-transfer/infrastructure/store/productTransferStore";
import { ProductTransferList } from "@/features/product-transfer/presentation/components/ProductTransferList";
import { useTransactionStore } from "@/features/transaction/infrastructure/store/transactionStore";
import { TransactionList } from "@/features/transaction/presentation/components/TransactionList";
import { useSearchParams } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

export default function GlobalSearchPage() {
  const { t } = useTranslation(["common"]);
  const searchParams = useSearchParams();
  const query = searchParams.get("search") || "";
  const searchType = searchParams.get("type") || "all"; // Type de recherche (all, conventions, transactions, calendars, productTransfers)
  const { user } = useAuth();

  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Récupérer les stores
  const conventionStore = useConventionStore();
  const transactionStore = useTransactionStore();
  const calendarStore = useCalendarStore();
  const productTransferStore = useProductTransferStore();

  // Vérifier les permissions pour les conventions
  const canViewConventions =
    user?.role === USER_ROLES_CONSTANTS.BASIN_ADMIN ||
    user?.role === USER_ROLES_CONSTANTS.FIELD_AGENT ||
    (user?.role === USER_ROLES_CONSTANTS.ACTOR_MANAGER &&
      ["BUYER", "PRODUCERS", "EXPORTER"].includes(
        user?.actor?.actorType || ""
      ));

  // Initialiser la recherche au montage
  useEffect(() => {
    if (query) {
      // Mettre à jour les filtres avec le paramètre de recherche
      // Si searchType = "all", rechercher dans tous les types
      // Sinon, rechercher uniquement dans le type spécifié

      if (searchType === "all" || searchType === "conventions") {
        // Conventions : uniquement pour les utilisateurs autorisés
        if (canViewConventions) {
          conventionStore.setFilters({ search: query, page: 1, per_page: 10 });
        }
      }

      if (searchType === "all" || searchType === "transactions") {
        transactionStore.setFilters({ search: query, page: 1, perPage: 10 });
      }

      if (searchType === "all" || searchType === "calendars") {
        calendarStore.setFilters({ search: query, page: 1, per_page: 10 });
      }

      if (searchType === "all" || searchType === "productTransfers") {
        productTransferStore.setFilters({ search: query, page: 1, per_page: 10 });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, searchType]);

  useEffect(() => {
    // Marquer que le chargement initial est terminé après un délai pour laisser le store se charger
    const timer = setTimeout(() => {
      setIsInitialLoad(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const tabContent = useMemo(() => {
    const tabs: Array<{
      title: string;
      key: string;
      content: React.ReactNode;
    }> = [];

    // Ne créer les tabs que si on a chargé les données initiales
    if (!isInitialLoad) {
      // Tab Conventions - afficher seulement si type = "all" ou "conventions", s'il y a des résultats et permissions
      if (
        (searchType === "all" || searchType === "conventions") &&
        canViewConventions &&
        conventionStore.meta &&
        conventionStore.meta.total > 0
      ) {
        tabs.push({
          title: `${t("common:search.types.conventions")} (${
            conventionStore.meta.total
          })`,
          key: "conventions",
          content: <ConventionList hiddenSearch />,
        });
      }

      // Tab Transactions - afficher seulement si type = "all" ou "transactions", s'il y a des résultats
      if (
        (searchType === "all" || searchType === "transactions") &&
        transactionStore.meta &&
        transactionStore.meta.total > 0
      ) {
        tabs.push({
          title: `${t("common:search.types.transactions")} (${
            transactionStore.meta.total
          })`,
          key: "transactions",
          content: <TransactionList />,
        });
      }

      // Tab Calendriers - afficher seulement si type = "all" ou "calendars", s'il y a des résultats
      if (
        (searchType === "all" || searchType === "calendars") &&
        calendarStore.meta &&
        calendarStore.meta.total > 0
      ) {
        tabs.push({
          title: `${t("common:search.types.calendars")} (${
            calendarStore.meta.total
          })`,
          key: "calendars",
          content: <CalendarList />,
        });
      }

      // Tab Transferts de produits - afficher seulement si type = "all" ou "productTransfers", s'il y a des résultats
      if (
        (searchType === "all" || searchType === "productTransfers") &&
        productTransferStore.meta &&
        productTransferStore.meta.total > 0
      ) {
        tabs.push({
          title: `${t("common:search.types.productTransfers")} (${
            productTransferStore.meta.total
          })`,
          key: "productTransfers",
          content: <ProductTransferList />,
        });
      }
    }

    return tabs;
  }, [
    t,
    isInitialLoad,
    searchType,
    conventionStore.meta,
    transactionStore.meta,
    calendarStore.meta,
    productTransferStore.meta,
    canViewConventions,
  ]);

  // Générer le titre en fonction du type de recherche
  const getSearchTitle = () => {
    let typeLabel = "";
    switch (searchType) {
      case "conventions":
        typeLabel = t("common:search.types.conventions");
        break;
      case "transactions":
        typeLabel = t("common:search.types.transactions");
        break;
      case "calendars":
        typeLabel = t("common:search.types.calendars");
        break;
      case "productTransfers":
        typeLabel = t("common:search.types.productTransfers");
        break;
      default:
        typeLabel = "";
    }

    if (typeLabel) {
      return `${t("common:search.title")} ${typeLabel} : "${query}"`;
    }
    return `${t("common:search.title")} : "${query}"`;
  };

  return (
    <AppContent
      title={getSearchTitle()}
      icon={<Icon name="Search" />}
      tabContent={tabContent.length > 0 ? tabContent : undefined}
      defautValue={tabContent.length > 0 ? tabContent[0].key : undefined}
      listContent
    >
      {isInitialLoad && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mb-4"></div>
          <p className="text-lg text-muted-foreground">Recherche en cours...</p>
        </div>
      )}

      {tabContent.length === 0 && !isInitialLoad && (
        <div className="flex flex-col items-center justify-center py-12">
          <Icon
            name="Search"
            className="h-16 w-16 text-muted-foreground mb-4"
          />
          <p className="text-lg text-muted-foreground">
            Aucun résultat trouvé pour &ldquo;{query}&rdquo;
          </p>
        </div>
      )}
    </AppContent>
  );
}
