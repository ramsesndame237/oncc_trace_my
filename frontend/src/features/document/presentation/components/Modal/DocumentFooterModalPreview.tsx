"use client";

import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";

interface DocumentFooterModalPreviewProps {
  onClose: () => void;
  onDownload: () => void;
  hasDocumentId?: boolean;
}

export const DocumentFooterModalPreview: React.FC<
  DocumentFooterModalPreviewProps
> = ({ onClose, onDownload, hasDocumentId = true }) => {
  const { t } = useTranslation("document");

  if (!hasDocumentId) return <></>;

  return (
    <div className="flex items-center justify-between w-full">
      <Button
        variant="outline"
        onClick={onClose}
        className="flex items-center space-x-2"
      >
        <X className="h-4 w-4" />
        <span>{t("actions.close")}</span>
      </Button>

      <Button
        variant="default"
        onClick={onDownload}
        className="flex items-center space-x-2"
      >
        <Download className="h-4 w-4" />
        <span>{t("actions.download")}</span>
      </Button>
    </div>
  );
};
