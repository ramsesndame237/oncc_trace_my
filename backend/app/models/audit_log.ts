import User from '#models/user'
import type { AuditAction } from '#types/audit_types'
import { AuditLogParams, AuditValues } from '#types/audit_types'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'

export default class AuditLog extends BaseModel {
  static table = 'audit_logs'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare auditableType: string

  @column()
  declare auditableId: string

  @column()
  declare userId: string | null

  @column()
  declare userRole: string | null

  @column()
  declare action: AuditAction

  @column({
    prepare: (value: AuditValues | null) => (value ? JSON.stringify(value) : null),
    consume: (value: string | null | object) => {
      if (!value) return null
      // Si c'est déjà un objet, le retourner directement
      if (typeof value === 'object') return value as AuditValues
      // Sinon, essayer de parser le JSON
      try {
        return JSON.parse(value as string)
      } catch (error) {
        console.error('Erreur parsing JSON oldValues:', error, 'Value:', value)
        return null
      }
    },
  })
  declare oldValues: AuditValues | null

  @column({
    prepare: (value: AuditValues | null) => (value ? JSON.stringify(value) : null),
    consume: (value: string | null | object) => {
      if (!value) return null
      // Si c'est déjà un objet, le retourner directement
      if (typeof value === 'object') return value as AuditValues
      // Sinon, essayer de parser le JSON
      try {
        return JSON.parse(value as string)
      } catch (error) {
        console.error('Erreur parsing JSON newValues:', error, 'Value:', value)
        return null
      }
    },
  })
  declare newValues: AuditValues | null

  @column()
  declare ipAddress: string | null

  @column()
  declare userAgent: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  // Relations
  @belongsTo(() => User, {
    foreignKey: 'userId',
  })
  declare user: BelongsTo<typeof User>

  // Méthodes utilitaires

  public static async logAction(params: AuditLogParams): Promise<AuditLog> {
    return await AuditLog.create({
      auditableType: params.auditableType,
      auditableId: params.auditableId,
      userId: params.userId,
      userRole: params.userRole,
      action: params.action,
      oldValues: params.oldValues,
      newValues: params.newValues,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    })
  }

  public static async getHistoryFor(
    auditableType: string,
    auditableId: string,
    limit: number = 50
  ): Promise<AuditLog[]> {
    return await AuditLog.query()
      .where('auditable_type', auditableType)
      .where('auditable_id', auditableId)
      .preload('user')
      .orderBy('created_at', 'desc')
      .limit(limit)
  }

  public static async getHistoryWithPagination(
    auditableType: string,
    auditableId: string,
    page: number = 1,
    limit: number = 20
  ) {
    return await AuditLog.query()
      .where('auditable_type', auditableType)
      .where('auditable_id', auditableId)
      .preload('user')
      .orderBy('created_at', 'desc')
      .paginate(page, limit)
  }

  public getFormattedAction(): string {
    const actionMap: Record<string, string> = {
      create: 'Création',
      update: 'Modification',
      delete: 'Suppression',
      validate: 'Validation',
      reject: 'Rejet',
      activate: 'Activation',
      deactivate: 'Désactivation',
      admin_info_update: 'Mise à jour des informations admin',
      admin_password_reset: 'Réinitialisation du mot de passe admin',
      add_parcel: 'Ajout de parcelle',
      add_document: 'Ajout de document',
      remove_document: 'Suppression de document',
      add_producer: 'Ajout de producteur',
      remove_producer: 'Retrait de producteur',
      add_occupant: "Ajout d'occupant",
      remove_occupant: "Retrait d'occupant",
      associate_campaign: 'Association à une campagne',
      dissociate_campaign: "Dissociation d'une campagne",
    }

    return actionMap[this.action] || this.action
  }

  /**
   * Retourne les champs modifiés avec leurs anciennes et nouvelles valeurs
   */
  public getChangedFields(): { field: string; oldValue: any; newValue: any }[] {
    if (!this.oldValues || !this.newValues) {
      return []
    }

    const changes: { field: string; oldValue: any; newValue: any }[] = []
    const allFields = new Set([...Object.keys(this.oldValues), ...Object.keys(this.newValues)])

    for (const field of allFields) {
      const oldValue = this.oldValues[field]
      const newValue = this.newValues[field]

      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changes.push({ field, oldValue, newValue })
      }
    }

    return changes
  }

  /**
   * Vérifie si un champ spécifique a été modifié
   */
  public hasFieldChanged(fieldName: string): boolean {
    if (!this.oldValues || !this.newValues) {
      return false
    }

    const oldValue = this.oldValues[fieldName]
    const newValue = this.newValues[fieldName]

    return JSON.stringify(oldValue) !== JSON.stringify(newValue)
  }

  /**
   * Retourne la valeur d'un champ avant modification
   */
  public getOldValue(fieldName: string): any {
    return this.oldValues?.[fieldName] || null
  }

  /**
   * Retourne la valeur d'un champ après modification
   */
  public getNewValue(fieldName: string): any {
    return this.newValues?.[fieldName] || null
  }
}
