import { ISyncHandler } from "@/core/domain/sync.types";
import {
  GetProductTransfersResult,
  ProductTransferFilters,
  ProductTransferWithSync,
  TransferStatus,
} from "./ProductTransfer";
import { CreateProductTransferRequest, UpdateProductTransferRequest } from "./types/request";

/**
 * Interface du repository Product Transfer
 * Définit les opérations disponibles sur les transferts de produit
 * Étend ISyncHandler pour le support offline
 */
export interface IProductTransferRepository extends ISyncHandler {
  /**
   * Récupère tous les transferts selon les filtres
   */
  getAll(
    filters: ProductTransferFilters,
    isOnline: boolean
  ): Promise<GetProductTransfersResult>;

  /**
   * Récupère un transfert par son ID
   */
  getById(id: string, isOnline: boolean): Promise<ProductTransferWithSync>;

  /**
   * Crée un nouveau transfert de produit
   */
  create(
    payload: CreateProductTransferRequest,
    isOnline: boolean
  ): Promise<void>;

  /**
   * Met à jour un transfert de produit
   */
  update(
    id: string,
    payload: UpdateProductTransferRequest,
    isOnline: boolean
  ): Promise<void>;

  /**
   * Supprime un transfert de produit
   */
  delete(id: string, isOnline: boolean): Promise<void>;

  /**
   * Met à jour le statut d'un transfert
   */
  updateStatus(id: string, status: TransferStatus): Promise<void>;
}
