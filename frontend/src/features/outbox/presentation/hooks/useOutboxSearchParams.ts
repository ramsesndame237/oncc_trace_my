"use client";

import { parseAsInteger, parseAsString, useQueryStates } from "nuqs";

const searchParamsParsers = {
  // Pagination
  page: parseAsInteger.withDefault(1),
  per_page: parseAsInteger.withDefault(10),

  // Filtres de recherche
  search: parseAsString.withDefault(""),
  entityType: parseAsString.withDefault(""),
  operation: parseAsString.withDefault(""),
  status: parseAsString.withDefault("all"),
  dateFrom: parseAsString.withDefault(""),
  dateTo: parseAsString.withDefault(""),

  // Tri
  sort_by: parseAsString.withDefault("timestamp"),
  sort_order: parseAsString.withDefault("desc"),
} as const;

/**
 * Options de configuration pour nuqs
 */
const searchParamsOptions = {
  // Supprime les paramètres qui ont leur valeur par défaut
  clearOnDefault: true,
  // Navigation complète (pas shallow routing)
  shallow: false,
  // Historique de navigation
  history: "push" as const,
  // Délai de débounce pour éviter trop de requêtes
  throttleMs: 300,
};

/**
 * Hook pour gérer les paramètres de recherche des opérations outbox dans l'URL
 */
export function useOutboxSearchParams() {
  return useQueryStates(searchParamsParsers, searchParamsOptions);
}

/**
 * Type des paramètres d'URL pour les opérations outbox
 */
export type OutboxSearchParams = ReturnType<
  typeof useOutboxSearchParams
>[0];

/**
 * Fonction utilitaire pour convertir les paramètres de recherche en filtres pour le store
 *
 * @param searchParams - Les paramètres de recherche depuis l'URL
 * @returns Les filtres formatés pour le store outbox
 */
export function searchParamsToFilters(searchParams: OutboxSearchParams) {
  return {
    page: searchParams.page,
    limit: searchParams.per_page,
    search: searchParams.search || undefined,
    entityType: searchParams.entityType || undefined,
    operation: (searchParams.operation as "create" | "update" | "delete") || undefined,
    status: (searchParams.status as "pending" | "failed" | "all") || "all",
    dateFrom: searchParams.dateFrom || undefined,
    dateTo: searchParams.dateTo || undefined,
    sort_by: searchParams.sort_by || "timestamp",
    sort_order: (searchParams.sort_order as "asc" | "desc") || "desc",
  };
}

/**
 * Fonction utilitaire pour réinitialiser les paramètres de recherche
 *
 * @param setSearchParams - La fonction de mise à jour des paramètres
 */
export function resetSearchParams(
  setSearchParams: ReturnType<typeof useOutboxSearchParams>[1]
) {
  setSearchParams({
    page: 1,
    per_page: 10,
    search: "",
    entityType: "",
    operation: "",
    status: "all",
    dateFrom: "",
    dateTo: "",
    sort_by: "timestamp",
    sort_order: "desc",
  });
}

/**
 * Fonction utilitaire pour synchroniser les paramètres URL avec le store
 *
 * @param searchParams - Les paramètres depuis l'URL
 * @param setSearchParams - Fonction pour mettre à jour l'URL
 * @param storeFilters - Filtres actuels du store
 */
export function syncUrlWithStore(
  searchParams: OutboxSearchParams,
  setSearchParams: ReturnType<typeof useOutboxSearchParams>[1],
  storeFilters: { page?: number; limit?: number; search?: string; entityType?: string; operation?: string; status?: string; dateFrom?: string; dateTo?: string; sort_by?: string; sort_order?: string }
) {
  // Synchroniser uniquement si nécessaire pour éviter les boucles infinies
  const hasChanges = 
    searchParams.page !== storeFilters.page ||
    searchParams.per_page !== storeFilters.limit ||
    searchParams.search !== (storeFilters.search || "") ||
    searchParams.entityType !== (storeFilters.entityType || "") ||
    searchParams.operation !== (storeFilters.operation || "") ||
    searchParams.status !== (storeFilters.status || "all");

  if (hasChanges) {
    setSearchParams({
      page: storeFilters.page,
      per_page: storeFilters.limit,
      search: storeFilters.search || "",
      entityType: storeFilters.entityType || "",
      operation: storeFilters.operation || "",
      status: storeFilters.status || "all",
      dateFrom: storeFilters.dateFrom || "",
      dateTo: storeFilters.dateTo || "",
      sort_by: storeFilters.sort_by || "timestamp",
      sort_order: storeFilters.sort_order || "desc",
    });
  }
}