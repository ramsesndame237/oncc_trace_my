import Actor from '#models/actor'
import AuditLog from '#models/audit_log'
import Campaign from '#models/campaign'
import Calendar from '#models/calendar'
import Convention from '#models/convention'
import TransactionProduct from '#models/transaction_product'
import type {
  TransactionLocationType,
  TransactionStatus,
  TransactionType,
} from '#types/transaction_types'
import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'

export default class Transaction extends BaseModel {
  static table = 'transactions'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare code: string

  @column({ columnName: 'transaction_type' })
  declare transactionType: TransactionType

  @column({ columnName: 'location_type' })
  declare locationType: TransactionLocationType

  // Acteurs
  @column({ columnName: 'seller_id' })
  declare sellerId: string

  @column({ columnName: 'buyer_id' })
  declare buyerId: string

  @column({ columnName: 'principal_exporter_id' })
  declare principalExporterId: string | null

  // Acteur créateur
  @column({ columnName: 'created_by_actor_id' })
  declare createdByActorId: string | null

  // Contexte
  @column({ columnName: 'campaign_id' })
  declare campaignId: string

  @column({ columnName: 'calendar_id' })
  declare calendarId: string | null

  @column({ columnName: 'convention_id' })
  declare conventionId: string | null

  // Workflow
  @column()
  declare status: TransactionStatus

  // Informations
  @column.date({ columnName: 'transaction_date' })
  declare transactionDate: DateTime

  @column()
  declare notes: string | null

  // Audit
  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column.dateTime()
  declare deletedAt: DateTime | null

  // Relations
  @belongsTo(() => Actor, {
    foreignKey: 'sellerId',
  })
  declare seller: BelongsTo<typeof Actor>

  @belongsTo(() => Actor, {
    foreignKey: 'buyerId',
  })
  declare buyer: BelongsTo<typeof Actor>

  @belongsTo(() => Actor, {
    foreignKey: 'principalExporterId',
  })
  declare principalExporter: BelongsTo<typeof Actor>

  @belongsTo(() => Actor, {
    foreignKey: 'createdByActorId',
  })
  declare createdByActor: BelongsTo<typeof Actor>

  @belongsTo(() => Campaign, {
    foreignKey: 'campaignId',
  })
  declare campaign: BelongsTo<typeof Campaign>

  @belongsTo(() => Calendar, {
    foreignKey: 'calendarId',
  })
  declare calendar: BelongsTo<typeof Calendar>

  @belongsTo(() => Convention, {
    foreignKey: 'conventionId',
  })
  declare convention: BelongsTo<typeof Convention>

  @hasMany(() => TransactionProduct, {
    foreignKey: 'transactionId',
  })
  declare products: HasMany<typeof TransactionProduct>

  @hasMany(() => AuditLog, {
    foreignKey: 'auditableId',
    onQuery: (query) => query.where('auditable_type', 'transaction'),
  })
  declare auditLogs: HasMany<typeof AuditLog>

  // Méthodes utilitaires
  public isPending(): boolean {
    return this.status === 'pending'
  }

  public isConfirmed(): boolean {
    return this.status === 'confirmed'
  }

  public isCancelled(): boolean {
    return this.status === 'cancelled'
  }

  public isSale(): boolean {
    return this.transactionType === 'SALE'
  }

  public isPurchase(): boolean {
    return this.transactionType === 'PURCHASE'
  }

  public isMarket(): boolean {
    return this.locationType === 'MARKET'
  }

  public isConvention(): boolean {
    return this.locationType === 'CONVENTION'
  }

  public isOutsideMarket(): boolean {
    return this.locationType === 'OUTSIDE_MARKET'
  }

  public hasPrincipalExporter(): boolean {
    return this.principalExporterId !== null
  }

  public async getTotalWeight(): Promise<number> {
    await (this as any).load('products')
    return this.products.reduce((sum, product) => sum + Number(product.weight), 0)
  }

  public async getTotalBags(): Promise<number> {
    await (this as any).load('products')
    return this.products.reduce((sum, product) => sum + product.bagCount, 0)
  }

  public async getTotalPrice(): Promise<number> {
    await (this as any).load('products')
    return this.products.reduce((sum, product) => sum + Number(product.totalPrice), 0)
  }
}
