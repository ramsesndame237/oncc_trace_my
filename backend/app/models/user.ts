import Actor from '#models/actor'
import AuditLog from '#models/audit_log'
import ProductionBasin from '#models/production_basin'
import type { UserRole } from '#types/user_roles'
import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { compose } from '@adonisjs/core/helpers'
import hash from '@adonisjs/core/services/hash'
import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['username'],
  passwordColumnName: 'passwordHash',
})

export default class User extends compose(BaseModel, AuthFinder) {
  @column({ isPrimary: true })
  declare id: string

  @column({ columnName: 'username' })
  declare username: string

  @column({ columnName: 'family_name' })
  declare familyName: string

  @column({ columnName: 'given_name' })
  declare givenName: string

  @column()
  declare email: string

  @column()
  declare phone: string | null

  @column({ serializeAs: null })
  declare passwordHash: string

  @column()
  declare role: UserRole

  @column()
  declare position: string | null

  @column({ columnName: 'production_basin_id' })
  declare productionBasinId: string | null

  @column({ columnName: 'lang' })
  declare lang: 'fr' | 'en'

  @column({ columnName: 'status' })
  declare status: 'active' | 'inactive' | 'blocked'

  // Questions de sécurité
  @column({ columnName: 'security_question_1' })
  declare securityQuestion1: string | null

  @column({ columnName: 'security_answer_1_hash', serializeAs: null })
  declare securityAnswer1Hash: string | null

  @column({ columnName: 'security_question_2' })
  declare securityQuestion2: string | null

  @column({ columnName: 'security_answer_2_hash', serializeAs: null })
  declare securityAnswer2Hash: string | null

  @column({ columnName: 'security_question_3' })
  declare securityQuestion3: string | null

  @column({ columnName: 'security_answer_3_hash', serializeAs: null })
  declare securityAnswer3Hash: string | null

  // Gestion de la sécurité
  @column.dateTime()
  declare passwordChangedAt: DateTime | null

  @column({ columnName: 'must_change_password' })
  declare mustChangePassword: boolean

  // Link to actor for STORE_MANAGER accounts
  @column({ columnName: 'actor_id' })
  declare actorId: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column.dateTime()
  declare deletedAt: DateTime | null

  // Relations
  @belongsTo(() => Actor, {
    foreignKey: 'actorId',
  })
  declare actor: BelongsTo<typeof Actor>

  @belongsTo(() => ProductionBasin, {
    foreignKey: 'productionBasinId',
  })
  declare productionBasin: BelongsTo<typeof ProductionBasin>

  @hasMany(() => AuditLog, {
    foreignKey: 'userId',
  })
  declare auditLogs: HasMany<typeof AuditLog>

  // Provider pour les access tokens
  static accessTokens = DbAccessTokensProvider.forModel(User, {
    expiresIn: '30 days',
    prefix: 'sifc_',
    table: 'auth_access_tokens',
    type: 'auth_token',
    tokenSecretLength: 40,
  })

  // Méthodes utilitaires
  public async hasRole(roleName: string): Promise<boolean> {
    return this.role === roleName
  }

  public isActive(): boolean {
    return this.status === 'active'
  }

  public mustChangePasswordOnLogin(): boolean {
    return this.mustChangePassword
  }
}
