import { parseAsInteger, parseAsString, useQueryStates } from "nuqs";
import { ActorFilters } from "../../domain";

const searchParamsParsers = {
  page: parseAsInteger.withDefault(1),
  per_page: parseAsInteger.withDefault(10),
  search: parseAsString.withDefault(""),
  actorType: parseAsString.withDefault(""),
  status: parseAsString.withDefault(""),
  locationCode: parseAsString.withDefault(""),
};

const searchParamsOptions = {
  clearOnDefault: true,
  shallow: false,
  history: "push" as const,
  throttleMs: 300,
};

export function useActorSearchParams() {
  return useQueryStates(searchParamsParsers, searchParamsOptions);
}

export function searchParamsToFilters(searchParams: ReturnType<typeof useActorSearchParams>[0]): ActorFilters {
  const filters: ActorFilters = {
    page: searchParams.page,
    per_page: searchParams.per_page,
  };

  // Always include search parameter, even if empty
  // This ensures empty search clears previous search results
  if (searchParams.search !== undefined) {
    filters.search = searchParams.search;
  }

  if (searchParams.actorType) {
    filters.actorType = searchParams.actorType;
  }

  if (searchParams.status) {
    filters.status = searchParams.status;
  }

  if (searchParams.locationCode) {
    filters.locationCode = searchParams.locationCode;
  }

  return filters;
}

export function resetSearchParams(setSearchParams: ReturnType<typeof useActorSearchParams>[1]) {
  setSearchParams({
    page: 1,
    per_page: 10,
    search: "",
    actorType: "",
    status: "",
    locationCode: "",
  });
}