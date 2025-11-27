/**
 * Types et constantes pour les transferts de produits
 */

// Types de transfert disponibles
export const TRANSFER_TYPES = ['GROUPAGE', 'STANDARD'] as const

// Type TypeScript dérivé de la constante
export type TransferType = (typeof TRANSFER_TYPES)[number]

// Statuts de transfert disponibles
export const TRANSFER_STATUSES = ['pending', 'validated', 'cancelled'] as const

// Type TypeScript pour les statuts
export type TransferStatus = (typeof TRANSFER_STATUSES)[number]

// Interface pour les informations du chauffeur
export interface DriverInfo {
  fullName: string
  vehicleRegistration: string
  drivingLicenseNumber: string
  routeSheetCode: string
}

// Interface pour un produit dans la liste (GROUPAGE et STANDARD)
export interface ProductItem {
  quality: string
  weight: number
  numberOfBags: number
}

// Interface pour créer un transfert
// Note: Le code est généré automatiquement
// Note: senderStoreId est optionnel pour GROUPAGE (producteur sans magasin)
// Note: driverInfo est optionnel pour GROUPAGE
export interface CreateProductTransferData {
  transferType: TransferType
  senderActorId: string
  senderStoreId?: string // Optionnel pour GROUPAGE
  receiverActorId: string
  receiverStoreId: string
  campaignId?: string // Optionnel, récupéré automatiquement si non fourni
  transferDate: string
  driverInfo?: DriverInfo // Optionnel pour GROUPAGE
  products: ProductItem[] // Requis pour GROUPAGE et STANDARD
  status?: TransferStatus
}

// Interface pour mettre à jour un transfert
// Note: code, campaignId et transferType ne peuvent pas être modifiés
// Note: transferDate peut être modifié pour les transferts GROUPAGE
export interface UpdateProductTransferData {
  senderActorId?: string
  senderStoreId?: string
  receiverActorId?: string
  receiverStoreId?: string
  transferDate?: string
  driverInfo?: DriverInfo
  products?: ProductItem[]
}

// Interface pour mettre à jour le statut
export interface UpdateTransferStatusData {
  status: TransferStatus
}

// Interface pour les filtres de liste
export interface ListProductTransfersFilters {
  page?: number
  limit?: number
  transferType?: TransferType
  status?: TransferStatus
  senderActorId?: string
  receiverActorId?: string
  campaignId?: string
  startDate?: string
  endDate?: string
  period?: number // Nombre de jours (ex: 7 pour les 7 derniers jours)
  search?: string
}
