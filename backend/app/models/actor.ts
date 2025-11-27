import AuditLog from '#models/audit_log'
import Calendar from '#models/calendar'
import Convention from '#models/convention'
import Document from '#models/document'
import Location from '#models/location'
import Metadata from '#models/metadata'
import Parcel from '#models/parcel'
import Store from '#models/store'
import User from '#models/user'
import type { ActorStatus, ActorType, ManagerInfo } from '#types/actor_types'
import { BaseModel, belongsTo, column, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'

export default class Actor extends BaseModel {
  static table = 'actors'

  @column({ isPrimary: true })
  declare id: string

  @column({ columnName: 'actor_type' })
  declare actorType: ActorType

  // Informations de base
  @column({ columnName: 'family_name' })
  declare familyName: string

  @column({ columnName: 'given_name' })
  declare givenName: string

  @column()
  declare phone: string | null

  @column()
  declare email: string | null

  // Identifications
  @column({ columnName: 'oncc_id' })
  declare onccId: string | null

  @column({ columnName: 'identifiant_id' })
  declare identifiantId: string | null

  // Localisation
  @column({ columnName: 'location_code' })
  declare locationCode: string | null

  // Informations du manager (JSON)
  @column({
    columnName: 'manager_info',
    prepare: (value: ManagerInfo | null) => JSON.stringify(value),
    consume: (value: string | null) => {
      if (!value) return null

      // Si c'est déjà un objet, le retourner tel quel
      if (typeof value === 'object') {
        return value
      }

      // Sinon, tenter de parser le JSON
      try {
        return JSON.parse(value)
      } catch (error) {
        console.error('Erreur de parsing JSON pour manager_info:', error)
        return null
      }
    },
  })
  declare managerInfo: ManagerInfo | null

  // Déclaration d'existence (OPA uniquement)
  @column.date({ columnName: 'existence_declaration_date' })
  declare existenceDeclarationDate: DateTime | null

  @column({ columnName: 'existence_declaration_code' })
  declare existenceDeclarationCode: string | null

  @column({ columnName: 'existence_declaration_years' })
  declare existenceDeclarationYears: number | null

  @column.date({ columnName: 'existence_expiry_date' })
  declare existenceExpiryDate: DateTime | null

  // Workflow
  @column()
  declare status: ActorStatus

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

  @hasMany(() => User, {
    foreignKey: 'actorId',
  })
  declare users: HasMany<typeof User>

  @hasMany(() => Document, {
    foreignKey: 'documentableId',
    onQuery: (query) => query.where('documentable_type', 'actor'),
  })
  declare documents: HasMany<typeof Document>

  @hasMany(() => AuditLog, {
    foreignKey: 'auditableId',
    onQuery: (query) => query.where('auditable_type', 'actor'),
  })
  declare auditLogs: HasMany<typeof AuditLog>

  @hasMany(() => Metadata, {
    foreignKey: 'metadatableId',
    onQuery: (query) => query.where('metadatable_type', 'actor'),
  })
  declare metadata: HasMany<typeof Metadata>

  @hasMany(() => Parcel, {
    foreignKey: 'producerId',
  })
  declare parcels: HasMany<typeof Parcel>

  // Many-to-many relations for producers-OPA
  @manyToMany(() => Actor, {
    pivotTable: 'producer_opa',
    localKey: 'id',
    pivotForeignKey: 'producer_id',
    relatedKey: 'id',
    pivotRelatedForeignKey: 'opa_id',
    pivotColumns: ['membership_date', 'status'],
  })
  declare opas: ManyToMany<typeof Actor>

  @manyToMany(() => Actor, {
    pivotTable: 'producer_opa',
    localKey: 'id',
    pivotForeignKey: 'opa_id',
    relatedKey: 'id',
    pivotRelatedForeignKey: 'producer_id',
    pivotColumns: ['membership_date', 'status'],
  })
  declare producers: ManyToMany<typeof Actor>

  // Many-to-many relations for buyers-exporter (via exporter_mandates)
  @manyToMany(() => Actor, {
    pivotTable: 'exporter_mandates',
    localKey: 'id',
    pivotForeignKey: 'exporter_id',
    relatedKey: 'id',
    pivotRelatedForeignKey: 'buyer_id',
    pivotColumns: ['mandate_date', 'status', 'campaign_id'],
  })
  declare buyers: ManyToMany<typeof Actor>

  @manyToMany(() => Actor, {
    pivotTable: 'exporter_mandates',
    localKey: 'id',
    pivotForeignKey: 'buyer_id',
    relatedKey: 'id',
    pivotRelatedForeignKey: 'exporter_id',
    pivotColumns: ['mandate_date', 'status', 'campaign_id'],
  })
  declare exporters: ManyToMany<typeof Actor>

  // Relation avec les magasins
  @manyToMany(() => Store, {
    pivotTable: 'store_occupants',
    localKey: 'id',
    pivotForeignKey: 'actor_id',
    relatedKey: 'id',
    pivotRelatedForeignKey: 'store_id',
  })
  declare stores: ManyToMany<typeof Store>

  @hasMany(() => Convention, {
    foreignKey: 'producersId',
  })
  declare conventions: HasMany<typeof Convention>

  @hasMany(() => Calendar, {
    foreignKey: 'opaId',
  })
  declare calendars: HasMany<typeof Calendar>

  // Méthodes utilitaires
  public isActive(): boolean {
    return this.status === 'active'
  }

  public isProducer(): boolean {
    return this.actorType === 'PRODUCER'
  }

  public isOPA(): boolean {
    return this.actorType === 'PRODUCERS'
  }

  public isExistenceExpired(): boolean {
    if (!this.isOPA() || !this.existenceExpiryDate) {
      return false
    }
    return DateTime.now() > this.existenceExpiryDate
  }

  public async getMetadata(): Promise<Record<string, string>> {
    return await Metadata.getMetadataFor('actor', this.id)
  }

  public async setMetadata(key: string, value: string | undefined): Promise<Metadata | null> {
    return await Metadata.setMetadataFor('actor', this.id, key, value ?? '')
  }

  public async getParcelsWithCoordinates(): Promise<Parcel[]> {
    if (!this.isProducer()) {
      return []
    }

    return await Parcel.query()
      .where('producerId', this.id)
      .whereNull('deletedAt')
      .preload('coordinates', (coordinatesQuery) => {
        coordinatesQuery.orderBy('pointOrder', 'asc')
      })
      .orderBy('createdAt', 'desc')
  }
}
