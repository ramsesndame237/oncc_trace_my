import { ISyncHandler } from "@/core/domain/sync.types";
import { PaginationMeta } from "@/core/domain/types";
import {
  ProductionBasinFilters,
  ProductionBasinStats,
  ProductionBasinWithSync,
} from "./productionBasin.types";
import {
  CreateProductionBasinRequest,
  UpdateProductionBasinRequest,
} from "./types";

export interface GetProductionBasinsResult {
  basins: ProductionBasinWithSync[];
  meta: PaginationMeta | undefined;
}

/**
 * Interface du repository pour les bassins de production.
 * Définit le contrat pour la couche infrastructure.
 */
export interface IProductionBasinRepository extends ISyncHandler {
  /**
   * Récupère tous les bassins avec leurs statuts de synchronisation
   * @param isOnline - Indique si l'application est en ligne pour déterminer la source des données
   * @param filters - Filtres optionnels pour la recherche et la pagination
   * @returns Une promesse résolue avec les bassins et les métadonnées de pagination
   */
  getAll(
    isOnline: boolean,
    filters?: ProductionBasinFilters
  ): Promise<GetProductionBasinsResult>;

  /**
   * Récupère un bassin spécifique par son ID
   * @param id - ID du bassin à récupérer
   * @param isOnline - Indique si l'application est en ligne pour déterminer la source des données
   * @returns Une promesse résolue avec le bassin
   */
  getById(id: string, isOnline: boolean): Promise<ProductionBasinWithSync>;

  /**
   * Ajoute un nouveau bassin
   */
  add(data: CreateProductionBasinRequest): Promise<void>;

  /**
   * Met à jour un bassin existant
   */
  update(data: UpdateProductionBasinRequest, isOnline: boolean): Promise<void>;

  /**
   * Récupère les statistiques des bassins de production
   */
  getStats(): Promise<ProductionBasinStats>;
}
