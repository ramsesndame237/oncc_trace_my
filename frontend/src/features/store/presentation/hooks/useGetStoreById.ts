'use client'

import { useEffect, useState } from 'react'
import { StoreServiceProvider } from '../../infrastructure/di/storeServiceProvider'
import { type StoreWithSync } from '../../domain/store.domain.types'

/**
 * Hook pour récupérer un magasin par son ID
 */
export function useGetStoreById(id: string | null, isOnline: boolean = true) {
  const [currentStore, setCurrentStore] = useState<StoreWithSync | null>(null)
  const [isLoadingStore, setStoreLoading] = useState(false)
  const [storeError, setStoreError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      setCurrentStore(null)
      return
    }

    const fetchStore = async () => {
      setStoreLoading(true)
      setStoreError(null)

      try {
        const getStoreByIdUseCase = StoreServiceProvider.getGetStoreByIdUseCase()
        const store = await getStoreByIdUseCase.execute(id, isOnline)
        setCurrentStore(store)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
        setStoreError(errorMessage)
        setCurrentStore(null)
      } finally {
        setStoreLoading(false)
      }
    }

    fetchStore()
  }, [id, isOnline])

  // Fonction pour rafraîchir le magasin
  const refetch = () => {
    if (id) {
      const fetchStore = async () => {
        setStoreLoading(true)
        setStoreError(null)

        try {
          const getStoreByIdUseCase = StoreServiceProvider.getGetStoreByIdUseCase()
          const store = await getStoreByIdUseCase.execute(id, isOnline)
          setCurrentStore(store)
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
          setStoreError(errorMessage)
          setCurrentStore(null)
        } finally {
          setStoreLoading(false)
        }
      }

      fetchStore()
    }
  }

  return {
    store: currentStore,
    isLoading: isLoadingStore,
    error: storeError,
    refetch,
  }
}