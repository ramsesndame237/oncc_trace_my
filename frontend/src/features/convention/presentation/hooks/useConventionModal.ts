"use client";

import { useAppModal } from "@/components/modals/hooks/useAppModal";
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { ConventionAssociateCampaignFooter } from "../components/Modal/ConventionAssociateCampaignFooter";
import {
  ConventionAssociateCampaignModal,
  createConventionAssociateDescription,
} from "../components/Modal/ConventionAssociateCampaignModal";
import { ConventionDissociateCampaignFooter } from "../components/Modal/ConventionDissociateCampaignFooter";
import {
  ConventionDissociateCampaignModal,
  createConventionDissociateDescription,
} from "../components/Modal/ConventionDissociateCampaignModal";

/**
 * Hook centralisé pour gérer tous les modals des conventions
 * - Association à une campagne active
 * - Dissociation d'une campagne
 */
export const useConventionModal = () => {
  const appModal = useAppModal();
  const { t } = useTranslation("convention");

  const confirmAssociateCampaign = useCallback(
    async (
      conventionId: string,
      campaignName: string | null,
      onConfirm: () => Promise<void>
    ): Promise<boolean> => {
      const title = t("modals.associateCampaign.title");

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
          description: createConventionAssociateDescription(
            conventionId,
            campaignName,
            t
          ),
          variant: "default",

          // Content et Footer séparés
          content: React.createElement(ConventionAssociateCampaignModal, {
            conventionId,
          }),
          footer: React.createElement(ConventionAssociateCampaignFooter),

          needsCommunication: true,
          contextType: "dynamic",
          contextData: {
            // États initiaux
            isValid: false,
            isLoading: false,

            // Données métier
            conventionId,

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

  const confirmDissociateCampaign = useCallback(
    async (
      conventionId: string,
      campaignId: string,
      campaignName: string,
      onConfirm: () => Promise<void>
    ): Promise<boolean> => {
      const title = t("modals.dissociateCampaign.title");

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
          description: createConventionDissociateDescription(
            conventionId,
            campaignName,
            t
          ),
          variant: "destructive",

          // Content et Footer séparés
          content: React.createElement(ConventionDissociateCampaignModal, {
            conventionId,
            campaignName,
          }),
          footer: React.createElement(ConventionDissociateCampaignFooter),

          needsCommunication: true,
          contextType: "dynamic",
          contextData: {
            // États initiaux
            isValid: false,
            isLoading: false,

            // Données métier
            conventionId,
            campaignId,
            campaignName,

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
    confirmAssociateCampaign,
    confirmDissociateCampaign,
  };
};
