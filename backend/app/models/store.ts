import Actor from '#models/actor'
import AuditLog from '#models/audit_log'
import Campaign from '#models/campaign'
import Location from '#models/location'
import { BaseModel, belongsTo, column, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'

export default class Store extends BaseModel {
  static table = 'stores'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare name: string

  @column()
  declare code: string | null

  @column({ columnName: 'location_code' })
  declare locationCode: string

  @column({ columnName: 'store_type' })
  declare storeType: string | null

  @column()
  declare capacity: number | null

  @column({ columnName: 'surface_area' })
  declare surfaceArea: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column.dateTime()
  declare deletedAt: DateTime | null

  // Relations
  @belongsTo(() => Location, {
    foreignKey: 'locationCode',
    localKey: 'code',
  })
  declare location: BelongsTo<typeof Location>

  @manyToMany(() => Campaign, {
    pivotTable: 'store_campaigns',
    localKey: 'id',
    pivotForeignKey: 'store_id',
    relatedKey: 'id',
    pivotRelatedForeignKey: 'campaign_id',
    pivotColumns: ['validation_date'],
  })
  declare campaigns: ManyToMany<typeof Campaign>

  @manyToMany(() => Actor, {
    pivotTable: 'store_occupants',
    localKey: 'id',
    pivotForeignKey: 'store_id',
    relatedKey: 'id',
    pivotRelatedForeignKey: 'actor_id',
  })
  declare occupants: ManyToMany<typeof Actor>

  @hasMany(() => AuditLog, {
    foreignKey: 'auditableId',
    onQuery: (query) => query.where('auditable_type', 'store'),
  })
  declare auditLogs: HasMany<typeof AuditLog>
}
