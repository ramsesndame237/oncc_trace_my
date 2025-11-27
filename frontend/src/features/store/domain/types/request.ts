import { StoreStatus, StoreType } from '../store.domain.types'

/**
 * Paramètres pour récupérer la liste des magasins
 */
export interface GetStoresRequest {
  /** Page à récupérer */
  page?: number
  
  /** Nombre d'éléments par page */
  limit?: number
  
  /** Terme de recherche (nom ou code) */
  search?: string
  
  /** Filtrer par statut */
  status?: StoreStatus
}

/**
 * Paramètres pour récupérer un magasin par ID
 */
export interface GetStoreByIdRequest {
  /** ID du magasin */
  id: string
}

/**
 * Paramètres pour créer un magasin
 */
export interface CreateStoreRequest {
  /** Nom du magasin */
  name: string
  
  /** Code unique du magasin */
  code?: string
  
  /** Type de magasin */
  storeType: StoreType
  
  /** Capacité du magasin */
  capacity?: number
  
  /** Superficie en m² */
  surfaceArea?: number
  
  /** Code de la localisation */
  locationCode: string
  
  /** Statut du magasin */
  status?: StoreStatus
}

/**
 * Paramètres pour mettre à jour un magasin
 */
export interface UpdateStoreRequest {
  /** ID du magasin à mettre à jour */
  id: string
  
  /** Nom du magasin */
  name?: string
  
  /** Code unique du magasin */
  code?: string
  
  /** Type de magasin */
  storeType?: StoreType
  
  /** Capacité du magasin */
  capacity?: number
  
  /** Superficie en m² */
  surfaceArea?: number
  
  /** Code de la localisation */
  locationCode?: string
  
  /** Statut du magasin */
  status?: StoreStatus
}