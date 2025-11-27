import Actor from '#models/actor'
import AuditLog from '#models/audit_log'
import Campaign from '#models/campaign'
import type { ProductQuality, ProductStandard } from '#types/cacao_types'
import { BaseModel, belongsTo, column, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'

export interface ConventionProduct {
  quality: ProductQuality
  standard: ProductStandard
  weight: number // en kg
  bags: number // nombre de sacs
  pricePerKg: number // prix par kg en FCFA
  humidity: number // taux d'humidité en %
}

export default class Convention extends BaseModel {
  static table = 'conventions'

  @column({ isPrimary: true })
  declare id: string

  // Code unique de la convention (généré automatiquement)
  @column()
  declare code: string

  // Relations
  @column({ columnName: 'buyer_exporter_id' })
  declare buyerExporterId: string

  @column({ columnName: 'producers_id' })
  declare producersId: string

  // Date de signature
  @column.date({ columnName: 'signature_date' })
  declare signatureDate: DateTime

  // Produits (JSON)
  @column({
    prepare: (value: ConventionProduct[]) => JSON.stringify(value),
    consume: (value: string) => {
      if (!value) return []

      // Si c'est déjà un objet, le retourner tel quel
      if (typeof value === 'object') {
        return value
      }

      // Sinon, tenter de parser le JSON
      try {
        return JSON.parse(value)
      } catch (error) {
        console.error('Erreur de parsing JSON pour products:', error)
        return []
      }
    },
  })
  declare products: ConventionProduct[]

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column.dateTime()
  declare deletedAt: DateTime | null

  // Relations
  @belongsTo(() => Actor, {
    foreignKey: 'buyerExporterId',
  })
  declare buyerExporter: BelongsTo<typeof Actor>

  @belongsTo(() => Actor, {
    foreignKey: 'producersId',
  })
  declare producers: BelongsTo<typeof Actor>

  @manyToMany(() => Campaign, {
    pivotTable: 'convention_campaign',
    localKey: 'id',
    pivotForeignKey: 'convention_id',
    relatedKey: 'id',
    pivotRelatedForeignKey: 'campaign_id',
    pivotColumns: ['created_at'],
  })
  declare campaigns: ManyToMany<typeof Campaign>

  @hasMany(() => AuditLog, {
    foreignKey: 'auditableId',
    onQuery: (query) => query.where('auditable_type', 'convention'),
  })
  declare auditLogs: HasMany<typeof AuditLog>

  // Méthodes utilitaires
  public getTotalWeight(): number {
    return this.products.reduce((sum, product) => sum + product.weight, 0)
  }

  public getTotalBags(): number {
    return this.products.reduce((sum, product) => sum + product.bags, 0)
  }

  public getTotalValue(): number {
    return this.products.reduce((sum, product) => sum + product.weight * product.pricePerKg, 0)
  }

  /**
   * Vérifie si la convention est associée à la campagne en cours
   */
  public async isAssociatedWithCurrentCampaign(): Promise<boolean> {
    const activeCampaign = await Campaign.getActiveCampaign()
    if (!activeCampaign) {
      return false
    }

    // Vérifier directement dans la table pivot
    const exists = await db
      .from('convention_campaign')
      .where('convention_id', this.id)
      .where('campaign_id', activeCampaign.id)
      .first()

    return !!exists
  }
}
