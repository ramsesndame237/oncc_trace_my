import { useCallback, useEffect, useState } from 'react'
import { ProductTransferServiceProvider } from '../../infrastructure/di/productTransferServiceProvider'
import type { ProductTransferWithSync } from '../../domain'

/**
 * Hook pour récupérer un transfert de produit par son ID
 * Gère le chargement et les erreurs
 */
export function useGetProductTransferById(id: string, isOnline = true) {
  const [productTransfer, setProductTransfer] = useState<ProductTransferWithSync | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const getProductTransferByIdUseCase = ProductTransferServiceProvider.getGetProductTransferByIdUseCase()

  const fetchProductTransfer = useCallback(async () => {
    if (!id || id.trim() === '') {
      setIsLoading(false)
      setError('ID du transfert de produit invalide')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const fetchedProductTransfer = await getProductTransferByIdUseCase.execute(id, isOnline)
      setProductTransfer(fetchedProductTransfer)
      setError(null)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Erreur lors de la récupération du transfert de produit'
      )
      setProductTransfer(null)
    } finally {
      setIsLoading(false)
    }
  }, [id, isOnline, getProductTransferByIdUseCase])

  useEffect(() => {
    fetchProductTransfer()
  }, [fetchProductTransfer])

  return {
    productTransfer,
    isLoading,
    error,
    refetch: fetchProductTransfer,
  }
}
