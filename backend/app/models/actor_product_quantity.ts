import Actor from '#models/actor'
import Campaign from '#models/campaign'
import Parcel from '#models/parcel'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'

export default class ActorProductQuantity extends BaseModel {
  static table = 'actor_product_quantities'

  @column({ isPrimary: true })
  declare id: string

  @column({ columnName: 'actor_id' })
  declare actorId: string

  @column({ columnName: 'campaign_id' })
  declare campaignId: string

  @column({ columnName: 'parcel_id' })
  declare parcelId: string | null

  @column({ columnName: 'opa_id' })
  declare opaId: string | null

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
  @belongsTo(() => Actor, {
    foreignKey: 'actorId',
  })
  declare actor: BelongsTo<typeof Actor>

  @belongsTo(() => Campaign, {
    foreignKey: 'campaignId',
  })
  declare campaign: BelongsTo<typeof Campaign>

  @belongsTo(() => Parcel, {
    foreignKey: 'parcelId',
  })
  declare parcel: BelongsTo<typeof Parcel>

  @belongsTo(() => Actor, {
    foreignKey: 'opaId',
  })
  declare opa: BelongsTo<typeof Actor>
}
