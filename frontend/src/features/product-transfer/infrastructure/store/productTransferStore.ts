import { ApiError } from "@/core/infrastructure/api/client";
import { getErrorTranslationKey } from "@/i18n/utils/getErrorMessage";
import { showError } from "@/lib/notifications/toast";
import i18next from "i18next";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  ProductTransferFilters,
  ProductTransferState,
  ProductTransferStore,
  TransferStatus,
} from "../../domain";
import { ProductTransferErrorCodes } from "../../domain/types/codes";
import type {
  CreateProductTransferRequest,
  UpdateProductTransferRequest,
} from "../../domain/types/request";
import { ProductTransferServiceProvider } from "../di/productTransferServiceProvider";

const initialState: ProductTransferState = {
  productTransfers: [],
  meta: null,
  filters: {
    page: 1,
    per_page: 10,
  },
  isLoading: false,
  error: null,
  isOnline: true,
};

export const useProductTransferStore = create<ProductTransferStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setFilters: (filters) => {
        const currentFilters = get().filters;
        const updatedFilters = { ...currentFilters, ...filters };

        // Clean up only null and undefined values, keep empty strings
        Object.keys(updatedFilters).forEach((key) => {
          const value = updatedFilters[key as keyof ProductTransferFilters];
          if (value === null || value === undefined) {
            delete updatedFilters[key as keyof ProductTransferFilters];
          }
        });

        set({ filters: updatedFilters });

        // Auto-trigger data refresh
        get().fetchProductTransfers().catch(console.error);
      },

      fetchProductTransfers: async (forceOrFilters) => {
        const state = get();

        // Déterminer si c'est un force (boolean) ou des filtres
        const isForce =
          typeof forceOrFilters === "boolean" ? forceOrFilters : false;
        const additionalFilters =
          typeof forceOrFilters === "object" ? forceOrFilters : {};

        if (state.isLoading && !isForce) return;

        set({ isLoading: true, error: null });

        try {
          const getProductTransfersUseCase =
            ProductTransferServiceProvider.getGetProductTransfersUseCase();
          const filtersToUse = { ...state.filters, ...additionalFilters };
          const result = await getProductTransfersUseCase.execute(
            filtersToUse,
            state.isOnline
          );

          set({
            productTransfers: result.productTransfers,
            meta: result.meta,
            isLoading: false,
          });
        } catch (error) {
          console.error("Error fetching product transfers:", error);

          let errorMessage: string;
          if (error instanceof ApiError) {
            const errorKey = getErrorTranslationKey(error.errorCode);
            errorMessage = i18next.t(errorKey as never);
          } else if (error instanceof Error) {
            errorMessage = error.message;
          } else {
            const errorKey = getErrorTranslationKey(
              ProductTransferErrorCodes.PRODUCT_TRANSFER_LIST_ERROR
            );
            errorMessage = i18next.t(errorKey as never);
          }

          set({
            error: errorMessage,
            isLoading: false,
          });
        }
      },

      fetchProductTransferById: async (id: string) => {
        const state = get();

        try {
          const getProductTransferByIdUseCase =
            ProductTransferServiceProvider.getGetProductTransferByIdUseCase();
          const productTransfer = await getProductTransferByIdUseCase.execute(
            id,
            state.isOnline
          );
          return productTransfer;
        } catch (error) {
          console.error(`Error fetching product transfer ${id}:`, error);

          if (error instanceof ApiError) {
            const errorKey = getErrorTranslationKey(error.errorCode);
            showError(i18next.t(errorKey as never));
          } else if (error instanceof Error) {
            showError(error.message);
          } else {
            const errorKey = getErrorTranslationKey(
              ProductTransferErrorCodes.PRODUCT_TRANSFER_FETCH_ERROR
            );
            showError(i18next.t(errorKey as never));
          }
          return null;
        }
      },

      createProductTransfer: async (payload: CreateProductTransferRequest) => {
        const state = get();

        set({ isLoading: true, error: null });

        try {
          const createProductTransferUseCase =
            ProductTransferServiceProvider.getCreateProductTransferUseCase();
          await createProductTransferUseCase.execute(payload, state.isOnline);

          set({ isLoading: false });

          // Refresh the list to include the new transfer
          await get().fetchProductTransfers(true);
        } catch (error) {
          let errorMessage: string;
          if (error instanceof ApiError) {
            const errorKey = getErrorTranslationKey(error.errorCode);
            errorMessage = i18next.t(errorKey as never);
          } else if (error instanceof Error) {
            errorMessage = error.message;
          } else {
            const errorKey = getErrorTranslationKey(
              ProductTransferErrorCodes.PRODUCT_TRANSFER_CREATE_ERROR
            );
            errorMessage = i18next.t(errorKey as never);
          }

          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      updateProductTransfer: async (
        id: string,
        payload: UpdateProductTransferRequest,
        editOffline?: boolean
      ) => {
        set({ isLoading: true, error: null });

        try {
          const updateProductTransferUseCase =
            ProductTransferServiceProvider.getUpdateProductTransferUseCase();
          await updateProductTransferUseCase.execute(
            id,
            payload,
            editOffline
          );

          set({ isLoading: false });

          // Refresh the list to include the updates (sauf si editOffline)
          if (!editOffline) {
            await get().fetchProductTransfers(true);
          }
        } catch (error) {
          let errorMessage: string;
          if (error instanceof ApiError) {
            const errorKey = getErrorTranslationKey(error.errorCode);
            errorMessage = i18next.t(errorKey as never);
          } else if (error instanceof Error) {
            errorMessage = error.message;
          } else {
            const errorKey = getErrorTranslationKey(
              ProductTransferErrorCodes.PRODUCT_TRANSFER_UPDATE_ERROR
            );
            errorMessage = i18next.t(errorKey as never);
          }

          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      deleteProductTransfer: async (id: string) => {
        const state = get();

        set({ isLoading: true, error: null });

        try {
          const deleteProductTransferUseCase =
            ProductTransferServiceProvider.getDeleteProductTransferUseCase();
          await deleteProductTransferUseCase.execute(id, state.isOnline);

          set({ isLoading: false });

          // Refresh the list to remove the deleted transfer
          await get().fetchProductTransfers(true);
        } catch (error) {
          let errorMessage: string;
          if (error instanceof ApiError) {
            const errorKey = getErrorTranslationKey(error.errorCode);
            errorMessage = i18next.t(errorKey as never);
          } else if (error instanceof Error) {
            errorMessage = error.message;
          } else {
            const errorKey = getErrorTranslationKey(
              ProductTransferErrorCodes.PRODUCT_TRANSFER_DELETE_ERROR
            );
            errorMessage = i18next.t(errorKey as never);
          }

          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      updateTransferStatus: async (id: string, status: TransferStatus) => {
        const state = get();
        const isOnline = state.isOnline;

        if (!isOnline) {
          const errorKey = getErrorTranslationKey(
            ProductTransferErrorCodes.PRODUCT_TRANSFER_UPDATE_ERROR
          );
          const offlineError = i18next.t(errorKey as never);
          throw new Error(offlineError);
        }

        set({ isLoading: true, error: null });

        try {
          // Pour updateStatus, nous devons modifier le use case pour l'inclure
          // ou utiliser directement updateProductTransfer
          const updateProductTransferUseCase =
            ProductTransferServiceProvider.getUpdateProductTransferUseCase();
          await updateProductTransferUseCase.execute(id, { status }, isOnline);

          // Update the transfer in the local state
          const updatedTransfers = state.productTransfers.map((transfer) =>
            transfer.id === id ? { ...transfer, status } : transfer
          );

          set({ productTransfers: updatedTransfers, isLoading: false });

          // Refresh the list to ensure consistency
          await get().fetchProductTransfers(true);
        } catch (error) {
          let errorMessage: string;
          if (error instanceof ApiError) {
            const errorKey = getErrorTranslationKey(error.errorCode);
            errorMessage = i18next.t(errorKey as never);
          } else if (error instanceof Error) {
            errorMessage = error.message;
          } else {
            const errorKey = getErrorTranslationKey(
              ProductTransferErrorCodes.PRODUCT_TRANSFER_STATUS_UPDATE_FAILED
            );
            errorMessage = i18next.t(errorKey as never);
          }

          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },
    }),
    {
      name: "product-transfer-storage",
      partialize: (state) => ({
        filters: state.filters,
      }),
    }
  )
);

// Subscribe to online/offline events
if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    useProductTransferStore.setState({ isOnline: true });
  });

  window.addEventListener("offline", () => {
    useProductTransferStore.setState({ isOnline: false });
  });
}
