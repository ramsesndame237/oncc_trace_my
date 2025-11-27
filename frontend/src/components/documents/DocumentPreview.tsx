"use client";

import WrapperModal from "@/components/modals/WrapperModal";
import { Button } from "@/components/ui/button";
import { IFileValue } from "@/types/type";
import NiceModal from "@ebay/nice-modal-react";
import type { i18n as I18nInstance } from "i18next";
import { EyeIcon, PaperclipIcon } from "lucide-react";
import Image from "next/image";
import React from "react";
import { useTranslation } from "react-i18next";
import { blobToBase64 } from "@/lib/blobToBase64";

interface DocumentPreviewProps {
  document: IFileValue;
  className?: string;
}

const resolveDocumentTypeLabel = (
  i18nInstance: I18nInstance,
  code: string,
  fallback?: string
) => {
  if (!code) {
    return fallback ?? "";
  }

  const namespaces = [
    { ns: "document", key: `types.${code}` },
    { ns: "actor", key: `documentTypes.${code}` },
  ];

  const languages = Array.from(
    new Set([i18nInstance.language, ...(i18nInstance.languages ?? [])])
  ).filter(Boolean) as string[];

  for (const { ns, key } of namespaces) {
    for (const language of languages) {
      const rawValue = i18nInstance.getResource(language, ns, key);
      if (typeof rawValue === "string") {
        return rawValue;
      }
    }
  }

  return fallback ?? code;
};

const DocumentPreviewModal = ({ document }: { document: IFileValue }) => {
  const { t, i18n } = useTranslation(["actor", "common", "document"]);
  const documentCode = String(document.optionValues?.[1] ?? "");
  const documentName = resolveDocumentTypeLabel(
    i18n,
    documentCode,
    document.name
  );


  const isImage = document.type.startsWith("image/");
  const isPdf = document.type === "application/pdf";

  // ⭐ Gérer les Blobs : convertir en data URL pour les images, ObjectURL pour les PDFs
  const [documentDataUrl, setDocumentDataUrl] = React.useState<string | null>(null);
  const [isConverting, setIsConverting] = React.useState(false);

  React.useEffect(() => {
    let isMounted = true;
    let objectUrl: string | null = null;

    const convertData = async () => {
      if (!document.data) {
        console.error("❌ Document data is empty or undefined", document);
        if (isMounted) setDocumentDataUrl(null);
        return;
      }

      if (document.data instanceof Blob) {
        setIsConverting(true);

        try {
          if (isImage) {
            // ⭐ Pour les images : convertir en base64 (data URL)
            // Cela évite les problèmes de révocation avec React Strict Mode
            const base64 = await blobToBase64(document.data);
            if (isMounted) {
              setDocumentDataUrl(base64);
            }
          } else if (isPdf) {
            // ⭐ Pour les PDFs : utiliser ObjectURL (meilleur pour les iframes)
            objectUrl = URL.createObjectURL(document.data);
            if (isMounted) {
              setDocumentDataUrl(objectUrl);
            }
          } else {
            // Autres types de fichiers
            objectUrl = URL.createObjectURL(document.data);
            if (isMounted) {
              setDocumentDataUrl(objectUrl);
            }
          }
        } catch (error) {
          console.error("❌ Erreur lors de la conversion du Blob:", error);
          if (isMounted) setDocumentDataUrl(null);
        } finally {
          if (isMounted) setIsConverting(false);
        }
      } else {
        // C'est déjà une string (URL HTTP ou base64)
        if (isMounted) {
          setDocumentDataUrl(document.data as string);
          setIsConverting(false);
        }
      }
    };

    convertData();

    // Cleanup : révoquer l'ObjectURL seulement pour les PDFs et autres (pas pour les images en base64)
    return () => {
      isMounted = false;
      if (objectUrl && !isImage) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [document, isImage, isPdf]);

  // ⭐ Si pas de données, afficher un message d'erreur ou un loader
  if (isConverting) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-700">
          <p className="font-medium">Chargement du document...</p>
        </div>
      </div>
    );
  }

  if (!documentDataUrl) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <p className="font-medium">{t("common:documents.previewError")}</p>
          <p className="text-sm mt-1">
            Les données du document sont manquantes ou invalides.
          </p>
        </div>
      </div>
    );
  }

  // ⭐ Détecter si c'est une data URL (base64) ou blob URL pour utiliser <img> natif
  const isLocalData = documentDataUrl?.startsWith("data:") || documentDataUrl?.startsWith("blob:");

  return (
    <div className="space-y-4">
      <div className="relative max-h-[70vh] overflow-auto">
        {isImage && (
          <>
            {isLocalData ? (
              // Pour les data URLs (base64) et blob URLs locaux, utiliser <img> natif
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={documentDataUrl}
                alt={documentName}
                className="max-w-full h-auto object-contain rounded-lg"
              />
            ) : (
              // Pour les URLs HTTP/HTTPS distantes, utiliser Next.js Image avec optimisation
              <Image
                src={documentDataUrl}
                alt={documentName}
                width={800}
                height={600}
                className="max-w-full h-auto object-contain rounded-lg"
                unoptimized
              />
            )}
          </>
        )}
        {isPdf && (
          <iframe
            src={documentDataUrl}
            className="w-full h-[70vh] rounded-lg border"
            title={documentName}
          />
        )}
      </div>

      <div className="text-sm text-gray-600 space-y-1">
        <p>
          <strong>{t("common:documents.name")}:</strong> {documentName}
        </p>
        <p>
          <strong>{t("common:documents.type")}:</strong> {document.type}
        </p>
        <p>
          <strong>{t("common:documents.size")}:</strong>{" "}
          {(document.fileSize / 1024).toFixed(1)} KB
        </p>
      </div>

      <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded">
        💡 {t("common:documents.closeHint")}
      </div>
    </div>
  );
};

export const DocumentPreview: React.FC<DocumentPreviewProps> = ({
  document,
  className = "",
}) => {
  const { t, i18n } = useTranslation(["actor", "common", "document"]);
  const documentCode = String(document.optionValues?.[1] ?? "");
  const documentName = resolveDocumentTypeLabel(
    i18n,
    documentCode,
    document.name
  );

  const handlePreview = () => {
    // Vérifier si c'est une image ou un PDF
    const isImage = document.type.startsWith("image/");
    const isPdf = document.type === "application/pdf";

    if (!isImage && !isPdf) {
      // Pour les autres types de fichiers, on pourrait ouvrir dans un nouvel onglet ou télécharger
      console.log("Preview not available for this file type:", document.type);
      return;
    }

    // Ouvrir le modal avec la prévisualisation du document
    NiceModal.show(WrapperModal, {
      title: t("common:documents.preview"),
      content: <DocumentPreviewModal document={document} />,
      size: "xl",
      closable: true,
    });
  };

  return (
    <div
      className={`flex items-center justify-between p-2 bg-gray-50 rounded border ${className}`}
    >
      <div className="flex items-center space-x-2">
        <PaperclipIcon className="h-4 w-4 text-gray-500" />
        <span className="text-sm text-gray-700">{documentName}</span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0"
        onClick={handlePreview}
        title={t("common:documents.previewAction")}
      >
        <EyeIcon className="h-3 w-3" />
      </Button>
    </div>
  );
};

export default DocumentPreview;
