"use client";

import { LoadingLoader } from "@/components/modules/loading-loader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { UserRole } from "@/core/domain/user-role.value-object";
import type { UserRoles } from "@/core/domain";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { Eye, Info } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { AuditLog } from "../../domain";
import { AuditLogService } from "../../infrastructure";
import { useAuditLog } from "../hooks";
import { AuditLogChangesModal } from "./AuditLogChangesModal";

interface AuditLogTableProps {
  auditableType: string;
  auditableId: string;
  className?: string;
}

export const AuditLogTable: React.FC<AuditLogTableProps> = ({
  auditableType,
  auditableId,
  className,
}) => {
  const { t } = useTranslation(["auditLog", "common"]);
  const { logs, pagination, loading, error, loadAuditLogs } = useAuditLog();
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const service = new AuditLogService();

  // Colonnes du tableau
  const columns: ColumnDef<AuditLog>[] = [
    {
      accessorKey: "user",
      header: () => (
        <span className="text-left text-sm !px-2 !text-foreground">
          {t('table.columns.user')}
        </span>
      ),
      cell: ({ row }) => {
        const log = row.original;
        const userRole = log.userRole
          ? new UserRole(log.userRole as UserRoles)
          : null;
        return (
          <div className="flex flex-col px-2">
            <span className="font-medium text-sm">
              {service.formatUserName(log.user)}
            </span>
            {log.userRole && (
              <span className="text-xs text-muted-foreground">
                {userRole?.getDisplayName()}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "formatted_action",
      header: t('table.columns.action'),
      cell: ({ row }) => {
        const log = row.original;
        const hasChanges = service.hasChanges(log);

        return (
          <div className="flex items-center gap-2">
            <Badge variant="outline">{service.formatAction(log.action)}</Badge>
            {hasChanges && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedLog(log);
                        setIsModalOpen(true);
                      }}
                      className="h-6 w-6 p-0"
                    >
                      <Info className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t('table.tooltip.viewChanges')}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "created_at",
      header: t('table.columns.date'),
      cell: ({ row }) => {
        const log = row.original;
        return (
          <div className="text-sm">{service.formatDate(log.createdAt)}</div>
        );
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const log = row.original;
        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedLog(log);
              setIsModalOpen(true);
            }}
            className="h-8 w-8 p-0"
          >
            <Eye className="h-4 w-4" />
          </Button>
        );
      },
    },
  ];

  // Charger les données initiales
  useEffect(() => {
    if (auditableType && auditableId) {
      loadAuditLogs({
        auditableType,
        auditableId,
        page: 1,
        limit: 10,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auditableType, auditableId]);

  // Gestion de la pagination
  const handlePaginationChange = (paginationState: PaginationState) => {
    const page = paginationState.pageIndex + 1;
    const limit = paginationState.pageSize;

    loadAuditLogs({
      auditableType,
      auditableId,
      page,
      limit,
    });
  };

  // Gestion de la fermeture du modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedLog(null);
  };

  if (loading && logs.length === 0) {
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
            loadAuditLogs({
              auditableType,
              auditableId,
              page: 1,
              limit: 10,
            })
          }
          className="mt-2"
        >
          {t('table.retry')}
        </Button>
      </div>
    );
  }

  return (
    <div className={className}>
      <DataTable
        columns={columns}
        data={logs}
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
        emptyMessage={t('auditLog:table.empty')}
        previousLabel={t('common:actions.previous')}
        nextLabel={t('common:actions.next')}
      />

      <AuditLogChangesModal
        log={selectedLog}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
};
