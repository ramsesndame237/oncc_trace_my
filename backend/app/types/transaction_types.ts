import type { ProductQuality, ProductStandard } from './cacao_types.js'

/**
 * Types et constantes pour les transactions
 */

// Types de transaction disponibles
export const TRANSACTION_TYPES = ['SALE', 'PURCHASE'] as const
export type TransactionType = (typeof TRANSACTION_TYPES)[number]

// Types de localisation de transaction
export const TRANSACTION_LOCATION_TYPES = ['MARKET', 'CONVENTION', 'OUTSIDE_MARKET'] as const
export type TransactionLocationType = (typeof TRANSACTION_LOCATION_TYPES)[number]

// Statuts de transaction disponibles
export const TRANSACTION_STATUSES = ['pending', 'confirmed', 'cancelled'] as const
export type TransactionStatus = (typeof TRANSACTION_STATUSES)[number]

// Interface pour les produits de transaction
export interface TransactionProductData {
  quality: ProductQuality
  standard: ProductStandard
  weight: number
  bagCount: number
  pricePerKg: number
  totalPrice: number
  producerId?: string // Obligatoire si vendeur = OPA
  humidity?: number
  notes?: string
}

// Interface pour créer une transaction
export interface CreateTransactionData {
  transactionType: TransactionType
  locationType: TransactionLocationType
  sellerId: string
  buyerId: string
  principalExporterId?: string
  campaignId?: string // Optionnel : si non fourni, utilise la campagne active
  calendarId?: string
  conventionId?: string
  status?: TransactionStatus
  transactionDate: string
  notes?: string
  products: TransactionProductData[]
}

// Interface pour mettre à jour une transaction
export interface UpdateTransactionData {
  status?: TransactionStatus
  notes?: string
  transactionDate?: string
  sellerId?: string
  buyerId?: string
  calendarId?: string | null
  conventionId?: string | null
}
