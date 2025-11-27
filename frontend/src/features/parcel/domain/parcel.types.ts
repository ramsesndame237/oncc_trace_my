// Statuts et types de parcelle
export const PARCEL_STATUSES = ["active", "inactive"] as const;
export const PARCEL_TYPES = [
  "national",
  "public",
  "state_private",
  "individual_private",
] as const;

export type ParcelType = (typeof PARCEL_TYPES)[number];
export type ParcelStatus = (typeof PARCEL_STATUSES)[number];

// Interface pour les coordonnées
export interface CoordinateData {
  id?: string; // Optionnel pour la création, obligatoire pour la mise à jour
  latitude: number;
  longitude: number;
  pointOrder: number;
}

// Interface pour la création d'une parcelle
export interface CreateParcelData {
  locationCode: string;
  surfaceArea?: number;
  parcelCreationDate?: string; // ISO string date
  parcelType: ParcelType;
  identificationId?: string;
  onccId?: string;
  status?: ParcelStatus;
  coordinates?: CoordinateData[];
}

// Interface pour la mise à jour d'une parcelle
export interface UpdateParcelData {
  locationCode?: string;
  surfaceArea?: number;
  parcelCreationDate?: string; // ISO string date
  parcelType?: ParcelType;
  identificationId?: string;
  onccId?: string;
  status?: ParcelStatus;
  coordinates?: CoordinateData[];
}

// Interface pour la réponse API d'une parcelle
export interface ApiParcelResponse {
  id: string;
  producerId: string;
  locationCode: string;
  surfaceArea?: number;
  parcelCreationDate?: string;
  parcelType: ParcelType;
  identificationId?: string;
  onccId?: string;
  status: ParcelStatus;
  coordinates?: CoordinateData[];
  location?: {
    id: string;
    code: string;
    name: string;
    type: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Interface pour les filtres de recherche de parcelles
export interface ParcelFilterOptions {
  page?: number;
  limit?: number;
  producerId?: string;
  locationCode?: string;
  parcelType?: ParcelType;
  status?: ParcelStatus;
  search?: string;
}

// Alias pour la compatibilité
export interface GetProducerParcelsFilters extends ParcelFilterOptions {
  actorId?: string; // Alias pour producerId
}

// Interface pour le résultat de récupération des parcelles
export interface GetProducerParcelsResult {
  parcels: ApiParcelResponse[];
  meta?: {
    total: number;
    page: number;
    limit: number;
  };
}

// Interface pour la création en masse de parcelles
export interface BulkCreateParcelData {
  parcels: CreateParcelData[];
}

// Interface pour le résultat de création en masse
export interface BulkCreateResult {
  success: ApiParcelResponse[];
  errors: Array<{
    index: number;
    parcel: CreateParcelData;
    error: string;
  }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}

// Alias pour la compatibilité
export interface CreateParcelsBulkData {
  type?: string;
  actorId: string;
  parcels: CreateParcelData[];
  // Informations du producteur pour affichage offline
  producerInfo?: {
    familyName: string;
    givenName: string;
    locationCode: string;
    onccId?: string;
    identifiantId?: string;
  };
}

export interface CreateParcelsBulkResult {
  created: ApiParcelResponse[];
  errors: Array<{
    index: number;
    error: string;
    data: CreateParcelData;
  }>;
}
