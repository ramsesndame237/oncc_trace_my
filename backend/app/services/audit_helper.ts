import AuditLog from '#models/audit_log'
import { AuditService } from '#services/audit_service'
import { BaseModel } from '@adonisjs/lucid/orm'
import type { AuditAction, AuditValues } from '#types/audit_types'

/**
 * Helper pour simplifier l'usage de l'audit dans les contrôleurs
 */
export class AuditHelper {
  /**
   * Log une action avec des changements multiples (basé sur un objet de changements)
   */
  public static async logMultipleChanges(
    auditableType: string,
    auditableId: string,
    action: AuditAction,
    changedFields: Record<string, any>,
    originalValues: Record<string, any>,
    userId?: string,
    userRole?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuditLog> {
    const oldValues: AuditValues = {}
    const newValues: AuditValues = {}

    // Construire les objets old/new values à partir des changements
    for (const [field, newValue] of Object.entries(changedFields)) {
      oldValues[field] = originalValues[field] || null
      newValues[field] = newValue
    }

    return await AuditLog.logAction({
      auditableType,
      auditableId,
      action,
      userId,
      userRole,
      oldValues: AuditService.sanitizeForAudit(oldValues),
      newValues: AuditService.sanitizeForAudit(newValues),
      ipAddress,
      userAgent,
    })
  }

  /**
   * Log une action CREATE (nouvelle entité)
   */
  public static async logCreate(
    model: InstanceType<typeof BaseModel>,
    userId?: string,
    userRole?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuditLog> {
    const auditableType = model.constructor.name
    const newValues = AuditService.captureNewValues(model)

    return await AuditLog.logAction({
      auditableType,
      auditableId: model.$primaryKeyValue as string,
      action: 'create',
      userId,
      userRole,
      oldValues: null,
      newValues,
      ipAddress,
      userAgent,
    })
  }

  /**
   * Log une action UPDATE (modification d'entité)
   */
  public static async logUpdate(
    model: InstanceType<typeof BaseModel>,
    userId?: string,
    userRole?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuditLog> {
    const auditableType = model.constructor.name
    const { oldValues, newValues } = AuditService.captureModifiedValues(model)

    return await AuditLog.logAction({
      auditableType,
      auditableId: model.$primaryKeyValue as string,
      action: 'update',
      userId,
      userRole,
      oldValues,
      newValues,
      ipAddress,
      userAgent,
    })
  }

  /**
   * Log une action DELETE (suppression d'entité)
   */
  public static async logDelete(
    model: InstanceType<typeof BaseModel>,
    userId?: string,
    userRole?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuditLog> {
    const auditableType = model.constructor.name
    const oldValues = AuditService.captureOldValues(model)

    return await AuditLog.logAction({
      auditableType,
      auditableId: model.$primaryKeyValue as string,
      action: 'delete',
      userId,
      userRole,
      oldValues,
      newValues: null,
      ipAddress,
      userAgent,
    })
  }

  /**
   * Log une action personnalisée avec action spécifique
   */
  public static async logCustomAction(
    auditableType: string,
    auditableId: string,
    action: AuditAction,
    description: string,
    userId?: string,
    userRole?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuditLog> {
    return await AuditLog.logAction({
      auditableType,
      auditableId,
      action,
      userId,
      userRole,
      oldValues: null,
      newValues: { action_description: description },
      ipAddress,
      userAgent,
    })
  }
}
