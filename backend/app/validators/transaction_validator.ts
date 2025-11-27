import {
  TRANSACTION_TYPES,
  TRANSACTION_LOCATION_TYPES,
  TRANSACTION_STATUSES,
} from '#types/transaction_types'
import { PRODUCT_QUALITIES, PRODUCT_STANDARDS } from '#types/cacao_types'
import vine from '@vinejs/vine'

/**
 * Schéma de validation pour un produit de transaction
 */
const transactionProductSchema = vine.object({
  quality: vine.enum(PRODUCT_QUALITIES),
  standard: vine.enum(PRODUCT_STANDARDS),
  weight: vine.number().positive(),
  bagCount: vine.number().positive().withoutDecimals(),
  pricePerKg: vine.number().positive(),
  totalPrice: vine.number().positive(),
  producerId: vine.string().uuid().nullable().optional(),
  humidity: vine.number().min(0).max(100).nullable().optional(),
  notes: vine.string().trim().maxLength(1000).nullable().optional(),
})

/**
 * Validation pour créer une transaction
 */
export const createTransactionValidator = vine.compile(
  vine.object({
    transactionType: vine.enum(TRANSACTION_TYPES),
    locationType: vine.enum(TRANSACTION_LOCATION_TYPES),
    sellerId: vine.string().uuid(),
    buyerId: vine.string().uuid(),
    principalExporterId: vine.string().uuid().nullable().optional(),
    // campaignId est optionnel - si non fourni, il sera déduit automatiquement
    campaignId: vine.string().uuid().optional(),
    calendarId: vine.string().uuid().nullable().optional(),
    conventionId: vine.string().uuid().nullable().optional(),
    transactionDate: vine.date(),
    notes: vine.string().trim().maxLength(2000).nullable().optional(),
    products: vine.array(transactionProductSchema).minLength(1),
  })
)

/**
 * Validation pour mettre à jour une transaction
 */
export const updateTransactionValidator = vine.compile(
  vine.object({
    status: vine.enum(TRANSACTION_STATUSES).optional(),
    notes: vine.string().trim().maxLength(2000).nullable().optional(),
    transactionDate: vine.date().optional(),
    sellerId: vine.string().uuid().optional(),
    buyerId: vine.string().uuid().optional(),
    calendarId: vine.string().uuid().nullable().optional(),
    conventionId: vine.string().uuid().nullable().optional(),
  })
)

/**
 * Validation pour confirmer une transaction
 */
export const confirmTransactionValidator = vine.compile(
  vine.object({
    notes: vine.string().trim().maxLength(1000).nullable().optional(),
  })
)

/**
 * Validation pour annuler une transaction
 */
export const cancelTransactionValidator = vine.compile(
  vine.object({
    reason: vine.string().trim().minLength(10).maxLength(1000),
  })
)

/**
 * Validation pour les filtres de liste
 */
export const listTransactionsValidator = vine.compile(
  vine.object({
    page: vine.number().positive().withoutDecimals().optional(),
    limit: vine.number().positive().withoutDecimals().max(100).optional(),
    search: vine.string().trim().optional(),
    transactionType: vine.enum(TRANSACTION_TYPES).optional(),
    locationType: vine.enum(TRANSACTION_LOCATION_TYPES).optional(),
    status: vine.enum(TRANSACTION_STATUSES).optional(),
    sellerId: vine.string().uuid().optional(),
    buyerId: vine.string().uuid().optional(),
    campaignId: vine.string().uuid().optional(),
    calendarId: vine.string().uuid().optional(),
    conventionId: vine.string().uuid().optional(),
    startDate: vine.date().optional(),
    endDate: vine.date().optional(),
  })
)

/**
 * Validation pour mettre à jour les produits d'une transaction
 */
export const updateTransactionProductsValidator = vine.compile(
  vine.object({
    products: vine.array(transactionProductSchema).minLength(1),
  })
)
