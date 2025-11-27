import Actor from '#models/actor'
import ProductionBasin from '#models/production_basin'
import { BaseModel, belongsTo, column, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'

export default class Location extends BaseModel {
  static table = 'locations'

  @column({ isPrimary: true })
  declare code: string

  @column({ columnName: 'name' })
  declare name: string

  @column()
  declare type: 'region' | 'department' | 'district' | 'village'

  @column()
  declare parentCode: string | null

  @column()
  declare status: 'active' | 'inactive'

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Relations
  @belongsTo(() => Location, {
    foreignKey: 'parentCode',
    localKey: 'code',
  })
  declare parent: BelongsTo<typeof Location>

  @hasMany(() => Location, {
    foreignKey: 'parentCode',
    localKey: 'code',
  })
  declare children: HasMany<typeof Location>

  @hasMany(() => Actor, {
    foreignKey: 'locationCode',
    localKey: 'code',
  })
  declare actors: HasMany<typeof Actor>

  @manyToMany(() => ProductionBasin, {
    pivotTable: 'production_basin_locations',
    localKey: 'code',
    pivotForeignKey: 'location_code',
    relatedKey: 'id',
    pivotRelatedForeignKey: 'production_basin_id',
  })
  declare productionBasins: ManyToMany<typeof ProductionBasin>

  // Méthodes utilitaires pour la hiérarchie
  public async getAncestors(): Promise<Location[]> {
    const ancestors: Location[] = []
    let current: Location | null = this

    while (current && current.parentCode) {
      const parent: Location | null = await Location.findBy('code', current.parentCode)
      if (parent) {
        ancestors.unshift(parent)
        current = parent
      } else {
        break
      }
    }

    return ancestors
  }

  public async getDescendants(): Promise<Location[]> {
    const descendants: Location[] = []

    const getChildren = async (location: Location): Promise<void> => {
      const children = await Location.query().where('parent_code', location.code)

      for (const child of children) {
        descendants.push(child)
        await getChildren(child)
      }
    }

    await getChildren(this)
    return descendants
  }

  public async getFullPath(): Promise<string> {
    const ancestors = await this.getAncestors()
    const path = [...ancestors, this].map((loc) => loc.name).join(' > ')
    return path
  }

  public async isInProductionBasin(): Promise<boolean> {
    await (this as any).load('productionBasins')
    return this.productionBasins && this.productionBasins.length > 0
  }

  public async getProductionBasinId(): Promise<string | null> {
    await (this as any).load('productionBasins')
    return this.productionBasins && this.productionBasins.length > 0
      ? this.productionBasins[0].id
      : null
  }

  public async getProductionBasinName(): Promise<string | null> {
    await (this as any).load('productionBasins')
    return this.productionBasins && this.productionBasins.length > 0
      ? this.productionBasins[0].name
      : null
  }

  public serialize() {
    const baseSerialized = super.serialize()

    // Bassins directement associés à cette localisation
    const directBasins =
      this.productionBasins && this.productionBasins.length > 0 ? this.productionBasins : []

    // 🔥 PROPAGATION ASCENDANTE : Si pas de bassins directs ET que le parent est chargé avec ses bassins
    let allBasins = [...directBasins]

    if (directBasins.length === 0 && this.parent && this.parent.productionBasins) {
      // Hériter des bassins du parent (propagation ascendante)
      allBasins = this.parent.productionBasins
    }

    const hasBasin = allBasins.length > 0

    return {
      ...baseSerialized,
      isInProductionBasin: hasBasin,
      // Retourner tous les bassins sous forme de tableau (support propagation multi-bassins)
      productionBasinIds: hasBasin ? allBasins.map((basin) => basin.id) : [],
      productionBasins: hasBasin
        ? allBasins.map((basin) => ({
            id: basin.id,
            name: basin.name,
          }))
        : [],
    }
  }
}
