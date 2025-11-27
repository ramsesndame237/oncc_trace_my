/**
 * Exports publics de la feature AuditLog
 * Gestion des logs d'audit avec DataTable et pagination
 */

// Domain
export * from './domain';

// Application
export * from './application';

// Infrastructure
export { AuditLogService, AuditLogRepository, AuditLogServiceProvider } from './infrastructure';

// Composants
export { AuditLogTable } from './presentation/components/AuditLogTable'
export { AuditLogChangesModal } from './presentation/components/AuditLogChangesModal'

// Hooks
export {
  useAuditLog,
  type UseAuditLogReturn,
} from './presentation/hooks/useAuditLog'