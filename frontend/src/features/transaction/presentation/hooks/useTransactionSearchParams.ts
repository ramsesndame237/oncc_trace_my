import { TransactionFilters } from "../../domain/Transaction";

export function searchParamsToFilters(
  searchParams: URLSearchParams
): Partial<TransactionFilters> {
  const filters: Partial<TransactionFilters> = {};

  const page = searchParams.get("page");
  if (page) filters.page = parseInt(page, 10);

  const perPage = searchParams.get("perPage");
  if (perPage) filters.perPage = parseInt(perPage, 10);

  // Always define search to override persisted store values
  const search = searchParams.get("search");
  if (search && search.trim() !== '') {
    filters.search = search.trim();
  } else {
    filters.search = undefined;
  }

  const transactionType = searchParams.get("transactionType");
  if (transactionType)
    filters.transactionType = transactionType as "SALE" | "PURCHASE";

  const locationType = searchParams.get("locationType");
  if (locationType)
    filters.locationType = locationType as
      | "MARKET"
      | "CONVENTION"
      | "OUTSIDE_MARKET";

  const status = searchParams.get("status");
  if (status) filters.status = status as "pending" | "confirmed" | "cancelled";

  const sellerId = searchParams.get("sellerId");
  if (sellerId) filters.sellerId = sellerId;

  const buyerId = searchParams.get("buyerId");
  if (buyerId) filters.buyerId = buyerId;

  const campaignId = searchParams.get("campaignId");
  if (campaignId) filters.campaignId = campaignId;

  const calendarId = searchParams.get("calendarId");
  if (calendarId) filters.calendarId = calendarId;

  const conventionId = searchParams.get("conventionId");
  if (conventionId) filters.conventionId = conventionId;

  const startDate = searchParams.get("startDate");
  if (startDate) filters.startDate = startDate;

  const endDate = searchParams.get("endDate");
  if (endDate) filters.endDate = endDate;

  const sortBy = searchParams.get("sortBy");
  if (sortBy) filters.sortBy = sortBy;

  const sortOrder = searchParams.get("sortOrder");
  if (sortOrder) filters.sortOrder = sortOrder as "asc" | "desc";

  return filters;
}
