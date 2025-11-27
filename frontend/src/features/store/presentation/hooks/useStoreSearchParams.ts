import { parseAsInteger, parseAsString, useQueryStates } from "nuqs";
import { StoreFilters } from "../../domain/store.domain.types";

const searchParamsParsers = {
  page: parseAsInteger.withDefault(1),
  limit: parseAsInteger.withDefault(10),
  search: parseAsString.withDefault(""),
  status: parseAsString.withDefault(""),
};

const searchParamsOptions = {
  clearOnDefault: true,
  shallow: false,
  history: "push" as const,
  throttleMs: 300,
};

export function useStoreSearchParams() {
  return useQueryStates(searchParamsParsers, searchParamsOptions);
}

export function searchParamsToFilters(
  searchParams: ReturnType<typeof useStoreSearchParams>[0]
): StoreFilters {
  const filters: StoreFilters = {
    page: searchParams.page,
    limit: searchParams.limit,
  };

  // Always include search parameter, even if empty
  // This ensures empty search clears previous search results
  if (searchParams.search !== undefined) {
    filters.search = searchParams.search;
  }

  if (searchParams.status) {
    filters.status = searchParams.status as "active" | "inactive";
  }

  return filters;
}

export function resetSearchParams(
  setSearchParams: ReturnType<typeof useStoreSearchParams>[1]
) {
  setSearchParams({
    page: 1,
    limit: 20,
    search: "",
    status: "",
  });
}
