import { useState, useCallback } from 'react';
import { ApiError } from '@/core/infrastructure/api';
import { DocumentServiceProvider } from '../../infrastructure/di/documentServiceProvider';
import type { Document, DocumentFilters } from '../../domain';
import type { PaginationMeta } from '@/core/domain/types';
import i18next from 'i18next';
import { getErrorTranslationKey } from '@/i18n/utils/getErrorMessage';

export interface UseDocumentReturn {
  documents: Document[];
  pagination: PaginationMeta | null;
  loading: boolean;
  error: string | null;
  loadDocuments: (filters: DocumentFilters) => Promise<void>;
  clearData: () => void;
}

export const useDocument = (isOnline: boolean = true): UseDocumentReturn => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getDocumentsUseCase = DocumentServiceProvider.getGetDocumentsUseCase();

  const loadDocuments = useCallback(async (filters: DocumentFilters) => {
    setLoading(true);
    setError(null);

    try {
      const data = await getDocumentsUseCase.execute(filters, isOnline);

      setDocuments(data.documents);
      setPagination(data.meta);
    } catch (err) {
      console.error('Error loading documents:', err);

      let errorMessage: string;

      if (err instanceof ApiError) {
        const errorKey = getErrorTranslationKey(err.code);
        errorMessage = i18next.t(errorKey as never);
      } else if (err instanceof Error) {
        errorMessage = err.message;
      } else {
        errorMessage = i18next.t('errors:unknown' as never);
      }

      setError(errorMessage);
      setDocuments([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [getDocumentsUseCase, isOnline]);

  const clearData = useCallback(() => {
    setDocuments([]);
    setPagination(null);
    setError(null);
  }, []);

  return {
    documents,
    pagination,
    loading,
    error,
    loadDocuments,
    clearData,
  };
};