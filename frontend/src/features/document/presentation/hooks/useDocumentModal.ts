"use client";

import { useAppModal } from "@/components/modals/hooks/useAppModal";
import { apiClient } from "@/core/infrastructure/api";
import { IFileValue } from "@/types/type";
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { getDocumentTypeLabel } from "../../domain";
import { DocumentFooterModalPreview } from "../components/Modal/DocumentFooterModalPreview";
import { DocumentModalPreview } from "../components/Modal/DocumentModalPreview";

export const useDocumentModal = () => {
  const appModal = useAppModal();
  const { t } = useTranslation("document");

  const showDocumentPreview = useCallback(
    async (document: IFileValue): Promise<void> => {
      const title = t("preview.previewOf");
      const documentTypeKey = getDocumentTypeLabel(
        (document.optionValues[1] as string) || ""
      );
      const documentTypeLabel = t(documentTypeKey as never);

      return new Promise((resolve) => {
        const handleClose = () => {
          appModal.hide();
          resolve();
        };

        appModal.show({
          title,
          description: documentTypeLabel,
          variant: "default",

          // Content et Footer séparés
          content: React.createElement(DocumentModalPreview, {
            document,
          }),
          footer: React.createElement(DocumentFooterModalPreview, {
            onClose: handleClose,
            hasDocumentId: !!document.id,
            onDownload: async () => {
              console.log("handleDownload called for document:", document.id);
              try {
                // S'assurer que l'API client est initialisé
                await apiClient.initialize();
                const token = apiClient.getToken();

                // Créer une URL avec le token en paramètre ou utiliser un lien authentifié
                const downloadUrl = `${process.env.NEXT_PUBLIC_API_URL}/documents/${document.id}/download`;

                // Créer un lien temporaire avec l'authentification
                const link = window.document.createElement("a");
                link.href = downloadUrl;
                link.target = "_blank";
                link.rel = "noopener noreferrer";

                // Ajouter l'en-tête d'authentification via fetch puis télécharger
                const response = await fetch(downloadUrl, {
                  method: "GET",
                  credentials: "include",
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                });

                if (response.ok) {
                  const blob = await response.blob();
                  const blobUrl = URL.createObjectURL(blob);
                  link.href = blobUrl;
                  link.download = document.name || "";
                  window.document.body.appendChild(link);
                  link.click();
                  window.document.body.removeChild(link);
                  URL.revokeObjectURL(blobUrl);
                } else {
                  throw new Error(t("preview.failedToLoad"));
                }
              } catch (error) {
                console.error(t("preview.loadingError"), error);
                // Fallback: essayer d'ouvrir dans un nouvel onglet
                window.open(
                  `${process.env.NEXT_PUBLIC_API_URL}/documents/${document.id}/download`,
                  "_blank"
                );
              }
            },
          }),
        });
      });
    },
    [appModal, t]
  );

  return {
    showDocumentPreview,
  };
};
