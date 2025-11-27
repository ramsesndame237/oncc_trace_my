/**
 * Types pour le domaine outbox - gestion des opérations en attente
 */

import type { PendingOperation } from "@/core/infrastructure/database/db";

// ================================= FILTER TYPES =================================

export interface OutboxFilters {
  page?: number;
  limit?: number;
  search?: string;
  entityType?: string;
  operation?: "create" | "update" | "delete";
  status?: "pending" | "failed" | "all";
  dateFrom?: string;
  dateTo?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

// ================================= OPERATION TYPES =================================

export interface OutboxOperationSummary {
  total: number;
  pending: number;
  failed: number;
  byEntityType: Record<string, number>;
  byOperation: Record<string, number>;
}

export interface OutboxOperationDetails extends PendingOperation {
  // Données additionnelles calculées
  formattedPayload?: Record<string, unknown>;
  entityName?: string;
  canRetry?: boolean;
  canDelete?: boolean;
}

// ================================= ACTION TYPES =================================

export interface OutboxBulkAction {
  type: "delete" | "retry" | "sync";
  operationIds: (string | number)[];
  reason?: string;
}

export interface OutboxAuditLog {
  id: string;
  action: "delete" | "retry" | "sync";
  operationId: string | number;
  entityType: string;
  entityId: string;
  userId: string;
  timestamp: number;
  reason?: string;
  metadata?: Record<string, unknown>;
}

// ================================= SYNC TYPES =================================

export interface ForcedSyncOptions {
  operationId?: string | number;
  entityType?: string;
  entityId?: string;
  skipRetryLimit?: boolean;
}

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  syncProgress?: {
    current: number;
    total: number;
    entityType?: string;
  };
  lastSyncTime?: number;
  syncErrors: string[];
}

// ================================= API RESPONSE TYPES =================================

export interface GetOutboxOperationsResult {
  data: OutboxOperationDetails[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface DeleteOperationResult {
  success: boolean;
  deletedIds: (string | number)[];
  errors?: Array<{
    id: string | number;
    error: string;
  }>;
}

// ================================= CONFLICT TYPES =================================

/**
 * Conflit de localisation pour les bassins de production
 */
export interface LocationConflict {
  locationCode: string
  locationName: string
  basinId: string
  basinName: string
}

/**
 * Conflit hiérarchique pour les régions
 */
export interface RegionConflict {
  parentLocationCode: string;
  parentLocationName: string;
  parentType: string;
  conflictingChildren: Array<{
    locationCode: string;
    locationName: string;
    basinId: string;
    basinName: string;
  }>;
}

/**
 * Conflit hiérarchique pour les départements
 */
export interface DepartmentConflict {
  parentLocationCode: string;
  parentLocationName: string;
  parentType: string;
  conflictingChildren: Array<{
    locationCode: string;
    locationName: string;
    basinId: string;
    basinName: string;
  }>;
}

// ================================= ERROR TYPES =================================

export enum OutboxErrorCodes {
  OPERATION_NOT_FOUND = "OUTBOX_OPERATION_NOT_FOUND",
  OPERATION_ALREADY_PROCESSED = "OUTBOX_OPERATION_ALREADY_PROCESSED",
  BULK_DELETE_FAILED = "OUTBOX_BULK_DELETE_FAILED",
  SYNC_FAILED = "OUTBOX_SYNC_FAILED",
  INVALID_OPERATION_TYPE = "OUTBOX_INVALID_OPERATION_TYPE",
  INSUFFICIENT_PERMISSIONS = "OUTBOX_INSUFFICIENT_PERMISSIONS",
  OPERATION_LOCKED = "OUTBOX_OPERATION_LOCKED",
}

export const OutboxErrorMessages: Record<OutboxErrorCodes, string> = {
  [OutboxErrorCodes.OPERATION_NOT_FOUND]: "L'opération demandée n'a pas été trouvée",
  [OutboxErrorCodes.OPERATION_ALREADY_PROCESSED]: "Cette opération a déjà été traitée",
  [OutboxErrorCodes.BULK_DELETE_FAILED]: "Échec de la suppression en lot",
  [OutboxErrorCodes.SYNC_FAILED]: "Échec de la synchronisation",
  [OutboxErrorCodes.INVALID_OPERATION_TYPE]: "Type d'opération invalide",
  [OutboxErrorCodes.INSUFFICIENT_PERMISSIONS]: "Permissions insuffisantes pour cette action",
  [OutboxErrorCodes.OPERATION_LOCKED]: "L'opération est verrouillée et ne peut pas être modifiée",
};