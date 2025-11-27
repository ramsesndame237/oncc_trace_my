import Actor from '#models/actor'
import Campaign from '#models/campaign'
import Store from '#models/store'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'

export default class StoreProductQuantity extends BaseModel {
  static table = 'store_product_quantities'

  @column({ isPrimary: true })
  declare id: string

  @column({ columnName: 'store_id' })
  declare storeId: string

  @column({ columnName: 'campaign_id' })
  declare campaignId: string

  @column({ columnName: 'actor_id' })
  declare actorId: string

  @column()
  declare quality: string

  @column({ columnName: 'total_weight' })
  declare totalWeight: number

  @column({ columnName: 'total_bags' })
  declare totalBags: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Relations
  @belongsTo(() => Store, {
    foreignKey: 'storeId',
  })
  declare store: BelongsTo<typeof Store>

  @belongsTo(() => Campaign, {
    foreignKey: 'campaignId',
  })
  declare campaign: BelongsTo<typeof Campaign>

  @belongsTo(() => Actor, {
    foreignKey: 'actorId',
  })
  declare actor: BelongsTo<typeof Actor>
}
