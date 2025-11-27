/**
 * Type principal ProductTransfer (Domain Entity)
 * Correspond au modèle backend ProductTransfer
 */

import { ISyncStatus } from "@/core/domain/sync.types";
import { PaginationMeta } from "@/core/domain/types";

/**
 * Types de transfert
 */
export const TRANSFER_TYPES = ['GROUPAGE', 'STANDARD'] as const;
export type TransferType = (typeof TRANSFER_TYPES)[number];

/**
 * Statuts de transfert
 */
export const TRANSFER_STATUSES = ['pending', 'validated', 'cancelled'] as const;
export type TransferStatus = (typeof TRANSFER_STATUSES)[number];

/**
 * Informations du chauffeur
 */
export interface DriverInfo {
  fullName: string;
  vehicleRegistration: string;
  drivingLicenseNumber: string;
  routeSheetCode: string;
}

/**
 * Item de produit
 */
export interface ProductItem {
  quality: string;
  weight: number;
  numberOfBags: number;
}

/**
 * Location (simplifié)
 */
export interface Location {
  code: string;
  name: string;
  type: string;
}

/**
 * Actor (simplifié pour les relations)
 */
export interface ActorSummary {
  id: string;
  actorType: string;
  familyName: string;
  givenName: string;
  onccId?: string;
  identifiantId?: string;
}

/**
 * Store (simplifié pour les relations)
 */
export interface StoreSummary {
  id: string;
  name: string;
  code: string;
  locationCode: string;
}

/**
 * Campaign (simplifié pour les relations)
 */
export interface CampaignSummary {
  id: string;
  code: string;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
}

/**
 * Product Transfer Entity (Domain)
 */
export interface ProductTransfer {
  id: string;
  code: string;
  transferType: TransferType;
  senderActorId: string;
  senderStoreId: string;
  receiverActorId: string;
  receiverStoreId: string;
  campaignId: string;
  transferDate: string;
  driverInfo: DriverInfo;
  products: ProductItem[];
  status: TransferStatus;
  createdAt: string;
  updatedAt: string;
  // Relations
  senderActor?: ActorSummary;
  senderStore?: StoreSummary;
  receiverActor?: ActorSummary;
  receiverStore?: StoreSummary;
  campaign?: CampaignSummary;
}

/**
 * ProductTransfer avec métadonnées de synchronisation (pour offline)
 */
export interface ProductTransferWithSync extends ProductTransfer {
  syncStatus?: ISyncStatus;
}

/**
 * Filtres pour la liste des transferts
 */
export interface ProductTransferFilters {
  page?: number;
  per_page?: number;
  transferType?: TransferType;
  status?: TransferStatus;
  senderActorId?: string;
  receiverActorId?: string;
  campaignId?: string;
  startDate?: string;
  endDate?: string;
  period?: number;
  search?: string;
}

/**
 * Résultat de la requête getAll
 */
export interface GetProductTransfersResult {
  productTransfers: ProductTransferWithSync[];
  meta: PaginationMeta;
}
