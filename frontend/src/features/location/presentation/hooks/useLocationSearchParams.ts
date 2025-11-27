import { parseAsInteger, parseAsString, useQueryStates } from "nuqs";

/**
 * Parseurs pour les paramètres de recherche des localisations
 */
const searchParamsParsers = {
  // Pagination
  page: parseAsInteger.withDefault(1),
  per_page: parseAsInteger.withDefault(10),

  // Filtres de recherche
  search: parseAsString.withDefault(""),
  parentCode: parseAsString.withDefault(""),
  type: parseAsString.withDefault(""),

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
 * Hook pour gérer les paramètres d'URL des localisations
 *
 * @returns Un tuple contenant les paramètres actuels et la fonction pour les mettre à jour
 *
 * @example
 * ```tsx
 * const [searchParams, setSearchParams] = useLocationSearchParams();
 *
 * // Lire les paramètres
 * console.log(searchParams.page); // 1
 * console.log(searchParams.search); // ""
 *
 * // Mettre à jour les paramètres
 * setSearchParams({ page: 2, search: "test" });
 *
 * // Réinitialiser la recherche
 * setSearchParams({ search: "", page: 1 });
 * ```
 */
export function useLocationSearchParams() {
  return useQueryStates(searchParamsParsers, searchParamsOptions);
}

/**
 * Type des paramètres d'URL pour les localisations
 */
export type LocationSearchParams = ReturnType<
  typeof useLocationSearchParams
>[0];

/**
 * Fonction utilitaire pour convertir les paramètres de recherche en filtres pour l'API
 *
 * @param searchParams - Les paramètres de recherche depuis l'URL
 * @returns Les filtres formatés pour l'API
 */
export function searchParamsToFilters(searchParams: LocationSearchParams) {
  const typeValue = searchParams.type;
  const validType =
    typeValue &&
    ["region", "department", "district", "village"].includes(typeValue)
      ? (typeValue as "region" | "department" | "district" | "village")
      : undefined;

  return {
    search: searchParams.search || undefined,
    parentCode: searchParams.parentCode || undefined,
    type: validType,
    // Ajouter d'autres conversions selon les besoins de l'API
  };
}

/**
 * Fonction utilitaire pour réinitialiser les paramètres de recherche
 *
 * @param setSearchParams - La fonction de mise à jour des paramètres
 */
export function resetSearchParams(
  setSearchParams: ReturnType<typeof useLocationSearchParams>[1]
) {
  setSearchParams({
    page: 1,
    per_page: 10,
    search: "",
    parentCode: "",
    type: "",
    sort_by: "",
    sort_order: "asc",
  });
}
