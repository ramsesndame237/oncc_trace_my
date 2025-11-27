import type {
  CreateParcelsBulkData,
  ParcelStatus,
  UpdateParcelData,
} from "@/features/parcel/domain/parcel.types";
import { ApiError } from "@/core/infrastructure/api/client";
import {
  getErrorTranslationKey,
  getSuccessTranslationKey,
} from "@/i18n/utils/getErrorMessage";
import { showError, showSuccess } from "@/lib/notifications/toast";
import i18next from "i18next";
import { create } from "zustand";
import type { ParcelState, ParcelStore } from "../../domain/store.types";
import { ParcelServiceProvider } from "../di/parcelServiceProvider";

const initialState: ParcelState = {
  parcels: [],
  selectedParcel: null,
  isLoading: false,
  error: null,
};

export const useParcelStore = create<ParcelStore>((set) => ({
  ...initialState,

  setSelectedParcel: (parcel) => {
    set({ selectedParcel: parcel });
  },

  createParcelsBulk: async (data: CreateParcelsBulkData, entityId?: string) => {
    set({ isLoading: true, error: null });

    try {
      const createParcelsBulkUseCase =
        ParcelServiceProvider.getCreateParcelsBulkUseCase();
      await createParcelsBulkUseCase.execute(data, entityId);

      set({ isLoading: false });

      const successKey = getSuccessTranslationKey("PARCEL_CREATED");
      showSuccess(i18next.t(successKey as never));
    } catch (error) {
      console.error("Error creating parcels:", error);

      let errorMessage: string;
      if (error instanceof ApiError) {
        const errorKey = getErrorTranslationKey(error.errorCode);
        errorMessage = i18next.t(errorKey as never);
      } else if (error instanceof Error) {
        errorMessage = error.message;
      } else {
        const errorKey = getErrorTranslationKey("PARCEL_CREATION_FAILED");
        errorMessage = i18next.t(errorKey as never);
      }

      set({
        error: errorMessage,
        isLoading: false,
      });

      showError(errorMessage);
      throw error;
    }
  },

  updateParcel: async (
    parcelId: string,
    data: UpdateParcelData,
    entityId?: string
  ) => {
    set({ isLoading: true, error: null });

    try {
      const updateParcelUseCase =
        ParcelServiceProvider.getUpdateParcelUseCase();
      await updateParcelUseCase.execute(parcelId, data, entityId);

      set({ isLoading: false });

      const successKey = getSuccessTranslationKey("PARCEL_UPDATED");
      showSuccess(i18next.t(successKey as never));
    } catch (error) {
      console.error("Error updating parcel:", error);

      let errorMessage: string;
      if (error instanceof ApiError) {
        const errorKey = getErrorTranslationKey(error.errorCode);
        errorMessage = i18next.t(errorKey as never);
      } else if (error instanceof Error) {
        errorMessage = error.message;
      } else {
        const errorKey = getErrorTranslationKey("PARCEL_UPDATE_FAILED");
        errorMessage = i18next.t(errorKey as never);
      }

      set({
        error: errorMessage,
        isLoading: false,
      });

      showError(errorMessage);
      throw error;
    }
  },

  updateParcelStatus: async (parcelId: string, status: ParcelStatus) => {
    set({ isLoading: true, error: null });

    try {
      const updateParcelStatusUseCase =
        ParcelServiceProvider.getUpdateParcelStatusUseCase();
      await updateParcelStatusUseCase.execute(parcelId, status);

      set({ isLoading: false });

      const successCode =
        status === "active" ? "PARCEL_ACTIVATED" : "PARCEL_DEACTIVATED";
      const successKey = getSuccessTranslationKey(successCode);
      showSuccess(i18next.t(successKey as never));
    } catch (error) {
      console.error("Error updating parcel status:", error);

      let errorMessage: string;
      if (error instanceof ApiError) {
        const errorKey = getErrorTranslationKey(error.errorCode);
        errorMessage = i18next.t(errorKey as never);
      } else if (error instanceof Error) {
        errorMessage = error.message;
      } else {
        const errorKey = getErrorTranslationKey("PARCEL_STATUS_UPDATE_FAILED");
        errorMessage = i18next.t(errorKey as never);
      }

      set({
        error: errorMessage,
        isLoading: false,
      });

      showError(errorMessage);
      throw error;
    }
  },
}));
