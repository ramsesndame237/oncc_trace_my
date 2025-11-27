import { parseAsInteger, parseAsString, useQueryStates } from "nuqs";
import { UserFilters } from "../../domain";

const searchParamsParsers = {
  page: parseAsInteger.withDefault(1),
  per_page: parseAsInteger.withDefault(10),
  search: parseAsString.withDefault(""),
  role: parseAsString.withDefault(""),
  status: parseAsString.withDefault(""),
  bassinId: parseAsString.withDefault(""),
};

const searchParamsOptions = {
  clearOnDefault: true,
  shallow: false,
  history: "push" as const,
  throttleMs: 300,
};

export function useUserSearchParams() {
  return useQueryStates(searchParamsParsers, searchParamsOptions);
}

export function searchParamsToFilters(searchParams: ReturnType<typeof useUserSearchParams>[0]): UserFilters {
  const filters: UserFilters = {
    page: searchParams.page,
    per_page: searchParams.per_page,
  };

  // Always include search parameter, even if empty
  // This ensures empty search clears previous search results
  if (searchParams.search !== undefined) {
    filters.search = searchParams.search;
  }

  if (searchParams.role) {
    filters.role = searchParams.role;
  }

  if (searchParams.status) {
    filters.status = searchParams.status;
  }

  if (searchParams.bassinId) {
    filters.bassinId = searchParams.bassinId;
  }

  return filters;
}

export function resetSearchParams(setSearchParams: ReturnType<typeof useUserSearchParams>[1]) {
  setSearchParams({
    page: 1,
    per_page: 10,
    search: "",
    role: "",
    status: "",
    bassinId: "",
  });
}