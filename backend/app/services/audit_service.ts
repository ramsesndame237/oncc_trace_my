import { BaseModel } from '@adonisjs/lucid/orm'
import { AuditValues, SENSITIVE_FIELDS, AuditValue } from '#types/audit_types'

export class AuditService {
  /**
   * Nettoie un objet en excluant les champs sensibles
   */
  public static sanitizeForAudit(data: Record<string, any>): AuditValues {
    const sanitized: AuditValues = {}

    for (const [key, value] of Object.entries(data)) {
      // Exclure les champs sensibles
      if (SENSITIVE_FIELDS.some((field) => key.toLowerCase().includes(field.toLowerCase()))) {
        continue
      }

      // Exclure les relations (objets complexes avec des propriétés model)
      if (
        value &&
        typeof value === 'object' &&
        value.constructor.name !== 'Object' &&
        value.constructor.name !== 'Array'
      ) {
        continue
      }

      // Exclure les dates de timestamp automatiques si pas modifiées
      if (key === 'createdAt' || key === 'updatedAt') {
        continue
      }

      sanitized[key] = this.sanitizeValue(value)
    }

    return sanitized
  }

  /**
   * Nettoie une valeur individuelle
   */
  private static sanitizeValue(value: any): AuditValue {
    if (value === null || value === undefined) {
      return null
    }

    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return value
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.sanitizeValue(item))
    }

    if (typeof value === 'object' && value.constructor.name === 'Object') {
      const sanitized: { [key: string]: AuditValue } = {}
      for (const [key, val] of Object.entries(value)) {
        sanitized[key] = this.sanitizeValue(val)
      }
      return sanitized
    }

    // Pour les autres types (Date, etc.), convertir en string
    return String(value)
  }

  /**
   * Capture les valeurs avant modification d'un modèle
   */
  public static captureOldValues(model: InstanceType<typeof BaseModel>): AuditValues | null {
    if (model.$isNew) {
      return null // Nouveau modèle, pas de valeurs précédentes
    }

    const attributes = model.$attributes
    return this.sanitizeForAudit(attributes)
  }

  /**
   * Capture les valeurs après modification d'un modèle
   */
  public static captureNewValues(model: InstanceType<typeof BaseModel>): AuditValues | null {
    if (model.$isDeleted) {
      return null // Modèle supprimé, pas de nouvelles valeurs
    }

    const attributes = model.$attributes
    return this.sanitizeForAudit(attributes)
  }

  /**
   * Capture seulement les champs modifiés
   */
  public static captureModifiedValues(model: InstanceType<typeof BaseModel>): {
    oldValues: AuditValues | null
    newValues: AuditValues | null
  } {
    if (model.$isNew) {
      return {
        oldValues: null,
        newValues: this.captureNewValues(model),
      }
    }

    if (model.$isDeleted) {
      return {
        oldValues: this.captureOldValues(model),
        newValues: null,
      }
    }

    const dirty = model.$dirty
    if (Object.keys(dirty).length === 0) {
      return { oldValues: null, newValues: null }
    }

    const oldValues: AuditValues = {}
    const newValues: AuditValues = {}

    for (const [key, newValue] of Object.entries(dirty)) {
      // Récupérer l'ancienne valeur depuis $original
      const oldValue = model.$original[key]

      oldValues[key] = this.sanitizeValue(oldValue)
      newValues[key] = this.sanitizeValue(newValue)
    }

    return {
      oldValues: this.sanitizeForAudit(oldValues),
      newValues: this.sanitizeForAudit(newValues),
    }
  }
}
