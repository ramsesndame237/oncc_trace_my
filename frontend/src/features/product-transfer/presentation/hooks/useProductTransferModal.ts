"use client";

import { useAppModal } from "@/components/modals/hooks/useAppModal";
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  createProductTransferCancelDescription,
  ProductTransferCancelModal,
} from "../components/Modal/ProductTransferCancelModal";
import { ProductTransferCancelFooter } from "../components/Modal/ProductTransferCancelFooter";

export const useProductTransferModal = () => {
  const appModal = useAppModal();
  const { t } = useTranslation("productTransfer");

  /**
   * Affiche un modal de confirmation pour annuler un transfert
   * @param transferCode - Code du transfert à annuler
   * @param onConfirm - Fonction appelée si l'utilisateur confirme
   * @returns Promise<boolean> - true si confirmé, false si annulé
   */
  const confirmCancelTransfer = useCallback(
    async (
      transferCode: string,
      onConfirm: () => Promise<void>
    ): Promise<boolean> => {
      const title = t("modals.cancel.title");

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
          description: createProductTransferCancelDescription(
            transferCode,
            t
          ),
          variant: "destructive",

          // Content et Footer séparés
          content: React.createElement(ProductTransferCancelModal, {
            transferCode,
          }),
          footer: React.createElement(ProductTransferCancelFooter),

          needsCommunication: true,
          contextType: "dynamic",
          contextData: {
            // États initiaux
            isValid: false,
            isLoading: false,

            // Données métier
            transferCode,

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
    confirmCancelTransfer,
  };
};
