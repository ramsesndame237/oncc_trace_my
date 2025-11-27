import vine from '@vinejs/vine'
import { TRANSFER_TYPES, TRANSFER_STATUSES } from '#types/product_transfer_types'

/**
 * Validation schema pour les informations du chauffeur
 */
const driverInfoSchema = vine.object({
  fullName: vine.string().trim().minLength(2).maxLength(200),
  vehicleRegistration: vine.string().trim().minLength(2).maxLength(50),
  drivingLicenseNumber: vine.string().trim().minLength(2).maxLength(50),
  routeSheetCode: vine.string().trim().minLength(2).maxLength(100),
})

/**
 * Validation schema pour un produit dans la liste
 */
const productItemSchema = vine.object({
  quality: vine.string().trim().minLength(1).maxLength(100),
  weight: vine.number().positive().decimal([0, 2]),
  numberOfBags: vine.number().positive().withoutDecimals(),
})

/**
 * Validation schema pour créer un transfert de produit
 * Note: Le code est généré automatiquement
 * Note: senderStoreId est optionnel pour les transferts GROUPAGE (le producteur n'a pas de magasin)
 */
export const createProductTransferValidator = vine.compile(
  vine.object({
    transferType: vine.enum(TRANSFER_TYPES),
    senderActorId: vine.string().uuid(),
    senderStoreId: vine.string().uuid().optional(), // Optionnel pour GROUPAGE
    receiverActorId: vine.string().uuid(),
    receiverStoreId: vine.string().uuid(),
    campaignId: vine.string().uuid().optional(), // Optionnel, récupéré automatiquement si non fourni
    transferDate: vine.date(),
    driverInfo: driverInfoSchema.optional(), // Optionnel pour les transferts GROUPAGE
    products: vine.array(productItemSchema).minLength(1),
    status: vine.enum(TRANSFER_STATUSES).optional(),
  })
)

/**
 * Validation schema pour mettre à jour un transfert de produit
 * Note: code, campaignId et transferType ne peuvent pas être modifiés
 * Note: transferDate peut être modifié pour les transferts GROUPAGE
 */
export const updateProductTransferValidator = vine.compile(
  vine.object({
    senderActorId: vine.string().uuid().optional(),
    senderStoreId: vine.string().uuid().optional(),
    receiverActorId: vine.string().uuid().optional(),
    receiverStoreId: vine.string().uuid().optional(),
    transferDate: vine.date().optional(),
    driverInfo: driverInfoSchema.optional(),
    products: vine.array(productItemSchema).minLength(1).optional(),
  })
)

/**
 * Validation schema pour mettre à jour le statut d'un transfert
 */
export const updateTransferStatusValidator = vine.compile(
  vine.object({
    status: vine.enum(TRANSFER_STATUSES),
  })
)

/**
 * Validation schema pour les filtres de liste
 */
export const listProductTransfersValidator = vine.compile(
  vine.object({
    page: vine.number().positive().withoutDecimals().optional(),
    limit: vine.number().positive().withoutDecimals().optional(),
    transferType: vine.enum(TRANSFER_TYPES).optional(),
    status: vine.enum(TRANSFER_STATUSES).optional(),
    senderActorId: vine.string().uuid().optional(),
    receiverActorId: vine.string().uuid().optional(),
    campaignId: vine.string().uuid().optional(),
    startDate: vine.date().optional(),
    endDate: vine.date().optional(),
    period: vine.number().positive().withoutDecimals().optional(), // Nombre de jours
    search: vine.string().trim().optional(),
  })
)
