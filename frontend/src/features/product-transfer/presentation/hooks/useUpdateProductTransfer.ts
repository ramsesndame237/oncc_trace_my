import { useCallback, useState } from 'react'
import { ProductTransferServiceProvider } from '../../infrastructure/di/productTransferServiceProvider'
import { useProductTransferStore } from '../../infrastructure/store/productTransferStore'
import type { UpdateProductTransferRequest } from '../../domain/types/request'

/**
 * Hook pour mettre à jour un transfert de produit
 * Gère le chargement et les erreurs
 */
export function useUpdateProductTransfer() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isOnline = useProductTransferStore((state) => state.isOnline)

  const updateProductTransfer = useCallback(
    async (id: string, payload: UpdateProductTransferRequest): Promise<void> => {
      setIsLoading(true)
      setError(null)

      try {
        const useCase = ProductTransferServiceProvider.getUpdateProductTransferUseCase()
        await useCase.execute(id, payload, isOnline)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue'
        setError(errorMessage)
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [isOnline]
  )

  return { updateProductTransfer, isLoading, error }
}
