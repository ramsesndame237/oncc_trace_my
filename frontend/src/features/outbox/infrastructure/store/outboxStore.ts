"use client";

import { PaginationMeta } from "@/core/domain/types";
import { db, PendingOperation } from "@/core/infrastructure/database/db";
import { SyncService } from "@/core/infrastructure/services/syncService";
import i18next from "i18next";
import {
  getErrorTranslationKey,
  getSuccessTranslationKey,
} from "@/i18n/utils/getErrorMessage";
import { showError, showInfo, showSuccess } from "@/lib/notifications/toast";
import { useAuthStore } from "@/features/auth/infrastructure/store/authStore";
import { container } from "tsyringe";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import type {
  OutboxOperationDetails,
  OutboxOperationSummary,
} from "../../domain/outbox.types";
import type { OutboxStore } from "../../domain/store.types";
import { initialOutboxState } from "../../domain/store.types";

/**
 * Store Zustand pour la gestion complète des opérations outbox
 * Suit exactement les patterns établis par le store campaign
 */
export const useOutboxStore = create<OutboxStore>()(
  devtools(
    immer((set, get) => ({
      // =============== ÉTAT INITIAL ===============
      ...initialOutboxState,

      // =============== ACTIONS SYNCHRONES ===============

      setOperations: (operations) =>
        set((state) => {
          state.operations = operations;
          state.lastFetch = Date.now();
        }),

      setMeta: (meta) =>
        set((state) => {
          state.meta = meta;
        }),

      setSummary: (summary) =>
        set((state) => {
          state.summary = summary;
        }),

      setFilters: (filters) =>
        set((state) => {
          state.filters = { ...state.filters, ...filters };
          // Auto-fetch quand les filtres changent
          if (filters.page !== undefined || filters.limit !== undefined) {
            // Fetch sera déclenché par l'effet de bord du composant
          }
        }),

      setLoading: (isLoading) =>
        set((state) => {
          state.isLoading = isLoading;
        }),

      setDeleting: (isDeleting) =>
        set((state) => {
          state.isDeleting = isDeleting;
        }),

      setSyncing: (isSyncing) =>
        set((state) => {
          state.isSyncing = isSyncing;
        }),

      setOnline: (isOnline) =>
        set((state) => {
          state.isOnline = isOnline;
          state.syncStatus.isOnline = isOnline;
        }),

      setSyncStatus: (status) =>
        set((state) => {
          state.syncStatus = { ...state.syncStatus, ...status };
        }),

      setError: (error) =>
        set((state) => {
          state.error = error;
        }),

      // =============== ACTIONS ASYNCHRONES DE DONNÉES ===============

      fetchOperations: async (filters) => {
        const state = get();
        const finalFilters = { ...state.filters, ...filters };

        console.log("[Outbox] 🔄 fetchOperations appelé avec filtres:", finalFilters);

        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          // 🔒 SÉCURITÉ CRITIQUE: Filtrer par utilisateur connecté
          const currentUserId = getCurrentUserId();
          console.log("[Outbox] 👤 ID utilisateur actuel:", currentUserId);

          if (!currentUserId) {
            // Pas d'utilisateur connecté, aucune opération à afficher
            console.warn("[Outbox] ⚠️ Aucun utilisateur connecté, liste vide");
            set((state) => {
              state.operations = [];
              state.meta = undefined;
              state.summary = { total: 0, pending: 0, failed: 0, byEntityType: {}, byOperation: {} };
              state.isLoading = false;
              state.lastFetch = Date.now();
            });
            return;
          }

          // Construire la requête Dexie avec filtrage utilisateur obligatoire
          let query = db.pendingOperations
            .orderBy("timestamp")
            .reverse()
            .filter(op => op.userId === currentUserId);

          // Appliquer les filtres
          if (finalFilters.entityType && finalFilters.entityType !== "") {
            query = query.filter(
              (op) => op.entityType === finalFilters.entityType
            );
          }

          if (finalFilters.operation) {
            query = query.filter(
              (op) => op.operation === finalFilters.operation
            );
          }

          if (finalFilters.status === "failed") {
            query = query.filter((op) => op.lastError != null);
          } else if (finalFilters.status === "pending") {
            query = query.filter((op) => op.lastError == null);
          }

          // Recherche textuelle
          if (finalFilters.search && finalFilters.search.trim() !== "") {
            const searchTerm = finalFilters.search.toLowerCase();
            query = query.filter((op) => {
              const payload = op.payload as Record<string, unknown>;
              const entityName = (payload?.nom ||
                payload?.name ||
                payload?.title ||
                op.entityId) as string;
              return (
                entityName.toLowerCase().includes(searchTerm) ||
                op.entityId.toLowerCase().includes(searchTerm) ||
                op.entityType.toLowerCase().includes(searchTerm)
              );
            });
          }

          // Récupérer toutes les opérations correspondantes
          const allOperations = await query.toArray();
          console.log("[Outbox] 📊 Opérations trouvées dans IndexedDB:", allOperations.length);

          // Calculer les statistiques
          const summary: OutboxOperationSummary = {
            total: allOperations.length,
            pending: allOperations.filter((op) => !op.lastError).length,
            failed: allOperations.filter((op) => op.lastError).length,
            byEntityType: {},
            byOperation: {},
          };

          allOperations.forEach((op) => {
            summary.byEntityType[op.entityType] =
              (summary.byEntityType[op.entityType] || 0) + 1;
            summary.byOperation[op.operation] =
              (summary.byOperation[op.operation] || 0) + 1;
          });

          // Pagination
          const page = finalFilters.page || 1;
          const limit = finalFilters.limit || 10;
          const offset = (page - 1) * limit;
          const paginatedOperations = allOperations.slice(
            offset,
            offset + limit
          );

          // Enrichir les opérations avec des données calculées
          const enrichedOperations: OutboxOperationDetails[] =
            paginatedOperations.map((op) => ({
              ...op,
              formattedPayload: op.payload as Record<string, unknown>,
              entityName: extractEntityName(op),
              canRetry: op.retries < 3,
              canDelete: true,
            }));

          // Métadonnées de pagination
          const meta: PaginationMeta = {
            total: allOperations.length,
            perPage: limit,
            currentPage: page,
            lastPage: Math.ceil(allOperations.length / limit),
            firstPage: 1,
            firstPageUrl: "",
            lastPageUrl: "",
            nextPageUrl: "",
            previousPageUrl: "",
          };

          set((state) => {
            state.operations = enrichedOperations;
            state.meta = meta;
            state.summary = summary;
            state.filters = finalFilters;
            state.isLoading = false;
            state.lastFetch = Date.now();
          });
        } catch (error) {
          console.error(
            "Erreur lors du chargement des opérations outbox:",
            error
          );

          let errorMessage: string;
          if (error instanceof Error) {
            errorMessage = error.message;
          } else {
            const errorKey = getErrorTranslationKey("OUTBOX_LOAD_FAILED");
            errorMessage = i18next.t(errorKey as never);
          }

          set((state) => {
            state.error = errorMessage;
            state.isLoading = false;
            state.operations = [];
            state.meta = undefined;
            state.summary = undefined;
          });

          showError(i18next.t("outbox:toast.error"), {
            description: errorMessage,
          });
        }
      },

      refreshOperations: async () => {
        const { filters, fetchOperations } = get();
        await fetchOperations(filters);
      },

      // =============== ACTIONS DE GESTION DES OPÉRATIONS ===============

      deleteOperation: async (id, reason) => {
        set((state) => {
          state.isDeleting = true;
          state.error = null;
        });

        try {
          // Supprimer de la base de données
          await db.pendingOperations.delete(id);

          // Créer un log d'audit (optionnel)
          if (reason) {
            console.log(`Operation ${id} supprimée: ${reason}`);
          }

          // Mettre à jour le store
          set((state) => {
            state.operations = state.operations.filter((op) => op.id !== id);
            state.isDeleting = false;
          });

          // Rafraîchir les données pour avoir les stats à jour
          await get().refreshOperations();

          const successKey = getSuccessTranslationKey("OUTBOX_OPERATION_DELETED");
          showSuccess(i18next.t(successKey as never));
        } catch (error) {
          console.error("Erreur lors de la suppression de l'opération:", error);

          let errorMessage: string;
          if (error instanceof Error) {
            errorMessage = error.message;
          } else {
            const errorKey = getErrorTranslationKey("OUTBOX_DELETE_FAILED");
            errorMessage = i18next.t(errorKey as never);
          }

          set((state) => {
            state.error = errorMessage;
            state.isDeleting = false;
          });

          showError(i18next.t("outbox:toast.error"), {
            description: errorMessage,
          });
        }
      },

      retryOperation: async (id) => {
        try {
          const syncService = container.resolve(SyncService);
          const currentUserId = getCurrentUserId();

          if (!currentUserId) {
            const errorKey = getErrorTranslationKey("OUTBOX_USER_NOT_CONNECTED");
            throw new Error(i18next.t(errorKey as never));
          }

          // Récupérer l'opération et vérifier qu'elle appartient à l'utilisateur
          const operation = await db.pendingOperations.get(id);
          if (!operation) {
            const errorKey = getErrorTranslationKey("OUTBOX_OPERATION_NOT_FOUND");
            throw new Error(i18next.t(errorKey as never));
          }

          if (operation.userId !== currentUserId) {
            const errorKey = getErrorTranslationKey("OUTBOX_ACCESS_DENIED");
            throw new Error(i18next.t(errorKey as never));
          }

          // Forcer la synchronisation des opérations de l'utilisateur
          await syncService.processQueueForUser(currentUserId);

          // Rafraîchir les données
          await get().refreshOperations();

          const successKey = getSuccessTranslationKey("OUTBOX_RETRY_SUCCESS");
          showInfo(i18next.t(successKey as never));
        } catch (error) {
          console.error("Erreur lors de la nouvelle tentative:", error);

          let errorMessage: string;
          if (error instanceof Error) {
            errorMessage = error.message;
          } else {
            const errorKey = getErrorTranslationKey("OUTBOX_RETRY_FAILED");
            errorMessage = i18next.t(errorKey as never);
          }

          showError(i18next.t("outbox:toast.error"), {
            description: errorMessage,
          });
        }
      },

      // =============== ACTIONS DE SYNCHRONISATION ===============

      forceSyncOperation: async () => {
        set((state) => {
          state.isSyncing = true;
        });

        try {
          const syncService = container.resolve(SyncService);
          const currentUserId = getCurrentUserId();

          if (!currentUserId) {
            const errorKey = getErrorTranslationKey("OUTBOX_USER_NOT_CONNECTED");
            throw new Error(i18next.t(errorKey as never));
          }

          // Synchroniser uniquement les opérations de l'utilisateur connecté
          await syncService.processQueueForUser(currentUserId);
          await get().refreshOperations();

          const successKey = getSuccessTranslationKey("OUTBOX_SYNC_SUCCESS");
          showSuccess(i18next.t(successKey as never));
        } catch (error) {
          console.error("Erreur lors de la synchronisation:", error);

          let errorMessage: string;
          if (error instanceof Error) {
            errorMessage = error.message;
          } else {
            const errorKey = getErrorTranslationKey("OUTBOX_SYNC_FAILED");
            errorMessage = i18next.t(errorKey as never);
          }

          showError(i18next.t("outbox:toast.error"), {
            description: errorMessage,
          });
        } finally {
          set((state) => {
            state.isSyncing = false;
          });
        }
      },

      forceSyncEntityType: async () => {
        set((state) => {
          state.isSyncing = true;
        });

        try {
          const syncService = container.resolve(SyncService);
          const currentUserId = getCurrentUserId();

          if (!currentUserId) {
            const errorKey = getErrorTranslationKey("OUTBOX_USER_NOT_CONNECTED");
            throw new Error(i18next.t(errorKey as never));
          }

          // Synchroniser uniquement les opérations de l'utilisateur pour ce type d'entité
          await syncService.processQueueForUser(currentUserId);
          await get().refreshOperations();

          const successKey = getSuccessTranslationKey("OUTBOX_SYNC_SUCCESS");
          showSuccess(i18next.t(successKey as never));
        } catch (error) {
          console.error("Erreur lors de la synchronisation par type:", error);

          let errorMessage: string;
          if (error instanceof Error) {
            errorMessage = error.message;
          } else {
            const errorKey = getErrorTranslationKey("OUTBOX_SYNC_FAILED");
            errorMessage = i18next.t(errorKey as never);
          }

          showError(i18next.t("outbox:toast.error"), {
            description: errorMessage,
          });
        } finally {
          set((state) => {
            state.isSyncing = false;
          });
        }
      },

      forceSyncAllOperations: async () => {
        set((state) => {
          state.isSyncing = true;
        });

        try {
          const syncService = container.resolve(SyncService);
          const currentUserId = getCurrentUserId();

          if (!currentUserId) {
            const errorKey = getErrorTranslationKey("OUTBOX_USER_NOT_CONNECTED");
            throw new Error(i18next.t(errorKey as never));
          }

          // Synchroniser uniquement toutes les opérations de l'utilisateur connecté
          await syncService.processQueueForUser(currentUserId);
          await get().refreshOperations();

          const successKey = getSuccessTranslationKey("OUTBOX_SYNC_SUCCESS");
          showSuccess(i18next.t(successKey as never));
        } catch (error) {
          console.error("Erreur lors de la synchronisation générale:", error);

          let errorMessage: string;
          if (error instanceof Error) {
            errorMessage = error.message;
          } else {
            const errorKey = getErrorTranslationKey("OUTBOX_SYNC_FAILED");
            errorMessage = i18next.t(errorKey as never);
          }

          showError(i18next.t("outbox:toast.error"), {
            description: errorMessage,
          });
        } finally {
          set((state) => {
            state.isSyncing = false;
          });
        }
      },

      // =============== ACTIONS UTILITAIRES ===============

      resetFilters: () =>
        set((state) => {
          state.filters = initialOutboxState.filters;
        }),

      resetStore: () => set(() => ({ ...initialOutboxState })),

      toggleAutoRefresh: (enabled) =>
        set((state) => {
          state.autoRefreshEnabled = enabled;
        }),

      // =============== GETTERS/SELECTORS ===============

      getOperationById: (id) => {
        return get().operations.find((op) => op.id === id);
      },

      getFailedOperations: () => {
        return get().operations.filter((op) => op.lastError);
      },

      getPendingOperations: () => {
        return get().operations.filter((op) => !op.lastError);
      },

      getOperationsByEntityType: (entityType) => {
        return get().operations.filter((op) => op.entityType === entityType);
      },
    })),
    {
      name: "outbox-store",
      version: 1,
    }
  )
);

// =============== FONCTIONS UTILITAIRES ===============

/**
 * Obtient l'ID de l'utilisateur actuellement connecté
 */
function getCurrentUserId(): string | null {
  if (typeof window === "undefined") return null;
  const { user } = useAuthStore.getState();
  return user?.id ?? null;
}

/**
 * Extrait le nom de l'entité depuis le payload
 */
function extractEntityName(operation: PendingOperation): string {
  try {
    const payload = operation.payload as Record<string, unknown>;

    // Essayer différents champs selon le type d'entité
    const possibleNameFields = ["nom", "name", "title", "code"];

    for (const field of possibleNameFields) {
      const value = payload[field];
      if (typeof value === "string" && value.trim() !== "") {
        return value;
      }
    }

    // Fallback vers l'ID tronqué
    return `${operation.entityType} ${operation.entityId.slice(0, 8)}...`;
  } catch {
    return `${operation.entityType} ${operation.entityId.slice(0, 8)}...`;
  }
}

// =============== EFFETS DE BORD (LISTENERS) ===============

// Écouter les changements de statut réseau
if (typeof window !== "undefined") {
  const handleOnline = () => {
    useOutboxStore.getState().setOnline(true);
  };

  const handleOffline = () => {
    useOutboxStore.getState().setOnline(false);
  };

  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);
}
