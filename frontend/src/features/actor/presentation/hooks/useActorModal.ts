"use client";

import { useAppModal } from "@/components/modals/hooks/useAppModal";
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { ProducerFooterModalChangeStatus } from "../components/Modal/ProducerFooterModalChangeStatus";
import {
  ProducerModalChangeStatus,
  createProducerActionDescription,
} from "../components/Modal/ProducerModalChangeStatus";
import { RemoveBuyerFromExporterFooter } from "../components/Modal/RemoveBuyerFromExporterFooter";
import {
  RemoveBuyerFromExporterModal,
  createRemoveBuyerDescription,
} from "../components/Modal/RemoveBuyerFromExporterModal";
import { RemoveProducerFromOpaFooter } from "../components/Modal/RemoveProducerFromOpaFooter";
import {
  RemoveProducerFromOpaModal,
  createRemoveProducerDescription,
} from "../components/Modal/RemoveProducerFromOpaModal";

/**
 * Hook centralisé pour gérer tous les modals des acteurs
 * - Activation/Désactivation des acteurs
 * - Retrait d'acheteurs d'un exportateur
 * - Retrait de producteurs d'un OPA
 */
export const useActorModal = () => {
  const appModal = useAppModal();
  const { t } = useTranslation("actor");

  const showActorAction = useCallback(
    async (
      actorId: string,
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
          description: createProducerActionDescription(actorId, action, t),
          variant: isActivation ? "default" : "destructive",

          // Content et Footer séparés
          content: React.createElement(ProducerModalChangeStatus, {
            actorId,
            action,
          }),
          footer: React.createElement(ProducerFooterModalChangeStatus),

          needsCommunication: true,
          contextType: "dynamic",
          contextData: {
            // États initiaux
            isValid: false,
            isLoading: false,

            // Données métier
            actorId,
            action,

            handleConfirm: async () => {
              console.log("handleConfirm called");
              try {
                await onConfirm();
                handleResolve(true);
              } catch (error) {
                console.error("Confirm error:", error);
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

  const confirmActorActivation = useCallback(
    (actorId: string, onConfirm: () => Promise<void>) => {
      return showActorAction(actorId, "activate", onConfirm);
    },
    [showActorAction]
  );

  const confirmActorDeactivation = useCallback(
    (actorId: string, onConfirm: () => Promise<void>) => {
      return showActorAction(actorId, "deactivate", onConfirm);
    },
    [showActorAction]
  );

  // ===== MODAL: RETRAIT D'UN ACHETEUR D'UN EXPORTATEUR =====
  const confirmRemoveBuyer = useCallback(
    async (
      exporterId: string,
      buyerId: string,
      expectedBuyerId: string,
      onConfirm: () => Promise<void>
    ): Promise<boolean> => {
      const title = t("modals.removeBuyer.title");

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
          description: createRemoveBuyerDescription(expectedBuyerId, t),
          variant: "destructive",

          // Content et Footer séparés
          content: React.createElement(RemoveBuyerFromExporterModal, {
            buyerId: expectedBuyerId,
          }),
          footer: React.createElement(RemoveBuyerFromExporterFooter),

          needsCommunication: true,
          contextType: "dynamic",
          contextData: {
            // États initiaux
            isValid: false,
            isLoading: false,

            // Données métier
            exporterId,
            buyerId,
            expectedBuyerId,

            handleConfirm: async () => {
              console.log("handleConfirm called - Remove Buyer");
              try {
                await onConfirm();
                handleResolve(true);
              } catch (error) {
                console.error("Confirm error:", error);
                handleReject(error);
              }
            },

            handleCancel: () => {
              console.log("handleCancel called - Remove Buyer");
              handleResolve(false);
            },

            onDismiss: () => {
              console.log("onDismiss called - Remove Buyer");
              handleResolve(false);
            },
          },
        });
      });
    },
    [appModal, t]
  );

  // ===== MODAL: RETRAIT D'UN PRODUCTEUR D'UN OPA =====
  const confirmRemoveProducer = useCallback(
    async (
      opaId: string,
      producerId: string,
      expectedProducerId: string,
      onConfirm: () => Promise<void>
    ): Promise<boolean> => {
      const title = t("modals.removeProducer.title");

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
          description: createRemoveProducerDescription(expectedProducerId, t),
          variant: "destructive",

          // Content et Footer séparés
          content: React.createElement(RemoveProducerFromOpaModal, {
            producerId: expectedProducerId,
          }),
          footer: React.createElement(RemoveProducerFromOpaFooter),

          needsCommunication: true,
          contextType: "dynamic",
          contextData: {
            // États initiaux
            isValid: false,
            isLoading: false,

            // Données métier
            opaId,
            producerId,
            expectedProducerId,

            handleConfirm: async () => {
              console.log("handleConfirm called - Remove Producer");
              try {
                await onConfirm();
                handleResolve(true);
              } catch (error) {
                console.error("Confirm error:", error);
                handleReject(error);
              }
            },

            handleCancel: () => {
              console.log("handleCancel called - Remove Producer");
              handleResolve(false);
            },

            onDismiss: () => {
              console.log("onDismiss called - Remove Producer");
              handleResolve(false);
            },
          },
        });
      });
    },
    [appModal, t]
  );

  return {
    // Activation/Désactivation
    showActorAction,
    confirmActorActivation,
    confirmActorDeactivation,

    // Retrait d'acheteur d'un exportateur
    confirmRemoveBuyer,

    // Retrait de producteur d'un OPA
    confirmRemoveProducer,
  };
};
