import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import i18next from 'i18next'
import type { TransactionStore, TransactionState } from '../../domain/store.types'
import type { TransactionFilters } from '../../domain/Transaction'
import { TransactionServiceProvider } from '../di/transactionServiceProvider'

const initialState: TransactionState = {
  transactions: [],
  meta: null,
  filters: {
    page: 1,
    perPage: 10,
  },
  isLoading: false,
  error: null,
  isOnline: typeof window !== 'undefined' ? navigator.onLine : true,
}

export const useTransactionStore = create<TransactionStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setFilters: (filters: Partial<TransactionFilters>) => {
        const currentFilters = get().filters
        const newFilters: TransactionFilters = { ...currentFilters }

        Object.keys(filters).forEach((key) => {
          const filterKey = key as keyof TransactionFilters
          const value = filters[filterKey]

          if (value === null || value === undefined || value === '') {
            delete newFilters[filterKey]
          } else {
            newFilters[filterKey] = value as never
          }
        })

        if (filters.page === undefined && Object.keys(filters).length > 0) {
          newFilters.page = 1
        }

        set({ filters: newFilters })

        get().fetchTransactions()
      },

      fetchTransactions: async (forceOrFilters) => {
        set({ isLoading: true, error: null })

        try {
          let filters = get().filters

          if (typeof forceOrFilters === 'object') {
            filters = { ...filters, ...forceOrFilters }
            set({ filters })
          }

          const getTransactionsUseCase =
            TransactionServiceProvider.getGetTransactionsUseCase()

          const isOnline = get().isOnline
          const result = await getTransactionsUseCase.execute(filters, isOnline)

          set({
            transactions: result.transactions,
            meta: result.meta,
            isLoading: false,
          })
        } catch (error: unknown) {
          console.error('Error fetching transactions:', error)
          set({
            error: i18next.t('transaction:errors.fetchFailed'),
            isLoading: false,
          })
        }
      },

      clearError: () => {
        set({ error: null })
      },
    }),
    {
      name: 'transaction-filters-storage',
      partialize: (state) => ({
        filters: state.filters,
      }),
    }
  )
)

// Online/offline listeners
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    useTransactionStore.setState({ isOnline: true })
  })

  window.addEventListener('offline', () => {
    useTransactionStore.setState({ isOnline: false })
  })
}
