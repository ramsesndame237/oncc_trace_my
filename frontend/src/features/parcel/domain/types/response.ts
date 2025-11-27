import type { ParcelErrorCode } from "./codes";
import type { ApiParcelResponse } from "../parcel.types";
import type { PaginationMeta } from "@/core/domain/types";

export interface ParcelApiError {
  code: ParcelErrorCode;
  message: string;
  field?: string;
}

export interface ParcelApiResponse<T = unknown> {
  data?: T;
  error?: ParcelApiError;
  success: boolean;
}

export interface PaginatedParcelsResponse {
  data: ApiParcelResponse[];
  meta: PaginationMeta;
}