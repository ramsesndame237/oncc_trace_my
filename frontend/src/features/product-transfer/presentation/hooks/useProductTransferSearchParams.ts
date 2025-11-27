import { usePathname, useRouter, useSearchParams as useNextSearchParams } from 'next/navigation'
import { useCallback, useMemo } from 'react'
import type { ProductTransferFilters } from '../../domain'

/**
 * Interface pour les paramètres de recherche des transferts de produit
 */
export interface ProductTransferSearchParams {
  page: number
  per_page: number
  search: string
  transferType?: string
  status?: string
}

/**
 * Hook personnalisé pour gérer les paramètres de recherche dans l'URL
 */
export function useProductTransferSearchParams() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useNextSearchParams()

  // Parser les paramètres actuels
  const currentParams = useMemo<ProductTransferSearchParams>(() => {
    const page = Number.parseInt(searchParams.get('page') || '1', 10)
    const per_page = Number.parseInt(searchParams.get('per_page') || '10', 10)
    const search = searchParams.get('search') || ''
    const transferType = searchParams.get('transferType') || undefined
    const status = searchParams.get('status') || undefined

    return {
      page,
      per_page,
      search,
      transferType,
      status,
    }
  }, [searchParams])

  // Mettre à jour les paramètres de recherche
  const setSearchParams = useCallback(
    (newParams: Partial<ProductTransferSearchParams>) => {
      const params = new URLSearchParams(searchParams)

      // Mettre à jour les paramètres fournis
      Object.entries(newParams).forEach(([key, value]) => {
        if (value === undefined || value === '' || value === null) {
          params.delete(key)
        } else {
          params.set(key, String(value))
        }
      })

      router.push(`${pathname}?${params.toString()}`)
    },
    [router, pathname, searchParams]
  )

  return [currentParams, setSearchParams] as const
}

/**
 * Convertit les search params en filtres du store
 */
export function searchParamsToFilters(
  params: ProductTransferSearchParams
): ProductTransferFilters {
  const filters: ProductTransferFilters = {
    page: params.page,
    per_page: params.per_page,
  }

  // Toujours définir search, même si vide, pour override le store persisté
  if (params.search && params.search.trim() !== '') {
    filters.search = params.search.trim()
  } else {
    filters.search = undefined
  }

  if (params.transferType) {
    filters.transferType = params.transferType as 'GROUPAGE' | 'STANDARD'
  }

  if (params.status) {
    filters.status = params.status as 'pending' | 'validated' | 'cancelled'
  }

  return filters
}

/**
 * Réinitialise les paramètres de recherche
 */
export function resetSearchParams(
  setSearchParams: (params: Partial<ProductTransferSearchParams>) => void
) {
  setSearchParams({
    page: 1,
    per_page: 10,
    search: '',
    transferType: undefined,
    status: undefined,
  })
}
