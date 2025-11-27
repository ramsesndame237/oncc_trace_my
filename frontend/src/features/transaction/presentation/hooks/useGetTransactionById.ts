import { useCallback, useEffect, useState } from "react";
import { TransactionServiceProvider } from "../../infrastructure/di/transactionServiceProvider";
import type { TransactionWithSync } from "../../domain/Transaction";

/**
 * Hook pour récupérer une transaction par son ID
 * Gère le chargement et les erreurs
 */
export function useGetTransactionById(id: string, isOnline = true) {
  const [transaction, setTransaction] = useState<TransactionWithSync | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getTransactionByIdUseCase =
    TransactionServiceProvider.getGetTransactionByIdUseCase();

  const fetchTransaction = useCallback(async () => {
    if (!id || id.trim() === "") {
      setIsLoading(false);
      setError("ID de la transaction invalide");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const fetchedTransaction = await getTransactionByIdUseCase.execute(
        id,
        isOnline
      );
      setTransaction(fetchedTransaction);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors de la récupération de la transaction"
      );
      setTransaction(null);
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isOnline]);

  useEffect(() => {
    fetchTransaction();
  }, [fetchTransaction]);

  return {
    transaction,
    isLoading,
    error,
    refetch: fetchTransaction,
  };
}
