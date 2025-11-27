import Actor from '#models/actor'
import AuditLog from '#models/audit_log'
import Campaign from '#models/campaign'
import Convention from '#models/convention'
import Location from '#models/location'
import type { CalendarStatus, CalendarType } from '#types/calendar_types'
import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'

export default class Calendar extends BaseModel {
  static table = 'calendars'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare code: string

  @column()
  declare type: CalendarType

  @column.date({ columnName: 'start_date' })
  declare startDate: DateTime

  @column.date({ columnName: 'end_date' })
  declare endDate: DateTime

  @column({ columnName: 'event_time' })
  declare eventTime: string | null

  @column({ columnName: 'location_code' })
  declare locationCode: string | null

  @column()
  declare location: string | null // Lieu de l'événement (description complète)

  @column({ columnName: 'campaign_id' })
  declare campaignId: string

  @column({ columnName: 'convention_id' })
  declare conventionId: string | null

  @column({ columnName: 'opa_id' })
  declare opaId: string | null

  @column({ columnName: 'expected_sales_count' })
  declare expectedSalesCount: number | null

  @column()
  declare status: CalendarStatus

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column.dateTime()
  declare deletedAt: DateTime | null

  // Relations
  @belongsTo(() => Campaign, {
    foreignKey: 'campaignId',
  })
  declare campaign: BelongsTo<typeof Campaign>

  @belongsTo(() => Convention, {
    foreignKey: 'conventionId',
  })
  declare convention: BelongsTo<typeof Convention>

  @belongsTo(() => Location, {
    foreignKey: 'locationCode',
    localKey: 'code',
  })
  declare locationRelation: BelongsTo<typeof Location>

  @belongsTo(() => Actor, {
    foreignKey: 'opaId',
  })
  declare opa: BelongsTo<typeof Actor>

  @hasMany(() => AuditLog, {
    foreignKey: 'auditableId',
    onQuery: (query) => query.where('auditable_type', 'calendar'),
  })
  declare auditLogs: HasMany<typeof AuditLog>

  // Méthodes utilitaires
  public isActive(): boolean {
    return this.status === 'active'
  }

  public isInactive(): boolean {
    return this.status === 'inactive'
  }

  public isEnlevement(): boolean {
    return this.type === 'ENLEVEMENT'
  }

  public isMarche(): boolean {
    return this.type === 'MARCHE'
  }

  public isInPeriod(date: DateTime = DateTime.now()): boolean {
    return date >= this.startDate && date <= this.endDate
  }

  /**
   * Vérifie si l'événement nécessite une convention
   * (uniquement pour type ENLEVEMENT)
   */
  public requiresConvention(): boolean {
    return this.type === 'ENLEVEMENT'
  }

  /**
   * Active l'événement
   */
  public async activate(): Promise<void> {
    this.status = 'active'
    await this.save()
  }

  /**
   * Désactive l'événement
   */
  public async deactivate(): Promise<void> {
    this.status = 'inactive'
    await this.save()
  }
}
