"use client";

import { parseAsInteger, parseAsString, useQueryStates } from "nuqs";

const searchParamsParsers = {
  // Pagination
  page: parseAsInteger.withDefault(1),
  per_page: parseAsInteger.withDefault(10),

  // Filtres de recherche
  search: parseAsString.withDefault(""),
  status: parseAsString.withDefault(""),
  startDate: parseAsString.withDefault(""),
  endDate: parseAsString.withDefault(""),

  // Tri
  sort_by: parseAsString.withDefault(""),
  sort_order: parseAsString.withDefault("asc"),
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
 * Hook pour gérer les paramètres de recherche des campagnes dans l'URL
 */
export function useCampaignSearchParams() {
  return useQueryStates(searchParamsParsers, searchParamsOptions);
}

/**
 * Type des paramètres d'URL pour les bassins de production
 */
export type CampaignSearchParams = ReturnType<
  typeof useCampaignSearchParams
>[0];

/**
 * Fonction utilitaire pour convertir les paramètres de recherche en filtres pour l'API
 *
 * @param searchParams - Les paramètres de recherche depuis l'URL
 * @returns Les filtres formatés pour l'API
 */
export function searchParamsToFilters(searchParams: CampaignSearchParams) {
  return {
    page: searchParams.page,
    limit: searchParams.per_page,
    search: searchParams.search || undefined,
    status: searchParams.status || undefined,
    startDate: searchParams.startDate || undefined,
    endDate: searchParams.endDate || undefined,
    // Ajouter d'autres conversions selon les besoins de l'API
  };
}

/**
 * Fonction utilitaire pour réinitialiser les paramètres de recherche
 *
 * @param setSearchParams - La fonction de mise à jour des paramètres
 */
export function resetSearchParams(
  setSearchParams: ReturnType<typeof useCampaignSearchParams>[1]
) {
  setSearchParams({
    page: 1,
    per_page: 10,
    search: "",
    status: "",
    sort_by: "",
    sort_order: "asc",
  });
}
