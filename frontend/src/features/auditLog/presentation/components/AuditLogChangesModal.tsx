"use client";

import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { UserRoles } from "@/core/domain";
import { UserRole } from "@/core/domain/user-role.value-object";
import { dayjs } from "@/lib/dayjs";
import { useTranslation } from "react-i18next";
import type { AuditLog } from "../../domain";

interface AuditLogChangesModalProps {
  log: AuditLog | null;
  isOpen: boolean;
  onClose: () => void;
}

// Helper function to detect and format dates
const formatValue = (value: unknown): string => {
  if (value === null || value === undefined) {
    return "N/A";
  }

  // Check if it's a date string (ISO format or common date patterns)
  if (typeof value === "string") {
    // Try to parse as a date if it matches common date patterns
    if (
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value) || // ISO format
      /^\d{4}-\d{2}-\d{2}$/.test(value) // YYYY-MM-DD format
    ) {
      const date = dayjs(value);
      if (date.isValid()) {
        // Format with day, month name, year and time if available
        return date.format("D MMMM YYYY à HH:mm");
      }
    }
  }

  // For objects, stringify with formatting
  if (typeof value === "object") {
    return JSON.stringify(value, null, 2);
  }

  // For other values, convert to string
  return String(value);
};

// Helper function to format object values recursively
const formatObjectValues = (obj: unknown): unknown => {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(formatObjectValues);
  }

  if (typeof obj === "object") {
    const formatted: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      // Skip campaignId fields to keep them hidden
      if (key === "campaignId") {
        continue;
      }

      if (typeof value === "string") {
        // Check if it's a date string
        if (
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value) || // ISO format
          /^\d{4}-\d{2}-\d{2}$/.test(value) // YYYY-MM-DD format
        ) {
          const date = dayjs(value);
          if (date.isValid()) {
            formatted[key] = date.format("D MMMM YYYY à HH:mm");
            continue;
          }
        }
      }
      formatted[key] = formatObjectValues(value);
    }
    return formatted;
  }

  return obj;
};

export const AuditLogChangesModal: React.FC<AuditLogChangesModalProps> = ({
  log,
  isOpen,
  onClose,
}) => {
  const { t } = useTranslation("auditLog");

  if (!log) return null;

  const userRole = log.userRole
    ? new UserRole(log.userRole as UserRoles)
    : null;

  // Préparer les champs à afficher
  const fieldsToDisplay: Array<{
    field: string;
    oldValue?: unknown;
    newValue?: unknown;
  }> = [];

  // 1. Si on a des changed_fields, on les ajoute (ils ont oldValue et newValue)
  if (log.changed_fields && log.changed_fields.length > 0) {
    log.changed_fields
      .filter((change) => change.field !== "campaignId")
      .forEach((change) => {
        fieldsToDisplay.push({
          field: change.field,
          oldValue: change.oldValue,
          newValue: change.newValue,
        });
      });
  }

  // 2. Pour les actions de création, ajouter les newValues comme champs individuels
  if (
    log.newValues &&
    fieldsToDisplay.length === 0 // Seulement si pas déjà de changed_fields
  ) {
    Object.entries(log.newValues).forEach(([key, value]) => {
      if (key !== "campaignId") {
        fieldsToDisplay.push({
          field: key,
          newValue: value,
        });
      }
    });
  }

  // 3. Pour les actions de suppression, ajouter les oldValues comme champs individuels
  if (
    log.oldValues &&
    fieldsToDisplay.length === 0 // Seulement si pas déjà de changed_fields
  ) {
    Object.entries(log.oldValues).forEach(([key, value]) => {
      if (key !== "campaignId") {
        fieldsToDisplay.push({
          field: key,
          oldValue: value,
        });
      }
    });
  }

  const hasFields = fieldsToDisplay.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl h-[80vh] flex flex-col p-0">
        <div className="flex flex-col h-full">
          {/* Header fixe */}
          <div className="px-6 pt-6 pb-4 border-b">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {t("modal.title")}
                <Badge variant="outline">{log.formatted_action}</Badge>
              </DialogTitle>
            </DialogHeader>

            {/* Informations générales */}
            <div className="grid grid-cols-2 gap-4 text-sm mt-4">
              <div>
                <span className="font-medium text-muted-foreground">
                  {t("modal.labels.user")}
                </span>
                <p className="font-medium">
                  {log.user
                    ? `${log.user.givenName} ${log.user.familyName}`
                    : t("modal.labels.system")}
                </p>
                {log.user && (
                  <p className="text-xs text-muted-foreground">
                    @{log.user.username} • {userRole?.getDisplayName()}
                  </p>
                )}
              </div>
              <div>
                <span className="font-medium text-muted-foreground">
                  {t("modal.labels.date")}
                </span>
                <p className="font-medium">
                  {new Intl.DateTimeFormat("fr-FR", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  }).format(new Date(log.createdAt))}
                </p>
                {log.ipAddress && (
                  <p className="text-xs text-muted-foreground">
                    {t("modal.labels.ip")} {log.ipAddress}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Zone scrollable pour le contenu */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="space-y-4">
              {hasFields ? (
                <div>
                  <h4 className="font-medium mb-3">
                    {t("modal.sections.changes")}
                  </h4>
                  <div className="space-y-3">
                    {fieldsToDisplay.map((field, index) => {
                      const hasOldValue = field.oldValue !== undefined;
                      const hasNewValue = field.newValue !== undefined;

                      return (
                        <div key={index} className="border rounded-lg p-3">
                          <div className="font-medium text-sm mb-2 capitalize">
                            {field.field}
                          </div>

                          {/* Affichage comparatif si oldValue et newValue existent */}
                          {hasOldValue && hasNewValue ? (
                            <div className="grid grid-cols-2 gap-3 text-xs">
                              <div>
                                <span className="text-muted-foreground block mb-1">
                                  {t("modal.fields.oldValue")}
                                </span>
                                <div className="p-2 bg-red-50 border border-red-200 rounded">
                                  {formatValue(field.oldValue)}
                                </div>
                              </div>
                              <div>
                                <span className="text-muted-foreground block mb-1">
                                  {t("modal.fields.newValue")}
                                </span>
                                <div className="p-2 bg-green-50 border border-green-200 rounded">
                                  {formatValue(field.newValue)}
                                </div>
                              </div>
                            </div>
                          ) : hasNewValue ? (
                            /* Seulement newValue (création) */
                            <div className="text-xs">
                              <span className="text-muted-foreground block mb-1">
                                {t("modal.fields.newValue")}
                              </span>
                              <div className="p-2 bg-green-50 border border-green-200 rounded">
                                {typeof field.newValue === "object" &&
                                field.newValue !== null ? (
                                  <pre className="overflow-x-auto whitespace-pre-wrap">
                                    {JSON.stringify(
                                      formatObjectValues(field.newValue),
                                      null,
                                      2
                                    )}
                                  </pre>
                                ) : (
                                  formatValue(field.newValue)
                                )}
                              </div>
                            </div>
                          ) : hasOldValue ? (
                            /* Seulement oldValue (suppression) */
                            <div className="text-xs">
                              <span className="text-muted-foreground block mb-1">
                                {t("modal.fields.oldValue")}
                              </span>
                              <div className="p-2 bg-red-50 border border-red-200 rounded">
                                {typeof field.oldValue === "object" &&
                                field.oldValue !== null ? (
                                  <pre className="overflow-x-auto whitespace-pre-wrap">
                                    {JSON.stringify(
                                      formatObjectValues(field.oldValue),
                                      null,
                                      2
                                    )}
                                  </pre>
                                ) : (
                                  formatValue(field.oldValue)
                                )}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <p>{t("modal.messages.noData")}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
