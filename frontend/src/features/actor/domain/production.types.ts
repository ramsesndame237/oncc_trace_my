/**
 * Types pour les productions d'un producteur et les collectes d'un OPA (actor_product_quantities)
 */

export interface Production {
  id: string;
  actorId: string;
  campaignId: string;
  parcelId: string | null;
  opaId: string | null;
  quality: string;
  totalWeight: number;
  totalBags: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductionByQuality {
  quality: string;
  totalWeight: number;
  totalBags: number;
}

export interface ProductionTotals {
  totalWeight: number;
  totalBags: number;
}

export interface ProducerProductionsResponse {
  productions: Production[];
  totalsByQuality: ProductionByQuality[];
  totals: ProductionTotals;
  campaignId: string | null;
}

// Alias pour les collectes d'un OPA (même structure)
export type Collection = Production;
export type CollectionByQuality = ProductionByQuality;
export type CollectionTotals = ProductionTotals;

export interface OpaCollectionsResponse {
  collections: Collection[];
  totalsByQuality: CollectionByQuality[];
  totals: CollectionTotals;
  campaignId: string | null;
}
