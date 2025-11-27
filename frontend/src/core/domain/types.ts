/**
 * Entité de base avec les propriétés communes
 */
export interface BaseEntity {
  /** Identifiant unique */
  id: string;
  
  /** Date de création */
  createdAt?: string;
  
  /** Date de dernière modification */
  updatedAt?: string;
  
  /** Date de suppression (soft delete) */
  deletedAt?: string | null;
}

/**
 * Métadonnées de pagination (correspond à la structure AdonisJS)
 */
export interface PaginationMeta {
  total: number;
  perPage: number;
  currentPage: number;
  lastPage: number;
  firstPage: number;
  firstPageUrl: string;
  lastPageUrl: string;
  nextPageUrl: string | null;
  previousPageUrl: string | null;
}
