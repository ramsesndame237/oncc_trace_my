/**
 * Types pour la feature Convention
 * Les types de qualité/standard proviennent des types générés (backend → frontend)
 */
import type {
  ProductQuality,
  ProductStandard,
} from "@/core/domain/generated/cacao-types.types";
import type { ISyncStatus } from "@/core/domain/sync.types";
import { ActorWithSync } from "@/features/actor/domain";
import { CampaignWithSync } from "@/features/campaign";

export type {
  ProductQuality,
  ProductStandard,
} from "@/core/domain/generated/cacao-types.types";

// Re-export PaginationMeta comme ConventionMeta pour la compatibilité
export type { PaginationMeta as ConventionMeta } from "@/core/domain";

export interface ConventionProduct {
  quality: ProductQuality;
  standard: ProductStandard;
  weight: number; // en kg
  bags: number; // nombre de sacs
  pricePerKg: number; // prix par kg en FCFA
  humidity: number; // taux d'humidité en %
}

export interface Convention {
  id: string;
  code: string; // Code unique généré automatiquement (CONV-YYYY-XXXX)
  buyerExporterId: string;
  producersId: string;
  signatureDate: string;
  products: ConventionProduct[];
  status?: "active" | "inactive"; // Indique si la convention est associée à la campagne en cours
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;

  // Relations (partielles car l'API ne renvoie qu'un sous-ensemble des propriétés)
  buyerExporter?: Partial<ActorWithSync>;
  producers?: Partial<ActorWithSync>;
  campaigns?: Array<Partial<CampaignWithSync>>;
}

export interface ConventionWithSync extends Convention {
  syncStatus?: ISyncStatus;
}

export interface ConventionFilters {
  page?: number;
  per_page?: number;
  search?: string;
  buyerExporterId?: string;
  producersId?: string;
  campaignId?: string;
}
