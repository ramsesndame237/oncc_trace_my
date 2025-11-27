import Parcel from '#models/parcel'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'

export default class ParcelCoordinate extends BaseModel {
  static table = 'parcel_coordinates'

  @column({ isPrimary: true })
  declare id: string

  @column({ columnName: 'parcel_id' })
  declare parcelId: string

  @column()
  declare latitude: number

  @column()
  declare longitude: number

  @column({ columnName: 'point_order' })
  declare pointOrder: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Relations
  @belongsTo(() => Parcel, {
    foreignKey: 'parcelId',
  })
  declare parcel: BelongsTo<typeof Parcel>

  // Méthodes utilitaires
  public toGeoJSON(): { type: string; coordinates: [number, number] } {
    return {
      type: 'Point',
      coordinates: [this.longitude, this.latitude],
    }
  }

  public static async getPolygonForParcel(parcelId: string): Promise<ParcelCoordinate[]> {
    return await this.query().where('parcelId', parcelId).orderBy('pointOrder', 'asc')
  }
}
