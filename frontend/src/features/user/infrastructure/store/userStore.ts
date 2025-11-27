import { ApiError } from "@/core/infrastructure/api/client";
import {
  getErrorTranslationKey,
  getSuccessTranslationKey,
} from "@/i18n/utils/getErrorMessage";
import { showError, showSuccess } from "@/lib/notifications/toast";
import i18next from "i18next";
import { create } from "zustand";
import { UserFilters, UserState, UserStore } from "../../domain";
import {
  CreateUserRequest,
  UpdateUserRequest,
} from "../../domain/types/request";
import { UserServiceProvider } from "../di/userServiceProvider";

const initialState: UserState = {
  users: [],
  meta: null,
  filters: {
    page: 1,
    per_page: 10,
  },
  isLoading: false,
  error: null,
  isOnline: true,
};

export const useUserStore = create<UserStore>((set, get) => ({
  ...initialState,

  setFilters: (filters) => {
    const currentFilters = get().filters;
    const updatedFilters = { ...currentFilters, ...filters };

    // Clean up only null and undefined values, keep empty strings
    Object.keys(updatedFilters).forEach((key) => {
      const value = updatedFilters[key as keyof UserFilters];
      if (value === null || value === undefined) {
        delete updatedFilters[key as keyof UserFilters];
      }
    });

    set({ filters: updatedFilters });

    // Auto-trigger data refresh
    get().fetchUsers().catch(console.error);
  },

  fetchUsers: async (force = false) => {
    const state = get();
    if (state.isLoading && !force) return;

    set({ isLoading: true, error: null });

    try {
      const getUsersUseCase = UserServiceProvider.getGetUsersUseCase();
      const result = await getUsersUseCase.execute(
        state.filters,
        state.isOnline
      );

      set({
        users: result.users,
        meta: result.meta,
        isLoading: false,
      });
    } catch (error) {
      console.error("Error fetching users:", error);

      let errorMessage: string;
      if (error instanceof ApiError) {
        const errorKey = getErrorTranslationKey(error.errorCode);
        errorMessage = i18next.t(errorKey as never);
      } else if (error instanceof Error) {
        errorMessage = error.message;
      } else {
        const errorKey = getErrorTranslationKey("USER_LIST_FAILED");
        errorMessage = i18next.t(errorKey as never);
      }

      set({ error: errorMessage, isLoading: false });
    }
  },

  fetchUserById: async (id: string) => {
    const state = get();

    try {
      const getUserByIdUseCase = UserServiceProvider.getGetUserByIdUseCase();
      const user = await getUserByIdUseCase.execute(id, state.isOnline);
      return user;
    } catch (error) {
      console.error("Error fetching user by id:", error);

      let errorMessage: string;
      if (error instanceof ApiError) {
        const errorKey = getErrorTranslationKey(error.errorCode);
        errorMessage = i18next.t(errorKey as never);
      } else if (error instanceof Error) {
        errorMessage = error.message;
      } else {
        const errorKey = getErrorTranslationKey("USER_NOT_FOUND");
        errorMessage = i18next.t(errorKey as never);
      }

      set({ error: errorMessage });
      return null;
    }
  },

  createUser: async (userData: CreateUserRequest) => {
    try {
      const createUserUseCase = UserServiceProvider.getCreateUserUseCase();
      await createUserUseCase.execute(userData);

      // Afficher un message de succès
      const successKey = getSuccessTranslationKey("USER_CREATED");
      showSuccess(i18next.t(successKey as never));

      // Rafraîchir la liste des utilisateurs
      await get().fetchUsers(true);
    } catch (error) {
      console.error("Error creating user:", error);

      let errorMessage: string;
      if (error instanceof ApiError) {
        const errorKey = getErrorTranslationKey(error.errorCode);
        errorMessage = i18next.t(errorKey as never);
      } else if (error instanceof Error) {
        errorMessage = error.message;
      } else {
        const errorKey = getErrorTranslationKey("USER_CREATE_FAILED");
        errorMessage = i18next.t(errorKey as never);
      }

      set({ error: errorMessage });
      showError(errorMessage);
      throw error;
    }
  },

  updateUser: async (
    id: string,
    userData: UpdateUserRequest,
    isOnline: boolean
  ) => {
    try {
      // Ne pas mettre isLoading à true ici car cela bloque fetchUsers
      set({ error: null });
      const updateUserUseCase = UserServiceProvider.getUpdateUserUseCase();
      await updateUserUseCase.execute(id, userData, isOnline);

      // Afficher un message de succès
      const successKey = getSuccessTranslationKey("USER_UPDATED");
      showSuccess(i18next.t(successKey as never));

      // Rafraîchir la liste des utilisateurs pour obtenir le nouvel état
      // Force le rechargement même si isLoading était déjà à true
      await get().fetchUsers(true);
    } catch (error) {
      console.error("Error updating user:", error);

      let errorMessage: string;
      if (error instanceof ApiError) {
        const errorKey = getErrorTranslationKey(error.errorCode);
        errorMessage = i18next.t(errorKey as never);
      } else if (error instanceof Error) {
        errorMessage = error.message;
      } else {
        const errorKey = getErrorTranslationKey("USER_UPDATE_FAILED");
        errorMessage = i18next.t(errorKey as never);
      }

      set({ error: errorMessage });
      showError(errorMessage);
      throw error;
    }
  },

  updateUserStatus: async (
    userId: string,
    status: "active" | "inactive" | "blocked",
    reason?: string
  ) => {
    const state = get();
    const isOnline = state.isOnline;

    if (!isOnline) {
      const errorKey = getErrorTranslationKey("SYSTEM_NETWORK_ERROR");
      throw new Error(i18next.t(errorKey as never));
    }

    set({ isLoading: true, error: null });

    try {
      const updateUserStatusUseCase =
        UserServiceProvider.getUpdateUserStatusUseCase();
      const updatedUser = await updateUserStatusUseCase.execute(
        userId,
        status,
        reason
      );

      // Update the user in the local state
      const updatedUsers = state.users.map((user) =>
        user.id === userId ? { ...user, status } : user
      );

      set({ users: updatedUsers, isLoading: false });

      // Refresh the list to ensure consistency
      await get().fetchUsers(true);

      // Afficher un message de succès
      const successKey = getSuccessTranslationKey("USER_STATUS_UPDATED");
      showSuccess(i18next.t(successKey as never));
      return updatedUser;
    } catch (error) {
      let errorMessage: string;
      if (error instanceof ApiError) {
        const errorKey = getErrorTranslationKey(error.errorCode);
        errorMessage = i18next.t(errorKey as never);
      } else if (error instanceof Error) {
        errorMessage = error.message;
      } else {
        const errorKey = getErrorTranslationKey("USER_STATUS_UPDATE_FAILED");
        errorMessage = i18next.t(errorKey as never);
      }

      set({ error: errorMessage, isLoading: false });
      showError(errorMessage);
      throw error;
    }
  },

  resetUserPassword: async (userId: string) => {
    const state = get();
    const isOnline = state.isOnline;

    if (!isOnline) {
      const errorKey = getErrorTranslationKey("SYSTEM_NETWORK_ERROR");
      throw new Error(i18next.t(errorKey as never));
    }

    set({ isLoading: true, error: null });

    try {
      const resetUserPasswordUseCase =
        UserServiceProvider.getResetUserPasswordUseCase();
      const updatedUser = await resetUserPasswordUseCase.execute(userId);

      set({ isLoading: false });

      // Refresh the list to ensure consistency
      await get().fetchUsers(true);

      const successKey = getSuccessTranslationKey("USER_PASSWORD_RESET");
      showSuccess(i18next.t(successKey as never));
      return updatedUser;
    } catch (error) {
      let errorMessage: string;
      if (error instanceof ApiError) {
        const errorKey = getErrorTranslationKey(error.errorCode);
        errorMessage = i18next.t(errorKey as never);
      } else if (error instanceof Error) {
        errorMessage = error.message;
      } else {
        const errorKey = getErrorTranslationKey("USER_PASSWORD_RESET_FAILED");
        errorMessage = i18next.t(errorKey as never);
      }

      set({ error: errorMessage, isLoading: false });
      showError(errorMessage);
      throw error;
    }
  },
}));

// Subscribe to online/offline events
if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    useUserStore.setState({ isOnline: true });
    useUserStore.getState().fetchUsers();
  });

  window.addEventListener("offline", () => {
    useUserStore.setState({ isOnline: false });
  });
}
