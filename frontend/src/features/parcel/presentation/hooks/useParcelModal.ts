"use client";

import { useAppModal } from "@/components/modals/hooks/useAppModal";
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { ParcelFooterModalChangeStatus } from "../components/Modal/ParcelFooterModalChangeStatus";
import {
  ParcelModalChangeStatus,
  createParcelActionDescription,
} from "../components/Modal/ParcelModalChangeStatus";

export const useParcelModal = () => {
  const { t } = useTranslation("parcel");
  const appModal = useAppModal();

  const showParcelAction = useCallback(
    async (
      parcelId: string,
      action: "activate" | "deactivate",
      onConfirm: () => Promise<void>
    ): Promise<boolean> => {
      const isActivation = action === "activate";
      const title = isActivation
        ? t("modal.activateTitle")
        : t("modal.deactivateTitle");

      return new Promise((resolve, reject) => {
        const handleCancel = () => appModal.hide();
        const handleResolve = (result: boolean) => {
          appModal.hide();
          resolve(result);
        };
        const handleReject = (error: unknown) => {
          // Ne pas fermer le modal immédiatement pour permettre au toast d'être visible
          // Rejeter d'abord l'erreur, le modal sera fermé par le composant parent
          reject(error);
          // Fermer le modal après un court délai pour que le toast soit visible
          setTimeout(() => {
            appModal.hide();
          }, 200);
        };

        appModal.show({
          title,
          description: createParcelActionDescription(parcelId, action, t),
          variant: isActivation ? "default" : "destructive",

          // Content et Footer séparés
          content: React.createElement(ParcelModalChangeStatus, { parcelId }),
          footer: React.createElement(ParcelFooterModalChangeStatus),

          needsCommunication: true,
          contextType: "dynamic",
          contextData: {
            // États initiaux
            isValid: false,
            isLoading: false,

            // Données métier
            parcelId,
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
              handleCancel();
              handleResolve(false);
            },
          },
        });
      });
    },
    [appModal, t]
  );

  const confirmParcelActivation = useCallback(
    (parcelId: string, onConfirm: () => Promise<void>) => {
      return showParcelAction(parcelId, "activate", onConfirm);
    },
    [showParcelAction]
  );

  const confirmParcelDeactivation = useCallback(
    (parcelId: string, onConfirm: () => Promise<void>) => {
      return showParcelAction(parcelId, "deactivate", onConfirm);
    },
    [showParcelAction]
  );

  return {
    showParcelAction,
    confirmParcelActivation,
    confirmParcelDeactivation,
  };
};
