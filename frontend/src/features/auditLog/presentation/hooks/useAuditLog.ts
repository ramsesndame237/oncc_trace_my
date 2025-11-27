import { useState, useCallback } from 'react';
import { ApiError } from '@/core/infrastructure/api';
import i18next from 'i18next';
import { getErrorTranslationKey } from '@/i18n/utils/getErrorMessage';
import { AuditLogServiceProvider } from '../../infrastructure/di/auditLogServiceProvider';
import type { AuditLog, AuditLogFilters } from '../../domain';
import type { PaginationMeta } from '@/core/domain/types';

export interface UseAuditLogReturn {
  logs: AuditLog[];
  pagination: PaginationMeta | null;
  loading: boolean;
  error: string | null;
  loadAuditLogs: (filters: AuditLogFilters) => Promise<void>;
  clearData: () => void;
}

export const useAuditLog = (isOnline: boolean = true): UseAuditLogReturn => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAuditLogsUseCase = AuditLogServiceProvider.getGetAuditLogsUseCase();

  const loadAuditLogs = useCallback(async (filters: AuditLogFilters) => {
    setLoading(true);
    setError(null);

    try {
      const data = await getAuditLogsUseCase.execute(filters, isOnline);
      
      setLogs(data.logs);
      setPagination(data.meta);
    } catch (err) {
      console.error('Error loading audit logs:', err);

      let errorMessage: string;
      if (err instanceof ApiError) {
        const errorKey = getErrorTranslationKey(err.errorCode);
        errorMessage = i18next.t(errorKey as never);
      } else if (err instanceof Error) {
        errorMessage = err.message;
      } else {
        const errorKey = getErrorTranslationKey('AUDIT_LOG_LIST_FAILED');
        errorMessage = i18next.t(errorKey as never);
      }

      setError(errorMessage);
      setLogs([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [getAuditLogsUseCase, isOnline]);

  const clearData = useCallback(() => {
    setLogs([]);
    setPagination(null);
    setError(null);
  }, []);

  return {
    logs,
    pagination,
    loading,
    error,
    loadAuditLogs,
    clearData,
  };
};