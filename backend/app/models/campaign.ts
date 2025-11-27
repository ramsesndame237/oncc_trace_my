import AuditLog from '#models/audit_log'
import Convention from '#models/convention'
import { BaseModel, column, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import type { HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'

export default class Campaign extends BaseModel {
  static table = 'campaigns'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare code: string

  @column.date({ columnName: 'start_date' })
  declare startDate: DateTime

  @column.date({ columnName: 'end_date' })
  declare endDate: DateTime

  @column()
  declare status: 'active' | 'inactive'

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Relations
  @hasMany(() => AuditLog, {
    foreignKey: 'auditableId',
    onQuery: (query) => query.where('auditable_type', 'campaign'),
  })
  declare auditLogs: HasMany<typeof AuditLog>

  @manyToMany(() => Convention, {
    pivotTable: 'convention_campaign',
    localKey: 'id',
    pivotForeignKey: 'campaign_id',
    relatedKey: 'id',
    pivotRelatedForeignKey: 'convention_id',
    pivotColumns: ['status', 'created_at', 'updated_at'],
  })
  declare conventions: ManyToMany<typeof Convention>

  // Méthodes utilitaires
  public static async getActiveCampaign(): Promise<Campaign | null> {
    return await Campaign.query().where('status', 'active').first()
  }

  public async activate(): Promise<void> {
    // Désactiver toutes les autres campagnes
    await Campaign.query().update({ status: 'inactive' })

    // Activer cette campagne
    this.status = 'active'
    await this.save()
  }

  public isActive(): boolean {
    return this.status === 'active'
  }

  public isInPeriod(date: DateTime = DateTime.now()): boolean {
    return date >= this.startDate && date <= this.endDate
  }
}
