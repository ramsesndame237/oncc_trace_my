"use client";

import { Icon } from "@/components/icon";
import { LoadingLoader } from "@/components/modules/loading-loader";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { IFileValue } from "@/types/type";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { Download, Eye } from "lucide-react";
import Link from "next/link";
import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import type { Document } from "../../domain";
import { getDocumentTypeLabel } from "../../domain";
import { DocumentService } from "../../infrastructure";
import { useDocument } from "../hooks";
import { useDocumentModal } from "../hooks/useDocumentModal";

interface DocumentTableProps {
  documentableType: string;
  documentableId: string;
  className?: string;
  documentType?: string;
}

export const DocumentTable: React.FC<DocumentTableProps> = ({
  documentableType,
  documentableId,
  className,
  documentType,
}) => {
  const { t } = useTranslation(["document", "common"]);
  const { documents, pagination, loading, error, loadDocuments } =
    useDocument();
  const isOnline = useOnlineStatus();

  const { showDocumentPreview } = useDocumentModal();
  const service = new DocumentService();

  // Colonnes du tableau
  const columns: ColumnDef<Document>[] = [
    {
      accessorKey: "documentType",
      header: () => (
        <span className="text-left text-sm !px-2 !text-foreground">
          {t("table.documentType")}
        </span>
      ),
      cell: ({ row }) => {
        const document = row.original;

        const fileValue: IFileValue = {
          optionValues: ["", document.documentType || ""],
          type: document.mimeType || "application/octet-stream",
          data: document.publicUrl || "",
          fileSize: document.size || 0,
          name: document.originalName,
          id: document.id,
        };
        const icon = service.getFileIcon(fileValue);
        const documentTypeKey = getDocumentTypeLabel(
          document.documentType || ""
        );
        // Traduire la clé de traduction (ex: "document:types.producer_photo" -> "Photo 4x4 du producteur")
        const documentTypeLabel = t(documentTypeKey as unknown);

        return (
          <div className="flex items-center space-x-3 px-2">
            <Icon name={icon} className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-sm font-medium text-gray-700">
                {documentTypeLabel}
              </p>
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <span>{document.originalName}</span>
                <span>•</span>
                <span>{service.formatSize(document.size)}</span>
              </div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: () => t("table.dateAdded"),
      cell: ({ row }) => {
        const document = row.original;
        return (
          <div className="text-sm">
            {service.formatDate(document.createdAt)}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const document = row.original;

        const fileValue: IFileValue = {
          optionValues: ["", document.documentType || ""],
          type: document.mimeType || "application/octet-stream",
          data: document.publicUrl || "",
          fileSize: document.size || 0,
          name: document.originalName,
          id: document.id,
        };
        const canPreview = service.canPreview(fileValue);
        const downloadUrl = service.getDownloadUrl(fileValue);

        const handlePreviewClick = () => {
          showDocumentPreview(fileValue);
        };

        return (
          <div className="flex items-center space-x-2">
            {canPreview && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={handlePreviewClick}
                      disabled={!isOnline}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t("table.preview")}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  {isOnline ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      asChild
                    >
                      <Link
                        href={downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                      >
                        <Download className="h-4 w-4" />
                      </Link>
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      disabled
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("table.download")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        );
      },
    },
  ];

  // Charger les données initiales
  useEffect(() => {
    if (documentableType && documentableId) {
      loadDocuments({
        documentableType,
        documentableId,
        page: 1,
        limit: 10,
        documentType,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentableType, documentableId, documentType]);

  // Gestion de la pagination
  const handlePaginationChange = (paginationState: PaginationState) => {
    const page = paginationState.pageIndex + 1;
    const limit = paginationState.pageSize;

    loadDocuments({
      documentableType,
      documentableId,
      page,
      limit,
      documentType,
    });
  };

  if (loading && documents.length === 0) {
    return (
      <div className={className}>
        <LoadingLoader />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className} text-center py-8`}>
        <p className="text-destructive">{error}</p>
        <Button
          variant="outline"
          onClick={() =>
            loadDocuments({
              documentableType,
              documentableId,
              page: 1,
              limit: 10,
              documentType,
            })
          }
          className="mt-2"
        >
          {t("common:actions.retry")}
        </Button>
      </div>
    );
  }

  return (
    <div className={className}>
      <DataTable
        columns={columns}
        data={documents}
        pagination={
          pagination
            ? {
                total: pagination.total,
                perPage: pagination.perPage,
                currentPage: pagination.currentPage,
                lastPage: pagination.lastPage,
                firstPage: pagination.firstPage,
                firstPageUrl: pagination.firstPageUrl,
                lastPageUrl: pagination.lastPageUrl,
                nextPageUrl: pagination.nextPageUrl,
                previousPageUrl: pagination.previousPageUrl,
              }
            : undefined
        }
        onPaginationChange={handlePaginationChange}
        emptyMessage={t("table.noDocuments")}
      />
    </div>
  );
};
