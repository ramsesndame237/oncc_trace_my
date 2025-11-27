import { parseAsInteger, parseAsString, useQueryStates } from "nuqs";
import { CalendarFilters, CalendarType, CalendarStatus } from "../../domain";

const searchParamsParsers = {
  page: parseAsInteger.withDefault(1),
  per_page: parseAsInteger.withDefault(10),
  search: parseAsString.withDefault(""),
  type: parseAsString.withDefault(""),
  status: parseAsString.withDefault(""),
  campaignId: parseAsString.withDefault(""),
  conventionId: parseAsString.withDefault(""),
  locationCode: parseAsString.withDefault(""),
};

const searchParamsOptions = {
  clearOnDefault: true,
  shallow: false,
  history: "push" as const,
  throttleMs: 300,
};

export function useCalendarSearchParams() {
  return useQueryStates(searchParamsParsers, searchParamsOptions);
}

export function searchParamsToFilters(
  searchParams: ReturnType<typeof useCalendarSearchParams>[0]
): CalendarFilters {
  const filters: CalendarFilters = {
    page: searchParams.page,
    per_page: searchParams.per_page,
  };

  // Always include search parameter to override persisted store values
  // If search is empty string, set to undefined to clear previous search
  if (searchParams.search && searchParams.search.trim() !== '') {
    filters.search = searchParams.search.trim();
  } else {
    filters.search = undefined;
  }

  if (searchParams.type) {
    filters.type = searchParams.type as CalendarType;
  }

  if (searchParams.status) {
    filters.status = searchParams.status as CalendarStatus;
  }

  if (searchParams.campaignId) {
    filters.campaignId = searchParams.campaignId;
  }

  if (searchParams.conventionId) {
    filters.conventionId = searchParams.conventionId;
  }

  if (searchParams.locationCode) {
    filters.locationCode = searchParams.locationCode;
  }

  return filters;
}

export function resetSearchParams(
  setSearchParams: ReturnType<typeof useCalendarSearchParams>[1]
) {
  setSearchParams({
    page: 1,
    per_page: 10,
    search: "",
    type: "",
    status: "",
    campaignId: "",
    conventionId: "",
    locationCode: "",
  });
}
