import type { Document } from "../document.types";
import type { PaginationMeta } from "@/core/domain/types";

export interface PaginatedDocumentsResponse {
  data: Document[];
  meta: PaginationMeta;
}