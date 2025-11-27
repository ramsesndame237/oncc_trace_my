"use client";

import { useAppModal } from "@/components/modals/hooks/useAppModal";
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { CalendarFooterModalChangeStatus } from "../components/Modal/CalendarFooterModalChangeStatus";
import { CalendarFooterModalUpdateExpectedSalesCount } from "../components/Modal/CalendarFooterModalUpdateExpectedSalesCount";
import {
  CalendarModalChangeStatus,
  createCalendarActionDescription,
} from "../components/Modal/CalendarModalChangeStatus";
import {
  CalendarModalUpdateExpectedSalesCount,
  createUpdateExpectedSalesCountDescription,
} from "../components/Modal/CalendarModalUpdateExpectedSalesCount";

export const useCalendarModal = () => {
  const appModal = useAppModal();
  const { t } = useTranslation("calendar");

  const showCalendarAction = useCallback(
    async (
      calendarCode: string,
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
          description: createCalendarActionDescription(calendarCode, action, t),
          variant: isActivation ? "default" : "destructive",

          // Content et Footer séparés
          content: React.createElement(CalendarModalChangeStatus, { calendarCode }),
          footer: React.createElement(CalendarFooterModalChangeStatus),

          needsCommunication: true,
          contextType: "dynamic",
          contextData: {
            // États initiaux
            isValid: false,
            isLoading: false,

            // Données métier
            calendarCode,
            action,

            handleConfirm: async () => {
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
              handleResolve(false);
            },

            // Callback appelé quand le modal se ferme (croix X ou ESC)
            onDismiss: () => {
              handleResolve(false);
            },
          },
        });
      });
    },
    [appModal, t]
  );

  const confirmCalendarActivation = useCallback(
    (calendarCode: string, onConfirm: () => Promise<void>) => {
      return showCalendarAction(calendarCode, "activate", onConfirm);
    },
    [showCalendarAction]
  );

  const confirmCalendarDeactivation = useCallback(
    (calendarCode: string, onConfirm: () => Promise<void>) => {
      return showCalendarAction(calendarCode, "deactivate", onConfirm);
    },
    [showCalendarAction]
  );

  const confirmUpdateExpectedSalesCount = useCallback(
    async (
      calendarCode: string,
      currentExpectedSalesCount: number | null,
      onConfirm: (expectedSalesCount: number) => Promise<void>
    ): Promise<boolean> => {
      const title = t("modals.updateExpectedSalesCount.title");

      // Variable mutable pour stocker la dernière valeur du expectedSalesCount
      let latestExpectedSalesCount = currentExpectedSalesCount || 0;

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
          description: createUpdateExpectedSalesCountDescription(
            calendarCode,
            currentExpectedSalesCount,
            t
          ),
          variant: "default",

          // Content et Footer séparés
          content: React.createElement(CalendarModalUpdateExpectedSalesCount, {
            calendarCode,
            currentExpectedSalesCount,
          }),
          footer: React.createElement(CalendarFooterModalUpdateExpectedSalesCount),

          needsCommunication: true,
          contextType: "dynamic",
          contextData: {
            // États initiaux
            isValid: false,
            isLoading: false,

            // Données métier
            calendarCode,
            expectedSalesCount: currentExpectedSalesCount || 0,

            // Callback pour mettre à jour la variable de closure
            _updateExpectedSalesCount: (value: number) => {
              latestExpectedSalesCount = value;
            },

            handleConfirm: async () => {
              // Note: isValid et isLoading seront vérifiés dans le composant
              try {
                // Utiliser la valeur de la closure mise à jour par le composant
                await onConfirm(latestExpectedSalesCount);
                handleResolve(true);
              } catch (error) {
                console.error("Confirm error:", error);
                // Rejeter la promesse pour que l'erreur soit gérée par le composant appelant
                handleReject(error);
              }
            },

            handleCancel: () => {
              handleResolve(false);
            },

            // Callback appelé quand le modal se ferme (croix X ou ESC)
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
    showCalendarAction,
    confirmCalendarActivation,
    confirmCalendarDeactivation,
    confirmUpdateExpectedSalesCount,
  };
};
