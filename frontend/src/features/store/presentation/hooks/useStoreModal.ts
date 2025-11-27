"use client";

import { useAppModal } from "@/components/modals/hooks/useAppModal";
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { StoreFooterModalChangeStatus } from "../components/Modal/StoreFooterModalChangeStatus";
import {
  StoreModalChangeStatus,
  createStoreActionDescription,
} from "../components/Modal/StoreModalChangeStatus";
import { RemoveOccupantFromStoreFooter } from "../components/Modal/RemoveOccupantFromStoreFooter";
import {
  RemoveOccupantFromStoreModal,
  createRemoveOccupantDescription,
} from "../components/Modal/RemoveOccupantFromStoreModal";

export const useStoreModal = () => {
  const appModal = useAppModal();
  const { t } = useTranslation("store");

  const showStoreAction = useCallback(
    async (
      storeCode: string,
      action: "activate" | "deactivate",
      onConfirm: () => Promise<void>
    ): Promise<boolean> => {
      const isActivation = action === "activate";
      const title = isActivation
        ? t("modals.changeStatus.activateTitle")
        : t("modals.changeStatus.deactivateTitle");

      return new Promise((resolve, reject) => {
        const handleResolve = (result: boolean) => {
          appModal.hide();
          resolve(result);
        };
        const handleReject = (error: unknown) => {
          reject(error);
          // Fermer le modal après un court délai pour que le toast soit visible
          setTimeout(() => {
            appModal.hide();
          }, 200);
        };

        appModal.show({
          title,
          description: createStoreActionDescription(storeCode, action, t),
          variant: isActivation ? "default" : "destructive",

          // Content et Footer séparés
          content: React.createElement(StoreModalChangeStatus, { storeCode }),
          footer: React.createElement(StoreFooterModalChangeStatus),

          needsCommunication: true,
          contextType: "dynamic",
          contextData: {
            // États initiaux
            isValid: false,
            isLoading: false,

            // Données métier
            storeCode,
            action,

            handleConfirm: async () => {
              console.log("handleConfirm called");
              // Note: isValid et isLoading seront vérifiés dans le composant
              try {
                await onConfirm();
                handleResolve(true);
              } catch (error) {
                console.error("Confirm error:", error);
                // Rejeter la promesse pour que l'erreur soit gérée par le composant appelant
                handleReject(error);
              }
            },

            handleCancel: () => {
              console.log("handleCancel called");
              handleResolve(false);
            },

            // Callback appelé quand le modal se ferme (croix X ou ESC)
            onDismiss: () => {
              console.log("onDismiss called");
              handleResolve(false);
            },
          },
        });
      });
    },
    [appModal, t]
  );

  const confirmStoreActivation = useCallback(
    (storeCode: string, onConfirm: () => Promise<void>) => {
      return showStoreAction(storeCode, "activate", onConfirm);
    },
    [showStoreAction]
  );

  const confirmStoreDeactivation = useCallback(
    (storeCode: string, onConfirm: () => Promise<void>) => {
      return showStoreAction(storeCode, "deactivate", onConfirm);
    },
    [showStoreAction]
  );

  // ===== MODAL: RETRAIT D'UN OCCUPANT D'UN MAGASIN =====
  const confirmRemoveOccupant = useCallback(
    async (
      storeId: string,
      occupantId: string,
      expectedOccupantId: string,
      onConfirm: () => Promise<void>
    ): Promise<boolean> => {
      const title = t("modals.removeOccupant.title");

      return new Promise((resolve, reject) => {
        const handleResolve = (result: boolean) => {
          appModal.hide();
          resolve(result);
        };
        const handleReject = (error: unknown) => {
          reject(error);
          // Fermer le modal après un court délai pour que le toast soit visible
          setTimeout(() => {
            appModal.hide();
          }, 200);
        };

        appModal.show({
          title,
          description: createRemoveOccupantDescription(expectedOccupantId, t),
          variant: "destructive",

          // Content et Footer séparés
          content: React.createElement(RemoveOccupantFromStoreModal, {
            occupantId: expectedOccupantId,
          }),
          footer: React.createElement(RemoveOccupantFromStoreFooter),

          needsCommunication: true,
          contextType: "dynamic",
          contextData: {
            // États initiaux
            isValid: false,
            isLoading: false,

            // Données métier
            storeId,
            occupantId,
            expectedOccupantId,

            handleConfirm: async () => {
              console.log("handleConfirm called - Remove Occupant");
              try {
                await onConfirm();
                handleResolve(true);
              } catch (error) {
                console.error("Confirm error:", error);
                handleReject(error);
              }
            },

            handleCancel: () => {
              console.log("handleCancel called - Remove Occupant");
              handleResolve(false);
            },

            onDismiss: () => {
              console.log("onDismiss called - Remove Occupant");
              handleResolve(false);
            },
          },
        });
      });
    },
    [appModal, t]
  );

  return {
    showStoreAction,
    confirmStoreActivation,
    confirmStoreDeactivation,
    // Retrait d'occupant d'un magasin
    confirmRemoveOccupant,
  };
};
