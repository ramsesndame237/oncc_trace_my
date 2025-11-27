/**
 * Types pour le système d'audit avec valeurs JSON
 */

// Type pour les valeurs d'audit (flexibles, peuvent être n'importe quel type JSON)
export type AuditValue =
  | string
  | number
  | boolean
  | null
  | AuditValue[]
  | { [key: string]: AuditValue }

// Interface pour les valeurs d'audit d'une entité
export interface AuditValues {
  [fieldName: string]: AuditValue
}

// Interface pour les paramètres de la méthode logAction
export interface AuditLogParams {
  auditableType: string
  auditableId: string
  action: AuditAction
  userId?: string
  userRole?: string
  oldValues?: AuditValues | null
  newValues?: AuditValues | null
  ipAddress?: string
  userAgent?: string
}

// Champs sensibles à exclure automatiquement de l'audit
export const SENSITIVE_FIELDS: string[] = [
  'password',
  'token',
  'api_key',
  'secret',
  'private_key',
  'access_token',
  'refresh_token',
  'otp',
  'pin',
]

// Actions d'audit supportées
export type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'validate'
  | 'reject'
  | 'activate'
  | 'deactivate'
  | 'draft'
  | 'update_status'
  | 'admin_info_update'
  | 'admin_password_reset'
  | 'add_parcel'
  | 'update_parcel'
  | 'activate_parcel'
  | 'deactivate_parcel'
  | 'add_document'
  | 'update_document'
  | 'remove_document'
  | 'add_producer'
  | 'remove_producer'
  | 'add_buyer'
  | 'remove_buyer'
  | 'add_occupant'
  | 'remove_occupant'
  | 'associate_campaign'
  | 'dissociate_campaign'
  | 'status_update_calendar'
  | 'update_expected_sales_count'
  | 'update_products'
