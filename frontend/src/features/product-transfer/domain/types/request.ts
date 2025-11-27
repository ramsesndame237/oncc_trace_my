import { ProductTransferFilters, ProductTransferWithSync, DriverInfo, ProductItem, TransferType, TransferStatus } from "../ProductTransfer";

/**
 * Requête pour récupérer les transferts avec filtres
 */
export interface GetProductTransfersRequest extends ProductTransferFilters {
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
 * Requête pour récupérer un transfert par ID
 */
export interface GetProductTransferRequest {
  id: string;
}

/**
 * Requête pour créer un transfert de produit
 */
export interface CreateProductTransferRequest {
  transferType: TransferType;
  senderActorId: string;
  senderStoreId: string;
  receiverActorId: string;
  receiverStoreId: string;
  campaignId?: string; // Optionnel, récupéré automatiquement si non fourni
  transferDate: string; // Format ISO
  driverInfo?: DriverInfo; // Optionnel pour les transferts GROUPAGE
  products: ProductItem[];
  status?: TransferStatus; // Optionnel, par défaut 'pending'
}

/**
 * Requête pour mettre à jour un transfert
 */
export type UpdateProductTransferRequest = Partial<Omit<ProductTransferWithSync, "id" | "code" | "createdAt" | "updatedAt">>;

/**
 * Requête pour mettre à jour le statut d'un transfert
 */
export interface UpdateTransferStatusRequest {
  id: string;
  status: TransferStatus;
}
