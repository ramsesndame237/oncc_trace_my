import Actor from '#models/actor'
import AuditLog from '#models/audit_log'
import Campaign from '#models/campaign'
import Store from '#models/store'
import type {
  DriverInfo,
  ProductItem,
  TransferStatus,
  TransferType,
} from '#types/product_transfer_types'
import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'

export default class ProductTransfer extends BaseModel {
  static table = 'product_transfers'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare code: string

  @column({ columnName: 'transfer_type' })
  declare transferType: TransferType

  // Expéditeur
  @column({ columnName: 'sender_actor_id' })
  declare senderActorId: string

  @column({ columnName: 'sender_store_id' })
  declare senderStoreId: string | null // Nullable pour GROUPAGE (producteur sans magasin)

  // Destinataire
  @column({ columnName: 'receiver_actor_id' })
  declare receiverActorId: string

  @column({ columnName: 'receiver_store_id' })
  declare receiverStoreId: string

  // Campagne
  @column({ columnName: 'campaign_id' })
  declare campaignId: string

  // Date du transfert
  @column.date({ columnName: 'transfer_date' })
  declare transferDate: DateTime

  // Informations du chauffeur (JSON)
  @column({
    columnName: 'driver_info',
    prepare: (value: DriverInfo) => JSON.stringify(value),
    consume: (value: string) => {
      if (!value) return null

      // Si c'est déjà un objet, le retourner tel quel
      if (typeof value === 'object') {
        return value
      }

      // Sinon, tenter de parser le JSON
      try {
        return JSON.parse(value)
      } catch (error) {
        console.error('Erreur de parsing JSON pour driver_info:', error)
        return null
      }
    },
  })
  declare driverInfo: DriverInfo | null // Nullable pour GROUPAGE

  // Liste de produits (JSON) - Pour GROUPAGE uniquement
  @column({
    columnName: 'products',
    prepare: (value: ProductItem[] | null) => (value ? JSON.stringify(value) : null),
    consume: (value: string | null) => {
      if (!value) return null

      // Si c'est déjà un objet, le retourner tel quel
      if (typeof value === 'object') {
        return value
      }

      // Sinon, tenter de parser le JSON
      try {
        return JSON.parse(value)
      } catch (error) {
        console.error('Erreur de parsing JSON pour products:', error)
        return null
      }
    },
  })
  declare products: ProductItem[] | null

  @column()
  declare status: TransferStatus

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column.dateTime()
  declare deletedAt: DateTime | null

  // Relations
  @belongsTo(() => Actor, {
    foreignKey: 'senderActorId',
  })
  declare senderActor: BelongsTo<typeof Actor>

  @belongsTo(() => Store, {
    foreignKey: 'senderStoreId',
  })
  declare senderStore: BelongsTo<typeof Store>

  @belongsTo(() => Actor, {
    foreignKey: 'receiverActorId',
  })
  declare receiverActor: BelongsTo<typeof Actor>

  @belongsTo(() => Store, {
    foreignKey: 'receiverStoreId',
  })
  declare receiverStore: BelongsTo<typeof Store>

  @belongsTo(() => Campaign, {
    foreignKey: 'campaignId',
  })
  declare campaign: BelongsTo<typeof Campaign>

  @hasMany(() => AuditLog, {
    foreignKey: 'auditableId',
    onQuery: (query) => query.where('auditable_type', 'product_transfer'),
  })
  declare auditLogs: HasMany<typeof AuditLog>

  // Méthodes utilitaires
  public isPending(): boolean {
    return this.status === 'pending'
  }

  public isValidated(): boolean {
    return this.status === 'validated'
  }

  public isCancelled(): boolean {
    return this.status === 'cancelled'
  }

  public isGroupage(): boolean {
    return this.transferType === 'GROUPAGE'
  }

  public isStandard(): boolean {
    return this.transferType === 'STANDARD'
  }
}
