"use client";

import { useAppModal } from "@/components/modals/hooks/useAppModal";
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { UserFooterModalChangeStatus } from "../components/Modal/UserFooterModalChangeStatus";
import { UserFooterModalResetPassword } from "../components/Modal/UserFooterModalResetPassword";
import {
  UserModalChangeStatus,
  createUserActionDescription,
} from "../components/Modal/UserModalChangeStatus";
import {
  UserModalResetPassword,
  createResetPasswordDescription,
} from "../components/Modal/UserModalResetPassword";

export const useUserModal = () => {
  const appModal = useAppModal();
  const { t } = useTranslation("user");

  const showUserAction = useCallback(
    async (
      username: string,
      action: "activate" | "deactivate",
      onConfirm: (reason?: string) => Promise<void>
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
          description: createUserActionDescription(username, action, t),
          variant: isActivation ? "default" : "destructive",

          // Content et Footer séparés
          content: React.createElement(UserModalChangeStatus, {
            username,
            action,
          }),
          footer: React.createElement(UserFooterModalChangeStatus),

          needsCommunication: true,
          contextType: "dynamic",
          contextData: {
            // États initiaux
            isValid: false,
            isLoading: false,

            // Données métier
            username,
            action,

            handleConfirm: async (reason?: string) => {
              console.log("handleConfirm called with reason:", reason);
              // Note: isValid et isLoading seront vérifiés dans le composant
              try {
                await onConfirm(reason);
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

  const confirmUserActivation = useCallback(
    (username: string, onConfirm: () => Promise<void>) => {
      return showUserAction(username, "activate", onConfirm);
    },
    [showUserAction]
  );

  const confirmUserDeactivation = useCallback(
    (username: string, onConfirm: (reason?: string) => Promise<void>) => {
      return showUserAction(username, "deactivate", onConfirm);
    },
    [showUserAction]
  );

  const confirmUserPasswordReset = useCallback(
    async (
      username: string,
      userFullName: string,
      onConfirm: () => Promise<void>
    ): Promise<boolean> => {
      const title = t("modals.resetPassword.title");

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
          }, 100);
        };

        appModal.show({
          title,
          description: createResetPasswordDescription(username, userFullName, t),
          variant: "destructive",

          // Content et Footer séparés
          content: React.createElement(UserModalResetPassword, { username }),
          footer: React.createElement(UserFooterModalResetPassword),

          needsCommunication: true,
          contextType: "dynamic",
          contextData: {
            // États initiaux
            isValid: false,
            isLoading: false,

            // Données métier
            username,
            userFullName,

            handleConfirm: async () => {
              console.log("handleConfirm called for password reset");
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
              console.log("handleCancel called for password reset");
              handleResolve(false);
            },

            // Callback appelé quand le modal se ferme (croix X ou ESC)
            onDismiss: () => {
              console.log("onDismiss called for password reset");
              handleResolve(false);
            },
          },
        });
      });
    },
    [appModal, t]
  );

  return {
    showUserAction,
    confirmUserActivation,
    confirmUserDeactivation,
    confirmUserPasswordReset,
  };
};
