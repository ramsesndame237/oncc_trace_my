import { BaseModel, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'

export default class Metadata extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare metadatableType: string

  @column()
  declare metadatableId: string

  @column()
  declare metaKey: string

  @column()
  declare metaValue: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Méthodes utilitaires pour les relations polymorphiques
  public static async getMetadataFor(type: string, id: string): Promise<Record<string, string>> {
    const metadata = await Metadata.query()
      .where('metadatable_type', type)
      .where('metadatable_id', id)

    const result: Record<string, string> = {}
    metadata.forEach((meta) => {
      if (meta.metaValue) {
        result[meta.metaKey] = meta.metaValue
      }
    })

    return result
  }

  public static async setMetadataFor(
    type: string,
    id: string,
    key: string,
    value: string | null
  ): Promise<Metadata | null> {
    const existing = await Metadata.query()
      .where('metadatable_type', type)
      .where('metadatable_id', id)
      .where('meta_key', key)
      .first()

    // Si la valeur est null ou vide, supprimer la métadonnée
    if (!value || value.trim() === '') {
      if (existing) {
        await existing.delete()
      }
      return null
    }

    if (existing) {
      existing.metaValue = value
      await existing.save()
      return existing
    } else {
      return await Metadata.create({
        metadatableType: type,
        metadatableId: id,
        metaKey: key,
        metaValue: value,
      })
    }
  }
}
