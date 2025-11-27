import Location from '#models/location'
import User from '#models/user'
import { BaseModel, column, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import type { HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'

export default class ProductionBasin extends BaseModel {
  static table = 'production_basins'

  @column({ isPrimary: true })
  declare id: string

  @column({ columnName: 'name' })
  declare name: string

  @column()
  declare description: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Relations
  @hasMany(() => User, {
    foreignKey: 'productionBasinId',
  })
  declare users: HasMany<typeof User>

  @manyToMany(() => Location, {
    pivotTable: 'production_basin_locations',
    localKey: 'id',
    pivotForeignKey: 'production_basin_id',
    relatedKey: 'code',
    pivotRelatedForeignKey: 'location_code',
  })
  declare locations: ManyToMany<typeof Location>
}
