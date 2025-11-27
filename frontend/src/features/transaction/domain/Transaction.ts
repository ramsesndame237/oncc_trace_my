import { ISyncStatus, PaginationMeta } from "@/core/domain";

import { ActorWithSync } from "@/features/actor/domain";
import { CalendarWithSync } from "@/features/calendar/domain";
import { CampaignWithSync } from "@/features/campaign";
import { ConventionWithSync } from "@/features/convention/domain";

// ============ TYPES ENUM ============
export const TRANSACTION_TYPES = ["SALE", "PURCHASE"] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export const TRANSACTION_LOCATION_TYPES = [
  "MARKET",
  "CONVENTION",
  "OUTSIDE_MARKET",
] as const;
export type TransactionLocationType =
  (typeof TRANSACTION_LOCATION_TYPES)[number];

export const TRANSACTION_STATUSES = [
  "pending",
  "confirmed",
  "cancelled",
] as const;
export type TransactionStatus = (typeof TRANSACTION_STATUSES)[number];

// ============ TYPES LIÉS (EMBEDDED) ============

export interface TransactionProduct {
  id: string;
  quality: string;
  standard: string;
  weight: number;
  bagCount: number;
  pricePerKg: number;
  totalPrice: number;
  humidity: number | null;
  producerId: string | null;
  notes: string | null;
  producer?: ActorWithSync | null;
}

// ============ ENTITÉ PRINCIPALE ============
export interface Transaction {
  id: string;
  code: string;
  transactionType: TransactionType;
  locationType: TransactionLocationType;
  status: TransactionStatus;
  transactionDate: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;

  // IDs
  sellerId: string;
  buyerId: string;
  principalExporterId: string | null;
  createdByActorId: string | null;
  campaignId: string;
  calendarId: string | null;
  conventionId: string | null;

  // Relations (partielles car l'API ne renvoie qu'un sous-ensemble des propriétés)
  products: TransactionProduct[];
  seller?: Partial<ActorWithSync>;
  buyer?: Partial<ActorWithSync>;
  principalExporter?: Partial<ActorWithSync> | null;
  createdByActor?: Partial<ActorWithSync> | null;
  campaign?: Partial<CampaignWithSync>;
  calendar?: Partial<CalendarWithSync> | null;
  convention?: Partial<ConventionWithSync> | null;

  // Attributs calculés
  isPendingComplementary?: boolean;
  isMyTransaction?: boolean;
  isEditable?: boolean;
}

// ============ AVEC SYNC ============
export interface TransactionWithSync extends Transaction {
  syncStatus?: ISyncStatus;
}

// ============ FILTRES ============
export interface TransactionFilters {
  page?: number;
  perPage?: number;
  search?: string;
  transactionType?: TransactionType;
  locationType?: TransactionLocationType;
  status?: TransactionStatus;
  sellerId?: string;
  buyerId?: string;
  campaignId?: string;
  calendarId?: string;
  conventionId?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// ============ RÉSULTAT ============
export interface GetTransactionsResult {
  transactions: TransactionWithSync[];
  meta: PaginationMeta;
}
