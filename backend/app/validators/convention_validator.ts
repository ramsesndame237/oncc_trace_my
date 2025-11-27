import {
  PRODUCT_QUALITIES_ARRAY,
  PRODUCT_STANDARDS_ARRAY,
} from '#types/cacao_types'
import vine from '@vinejs/vine'

/**
 * Validation schema pour un produit dans une convention
 */
const conventionProductSchema = vine.object({
  quality: vine.enum(PRODUCT_QUALITIES_ARRAY),
  standard: vine.enum(PRODUCT_STANDARDS_ARRAY),
  weight: vine.number().min(0).positive(),
  bags: vine.number().min(0).positive(),
  pricePerKg: vine.number().min(0).positive(),
  humidity: vine.number().min(0).max(100),
})

/**
 * Validation schema pour créer une convention
 */
export const createConventionValidator = vine.compile(
  vine.object({
    buyerExporterId: vine.string().uuid(),
    producersId: vine.string().uuid(),
    signatureDate: vine.date(),
    products: vine.array(conventionProductSchema).minLength(1),
  })
)

/**
 * Validation schema pour mettre à jour une convention
 */
export const updateConventionValidator = vine.compile(
  vine.object({
    buyerExporterId: vine.string().uuid().optional(),
    producersId: vine.string().uuid().optional(),
    signatureDate: vine.date().optional(),
    products: vine.array(conventionProductSchema).minLength(1).optional(),
  })
)

/**
 * Validation schema pour associer une convention à une campagne
 */
export const associateCampaignValidator = vine.compile(
  vine.object({
    campaignId: vine.string().uuid(),
  })
)
