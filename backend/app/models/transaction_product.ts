import Actor from '#models/actor'
import Transaction from '#models/transaction'
import type { ProductQuality, ProductStandard } from '#types/cacao_types'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'

export default class TransactionProduct extends BaseModel {
  static table = 'transaction_products'

  @column({ isPrimary: true })
  declare id: string

  @column({ columnName: 'transaction_id' })
  declare transactionId: string

  // Produit
  @column()
  declare quality: ProductQuality

  @column()
  declare standard: ProductStandard

  // Quantités
  @column()
  declare weight: number

  @column({ columnName: 'bag_count' })
  declare bagCount: number

  // Prix
  @column({ columnName: 'price_per_kg' })
  declare pricePerKg: number

  @column({ columnName: 'total_price' })
  declare totalPrice: number

  // CAS SPÉCIAL OPA VENDEUR
  @column({ columnName: 'producer_id' })
  declare producerId: string | null

  // Informations complémentaires
  @column()
  declare humidity: number | null

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
  @belongsTo(() => Transaction, {
    foreignKey: 'transactionId',
  })
  declare transaction: BelongsTo<typeof Transaction>

  @belongsTo(() => Actor, {
    foreignKey: 'producerId',
  })
  declare producer: BelongsTo<typeof Actor>

  // Méthodes utilitaires
  public hasProducer(): boolean {
    return this.producerId !== null
  }

  public calculateTotalPrice(): number {
    return Number(this.weight) * Number(this.pricePerKg)
  }
}
