"use client";

import { useAppModal } from "@/components/modals/hooks/useAppModal";
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  createTransactionStatusDescription,
  TransactionStatusModal,
} from "../components/Modal/TransactionStatusModal";
import { TransactionStatusFooter } from "../components/Modal/TransactionStatusFooter";
import type { TransactionStatusAction } from "../types/TransactionStatusModalTypes";

export const useTransactionModal = () => {
  const appModal = useAppModal();
  const { t } = useTranslation("transaction");

  /**
   * Affiche un modal de confirmation pour changer le statut d'une transaction
   * @param transactionCode - Code de la transaction
   * @param action - Action à effectuer (confirm ou cancel)
   * @param onConfirm - Fonction appelée si l'utilisateur confirme
   * @returns Promise<boolean> - true si confirmé, false si annulé
   */
  const confirmStatusChange = useCallback(
    async (
      transactionCode: string,
      action: TransactionStatusAction,
      onConfirm: () => Promise<void>
    ): Promise<boolean> => {
      const title =
        action === "confirm"
          ? t("modals.status.confirmTitle")
          : t("modals.status.cancelTitle");

      const variant = action === "confirm" ? "default" : "destructive";

      return new Promise((resolve, reject) => {
        const handleResolve = (result: boolean) => {
          appModal.hide();
          resolve(result);
        };
        const handleReject = (error: unknown) => {
          reject(error);
          setTimeout(() => {
            appModal.hide();
          }, 200);
        };

        appModal.show({
          title,
          description: createTransactionStatusDescription(
            transactionCode,
            action,
            t
          ),
          variant,

          // Content et Footer séparés
          content: React.createElement(TransactionStatusModal, {
            transactionCode,
          }),
          footer: React.createElement(TransactionStatusFooter),

          needsCommunication: true,
          contextType: "dynamic",
          contextData: {
            // États initiaux
            isValid: false,
            isLoading: false,

            // Données métier
            transactionCode,
            action,

            handleConfirm: async () => {
              try {
                await onConfirm();
                handleResolve(true);
              } catch (error) {
                console.error("Confirm error:", error);
                handleReject(error);
              }
            },

            handleCancel: () => {
              handleResolve(false);
            },

            onDismiss: () => {
              handleResolve(false);
            },
          },
        });
      });
    },
    [appModal, t]
  );

  return {
    confirmStatusChange,
  };
};
