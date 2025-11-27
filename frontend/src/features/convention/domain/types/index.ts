// Export all domain types and interfaces
export type {
  Convention,
  ConventionFilters,
  ConventionMeta,
  ConventionProduct,
  ConventionWithSync,
  ProductQuality,
  ProductStandard,
} from "./convention.types";

export type {
  ConventionResponse,
  PaginatedConventionsResponse,
} from "./response";

export type {
  CreateConventionRequest,
  UpdateConventionRequest,
} from "./request";

// Import for result types
import type { ConventionMeta, ConventionWithSync } from "./convention.types";

// Export result types
export interface GetConventionsResult {
  conventions: ConventionWithSync[];
  meta: ConventionMeta;
}
