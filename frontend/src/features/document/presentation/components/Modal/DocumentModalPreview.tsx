"use client";

import { LoadingLoader } from "@/components/modules/loading-loader";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/core/infrastructure/api";
import { IFileValue } from "@/types/type";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { DocumentService } from "../../../infrastructure";

interface DocumentModalPreviewProps {
  document: IFileValue;
}

export const DocumentModalPreview: React.FC<DocumentModalPreviewProps> = ({
  document,
}) => {
  const { t } = useTranslation(["document", "common"]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Utiliser un ref pour tracker si la preview a déjà été chargée
  const hasLoadedRef = useRef(false);
  const lastDocumentIdRef = useRef<string | null>(null);

  const service = useMemo(() => new DocumentService(), []);

  const loadPreview = useCallback(
    async (doc: IFileValue) => {
      if (!service.canPreview(doc)) {
        setError(t("preview.cannotPreview"));
        return;
      }

      setLoading(true);
      setError(null);

      try {
        if (doc.id) {
          // S'assurer que l'API client est initialisé avec le token
          await apiClient.initialize();

          // Vérifier que nous avons un token valide
          if (!apiClient.hasValidToken()) {
            throw new Error(t("preview.authRequired"));
          }

          // Utiliser fetch avec l'en-tête Authorization
          const token = apiClient.getToken();
          const previewUrl = `${process.env.NEXT_PUBLIC_API_URL}/documents/${doc.id}/preview`;

          const response = await fetch(previewUrl, {
            method: "GET",
            credentials: "include", // Inclure les cookies d'authentification
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "*/*", // Accepter tout type de contenu
            },
          });

          if (!response.ok) {
            // Essayer de récupérer le message d'erreur du backend
            let errorMessage = `Erreur ${response.status}: ${response.statusText}`;
            try {
              const errorData = await response.json();
              if (errorData.message) {
                errorMessage = errorData.message;
              }
            } catch {
              // Si ce n'est pas du JSON, garder le message d'erreur par défaut
            }
            throw new Error(errorMessage);
          }

          // Créer une URL blob pour afficher le contenu
          const blob = await response.blob();
          const blobUrl = URL.createObjectURL(blob);
          setPreviewUrl(blobUrl);
        } else {
          // ⭐ Gérer les Blobs pour les documents en cours de création
          if (doc.data instanceof Blob) {
            const blobUrl = URL.createObjectURL(doc.data);
            setPreviewUrl(blobUrl);
          } else {
            // Si c'est déjà une string (base64 ou URL)
            setPreviewUrl(doc.data as string);
          }
        }
      } catch (err) {
        console.error(t("preview.loadingError"), err);
        setError(t("preview.failedToLoad"));
      } finally {
        setLoading(false);
      }
    },
    [service, t]
  );

  useEffect(() => {
    // Si le document a changé, réinitialiser le flag
    const docId =
      document?.id || document?.name || JSON.stringify(document?.optionValues);
    if (lastDocumentIdRef.current !== docId) {
      hasLoadedRef.current = false;
      lastDocumentIdRef.current = docId;

      // Nettoyer l'ancienne preview URL avant de charger la nouvelle
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
    }

    // Ne charger qu'une seule fois par document
    if (document && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadPreview(document);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [document, loadPreview]); // ⭐ previewUrl intentionnellement exclu pour éviter la boucle

  // Cleanup lors de la fermeture du modal (unmount uniquement)
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ⭐ Array vide = cleanup uniquement au unmount

  const renderPreviewContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-96">
          <LoadingLoader />
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
          <p className="text-destructive text-center">{error}</p>
          <Button
            variant="outline"
            onClick={() => {
              hasLoadedRef.current = false;
              loadPreview(document);
            }}
          >
            {t("actions.retry")}
          </Button>
        </div>
      );
    }

    if (!previewUrl) {
      return (
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">{t("preview.noPreview")}</p>
        </div>
      );
    }

    // Déterminer le type de contenu pour l'affichage
    const isImage = service.isImage(document);
    const isPdf = document.type === "application/pdf";

    if (isImage) {
      return (
        <div className="flex items-center justify-center p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt={document.name || ""}
            className="max-w-full max-h-96 object-contain rounded-lg"
          />
        </div>
      );
    }

    if (isPdf) {
      return (
        <div className="w-full h-96">
          <iframe
            src={previewUrl}
            className="w-full h-full border-0 rounded-lg"
            title={`${t("preview.previewOf")} ${document.name || ""}`}
          />
        </div>
      );
    }

    // Pour les autres types (texte, etc.)
    return (
      <div className="w-full h-96">
        <iframe
          src={previewUrl}
          className="w-full h-full border-0 rounded-lg"
          title={`${t("preview.previewOf")} ${document.name || ""}`}
        />
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="overflow-y-auto max-h-[70vh]">
        {renderPreviewContent()}
      </div>

      {document && (
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {service.formatSize(document.fileSize)} • {document.type}
          </div>
        </div>
      )}
    </div>
  );
};
