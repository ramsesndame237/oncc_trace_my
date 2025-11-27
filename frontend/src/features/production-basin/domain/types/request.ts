/**
 * Requête pour récupérer la liste des bassins de production
 */
export interface GetProductionBasinsRequest {
  page?: number;
  limit?: number;
  search?: string;
  with_locations?: boolean;
  with_users?: boolean;
}

/**
 * Requête pour récupérer un bassin de production spécifique
 */
export interface GetProductionBasinRequest {
  id: string;
}

/**
 * Requête pour créer un nouveau bassin de production
 */
export interface CreateProductionBasinRequest {
  name: string;
  description: string;
  locationCodes?: string[];
}

/**
 * Requête pour mettre à jour un bassin de production
 */
export interface UpdateProductionBasinRequest {
  id: string;
  name?: string;
  description?: string;
  locationCodes?: string[];
}

/**
 * Requête pour supprimer un bassin de production
 */
export interface DeleteProductionBasinRequest {
  id: string;
}

/**
 * Requête pour assigner des utilisateurs à un bassin
 */
export interface AssignUsersRequest {
  basinId: string;
  userIds: string[];
}

/**
 * Requête pour désassigner des utilisateurs d'un bassin
 */
export interface UnassignUsersRequest {
  basinId: string;
  userIds: string[];
}
