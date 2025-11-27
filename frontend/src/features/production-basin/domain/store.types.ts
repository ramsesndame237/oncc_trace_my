import { PaginationMeta } from "@/core/domain/types";
import type { ProductionBasinFilters } from "./productionBasin.types";
import {
  CreateProductionBasinRequest,
  UpdateProductionBasinRequest,
} from "./types";
import type { ProductionBasinResponse } from "./types/response";

/**
 * État du store pour les bassins de production
 */
export interface ProductionBasinState {
  basins: ProductionBasinResponse[];
  meta: PaginationMeta | undefined;
  filters: ProductionBasinFilters;
  isLoading: boolean;
  isOnline: boolean;
  error: string | null;
}

/**
 * Actions disponibles pour les bassins de production
 */
export interface ProductionBasinActions {
  // Actions synchrones
  setFilters: (filters: Partial<ProductionBasinFilters>) => void;

  // Actions asynchrones
  fetchBasins: () => Promise<void>;
  createBasin: (data: CreateProductionBasinRequest) => Promise<void>;
  modifyBasin: (
    data: UpdateProductionBasinRequest,
    isOnline: boolean
  ) => Promise<void>;
}
