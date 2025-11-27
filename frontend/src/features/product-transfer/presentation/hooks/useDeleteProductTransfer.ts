import { useCallback, useState } from 'react'
import { ProductTransferServiceProvider } from '../../infrastructure/di/productTransferServiceProvider'
import { useProductTransferStore } from '../../infrastructure/store/productTransferStore'

/**
 * Hook pour supprimer un transfert de produit
 * Gère le chargement et les erreurs
 */
export function useDeleteProductTransfer() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isOnline = useProductTransferStore((state) => state.isOnline)

  const deleteProductTransfer = useCallback(
    async (id: string): Promise<void> => {
      setIsLoading(true)
      setError(null)

      try {
        const useCase = ProductTransferServiceProvider.getDeleteProductTransferUseCase()
        await useCase.execute(id, isOnline)
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

  return { deleteProductTransfer, isLoading, error }
}
