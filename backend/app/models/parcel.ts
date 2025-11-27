import Actor from '#models/actor'
import Location from '#models/location'
import ParcelCoordinate from '#models/parcel_coordinate'
import type { ParcelType } from '#types/parcel_types'
import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'

export default class Parcel extends BaseModel {
  static table = 'parcels'

  @column({ isPrimary: true })
  declare id: string

  @column({ columnName: 'producer_id' })
  declare producerId: string

  @column({ columnName: 'location_code' })
  declare locationCode: string

  @column({ columnName: 'surface_area' })
  declare surfaceArea: number | null

  @column.date({ columnName: 'parcel_creation_date' })
  declare parcelCreationDate: DateTime | null

  // Nouveaux champs
  @column({ columnName: 'parcel_type' })
  declare parcelType: ParcelType

  @column({ columnName: 'identification_id' })
  declare identificationId: string | null

  @column({ columnName: 'oncc_id' })
  declare onccId: string | null

  @column()
  declare status: 'active' | 'inactive'

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column.dateTime()
  declare deletedAt: DateTime | null

  // Relations
  @belongsTo(() => Actor, {
    foreignKey: 'producerId',
  })
  declare producer: BelongsTo<typeof Actor>

  @belongsTo(() => Location, {
    foreignKey: 'locationCode',
    localKey: 'code',
  })
  declare location: BelongsTo<typeof Location>

  @hasMany(() => ParcelCoordinate, {
    foreignKey: 'parcelId',
  })
  declare coordinates: HasMany<typeof ParcelCoordinate>

  // Méthodes utilitaires
  public async getCoordinatesOrdered(): Promise<ParcelCoordinate[]> {
    return await ParcelCoordinate.query().where('parcelId', this.id).orderBy('pointOrder', 'asc')
  }

  public isPoint(): boolean {
    return this.coordinates?.length === 1
  }

  public isPolygon(): boolean {
    return this.coordinates?.length > 1
  }

  public isActive(): boolean {
    return this.status === 'active'
  }
}
