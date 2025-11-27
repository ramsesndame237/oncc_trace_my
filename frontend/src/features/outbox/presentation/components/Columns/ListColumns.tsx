"use client";

import { Icon } from "@/components/icon";
import { Badge } from "@/components/ui/badge";
import { SplitButton } from "@/components/ui/split-button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { dayjs } from "@/lib/dayjs";
import { cn } from "@/lib/utils";
import { ColumnDef } from "@tanstack/react-table";
import { AlertCircle, Clock, RefreshCw, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { OutboxOperationDetails } from "../../../domain/outbox.types";
import { useOutboxStore } from "../../../infrastructure/store/outboxStore";
import { useOutboxErrorTranslation } from "../../hooks/useOutboxErrorTranslation";
import { getEntityInfoFromPayload } from "../../utils/getEntityInfoFromPayload";
import { DeleteConfirmationModal } from "../DeleteConfirmationModal";
import { EntityInfoTooltip } from "../EntityInfoTooltip";
import { HierarchicalConflictDisplay } from "../HierarchicalConflictDisplay";
import { LocationConflictDisplay } from "../LocationConflictDisplay";

// Composant pour les actions individuelles avec dropdown
function OperationActions({
  operation,
}: {
  operation: OutboxOperationDetails;
}) {
  const { t } = useTranslation(["outbox", "common"]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const { retryOperation, isOnline, isSyncing } = useOutboxStore();

  const handleRetry = async () => {
    if (operation.id) {
      await retryOperation(operation.id);
    }
  };

  const canRetry = operation.canRetry && isOnline && !isSyncing;
  const hasError = !!operation.lastError;

  // Déterminer le lien et le texte du bouton en fonction du type d'entité
  const getButtonLinkAndText = () => {
    // Pour les magasins
    if (operation.entityType === "store") {
      return {
        href: `/stores/edit?entityId=${operation.entityId}&editOffline=true`,
        text: t("actions.modify"),
      };
    }

    // Pour les utilisateurs
    if (operation.entityType === "user") {
      return {
        href: `/users/edit?entityId=${operation.entityId}&editOffline=true`,
        text: t("actions.modify"),
      };
    }

    // Pour les bassins de production
    if (operation.entityType === "productionBasin") {
      return {
        href: `/production-basin/edit?entityId=${operation.entityId}&editOffline=true`,
        text: t("actions.modify"),
      };
    }

    // Pour les campagnes
    if (operation.entityType === "campaign") {
      return {
        href: `/campaign/edit?entityId=${operation.entityId}&editOffline=true`,
        text: t("actions.modify"),
      };
    }

    // Pour les parcelles
    if (operation.entityType === "parcel") {
      if (operation.operation === "create_bulk") {
        if (operation.payload.type === "add_producer") {
          return {
            href: `actors/producer/add/parcels?entityId=${operation.entityId}&editOffline=true`,
            text: t("actions.modify"),
          };
        }
        return {
          href: `/actors/producer/edit/parcels?entityId=${operation.entityId}&editOffline=true`,
          text: t("actions.modify"),
        };
      }
      if (operation.operation === "update") {
        return {
          href: `/actors/producer/edit/parcels?entityId=${operation.entityId}&parcelId=${operation.payload.parcelId}&editOffline=true`,
          text: t("actions.modify"),
        };
      }
    }

    if (operation.entityType === "convention") {
      if (operation.operation === "create") {
        return {
          href: `/conventions/create?entityId=${operation.entityId}&editOffline=true`,
          text: t("actions.modify"),
        };
      }
      if (operation.operation === "update") {
        return {
          href: `/conventions/edit?entityId=${operation.entityId}&editOffline=true`,
          text: t("actions.modify"),
        };
      }
    }

    // Pour les calendriers
    if (operation.entityType === "calendar") {
      const calendarType = operation.payload.type;

      if (calendarType === "MARCHE") {
        if (operation.operation === "create") {
          return {
            href: `/calendars/market/create/informations?entityId=${operation.entityId}&editOffline=true`,
            text: t("actions.modify"),
          };
        }
        if (operation.operation === "update") {
          return {
            href: `/calendars/market/edit?entityId=${operation.entityId}&editOffline=true`,
            text: t("actions.modify"),
          };
        }
      }

      if (calendarType === "ENLEVEMENT") {
        if (operation.operation === "create") {
          return {
            href: `/calendars/pickup/create/informations?entityId=${operation.entityId}&editOffline=true`,
            text: t("actions.modify"),
          };
        }
        if (operation.operation === "update") {
          return {
            href: `/calendars/pickup/edit?entityId=${operation.entityId}&editOffline=true`,
            text: t("actions.modify"),
          };
        }
      }
    }

    // Pour les transferts de produits
    if (operation.entityType === "product-transfer") {
      const transferType = operation.payload.transferType;

      if (transferType === "GROUPAGE") {
        if (operation.operation === "create") {
          return {
            href: `/product-transfers/groupage/create/general-info?entityId=${operation.entityId}&editOffline=true`,
            text: t("actions.modify"),
          };
        }
        if (operation.operation === "update") {
          return {
            href: `/product-transfers/groupage/edit?entityId=${operation.entityId}&editOffline=true`,
            text: t("actions.modify"),
          };
        }
      }

      if (transferType === "STANDARD") {
        if (operation.operation === "create") {
          return {
            href: `/product-transfers/standard/create/general-info?entityId=${operation.entityId}&editOffline=true`,
            text: t("actions.modify"),
          };
        }
        if (operation.operation === "update") {
          return {
            href: `/product-transfers/standard/edit?entityId=${operation.entityId}&editOffline=true`,
            text: t("actions.modify"),
          };
        }
      }
    }

    // Pour les transactions
    if (operation.entityType === "transaction") {
      const transactionType = operation.payload.transactionType;

      if (transactionType === "SALE") {
        if (operation.operation === "create") {
          return {
            href: `/transactions/sale/create/general-info?entityId=${operation.entityId}&editOffline=true`,
            text: t("actions.modify"),
          };
        }
        if (operation.operation === "update") {
          return {
            href: `/transactions/sale/edit?entityId=${operation.entityId}&editOffline=true`,
            text: t("actions.modify"),
          };
        }
      }

      if (transactionType === "PURCHASE") {
        if (operation.operation === "create") {
          return {
            href: `/transactions/purchase/create/general-info?entityId=${operation.entityId}&editOffline=true`,
            text: t("actions.modify"),
          };
        }
        if (operation.operation === "update") {
          return {
            href: `/transactions/purchase/edit?entityId=${operation.entityId}&editOffline=true`,
            text: t("actions.modify"),
          };
        }
      }
    }

    // Pour les acteurs
    if (operation.entityType === "actor") {
      if (operation.payload.actorType === "PRODUCER") {
        if (operation.operation === "create") {
          return {
            href: `/actors/producer/create?entityId=${operation.entityId}&editOffline=true`,
            text: t("actions.modify"),
          };
        }
        if (operation.operation === "update") {
          return {
            href: `/actors/producer/edit?entityId=${operation.entityId}&editOffline=true`,
            text: t("actions.modify"),
          };
        }
      }

      if (operation.payload.actorType === "PRODUCERS") {
        if (operation.operation === "create") {
          return {
            href: `/actors/producers/create?entityId=${operation.entityId}&editOffline=true`,
            text: t("actions.modify"),
          };
        }
        if (operation.operation === "update") {
          return {
            href: `/actors/producers/edit?entityId=${operation.entityId}&editOffline=true`,
            text: t("actions.modify"),
          };
        }
        // Opération de gestion des producteurs d'un OPA
        if (operation.operation === "update_producer_opa") {
          return {
            href: `/actors/producers/manage/producers?entityId=${operation.entityId}&editOffline=true`,
            text: t("actions.modify"),
          };
        }
      }

      if (operation.payload.actorType === "BUYER") {
        if (operation.operation === "create") {
          return {
            href: `/actors/buyers/create?entityId=${operation.entityId}&editOffline=true`,
            text: t("actions.modify"),
          };
        }
        if (operation.operation === "update") {
          return {
            href: `/actors/buyers/edit?entityId=${operation.entityId}&editOffline=true`,
            text: t("actions.modify"),
          };
        }
      }

      if (operation.payload.actorType === "EXPORTER") {
        if (operation.operation === "create") {
          return {
            href: `/actors/exporters/create?entityId=${operation.entityId}&editOffline=true`,
            text: t("actions.modify"),
          };
        }
        if (operation.operation === "update") {
          return {
            href: `/actors/exporters/edit?entityId=${operation.entityId}&editOffline=true`,
            text: t("actions.modify"),
          };
        }
      }

      if (operation.payload.actorType === "TRANSFORMER") {
        if (operation.operation === "create") {
          return {
            href: `/actors/transformers/create?entityId=${operation.entityId}&editOffline=true`,
            text: t("actions.modify"),
          };
        }
        if (operation.operation === "update") {
          return {
            href: `/actors/transformers/edit?entityId=${operation.entityId}&editOffline=true`,
            text: t("actions.modify"),
          };
        }
      }

      return {
        href: `/actors/edit?entityId=${operation.entityId}&editOffline=true`,
        text: t("actions.modify"),
      };
    }

    // Pour les autres types, on garde le comportement par défaut (voir détails)
    return {
      href: `/outbox`,
      text: t("common:actions.viewDetails"),
    };
  };

  const buttonLinkAndText = getButtonLinkAndText();

  // Construction des éléments du dropdown
  const dropdownItems = [
    ...(hasError
      ? [
          {
            label: t("actions.retry"),
            onClick: handleRetry,
            disabled: !canRetry,
            icon: (
              <RefreshCw
                className={cn("h-4 w-4", isSyncing && "animate-spin")}
              />
            ),
          },
        ]
      : []),
    {
      label: t("actions.delete"),
      onClick: () => setShowDeleteModal(true),
      destructive: true,
      icon: <Trash2 className="h-4 w-4" />,
    },
  ];

  return (
    <div className="flex items-center">
      <SplitButton
        asChild
        dropdownItems={dropdownItems}
        dropdownAlign="end"
        dropdownWidth="160px"
        size={"default"}
      >
        <Link href={buttonLinkAndText.href}>{buttonLinkAndText.text}</Link>
      </SplitButton>

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        operations={[operation]}
      />
    </div>
  );
}

// Utilitaire pour récupérer la clé de traduction du type d'entité
function getEntityTypeKey(operation: OutboxOperationDetails): string {
  const keys: Record<string, string> = {
    productionBasin: "entityTypes.productionBasin",
    campaign: "entityTypes.campaign",
    location: "entityTypes.location",
    user: "entityTypes.user",
    store: "entityTypes.store",
    actor: "entityTypes.actor",
    parcel: "entityTypes.parcel",
    document: "entityTypes.document",
    calendar: "entityTypes.calendar",
    "product-transfer": "entityTypes.product-transfer",
    convention: "entityTypes.convention",
    transaction: "entityTypes.transaction",
  };
  return keys[operation.entityType] || operation.entityType;
}

function getOperationVariant(
  operation: string
): "text-primary" | "text-yellow-500" | "text-destructive" {
  switch (operation) {
    case "create":
    case "create_bulk":
      return "text-primary";
    case "update":
    case "update_producer_opa":
      return "text-yellow-500";
    case "delete":
      return "text-destructive";
    default:
      return "text-primary";
  }
}

// Header components avec traductions
const RecordHeader = () => {
  const { t } = useTranslation("outbox");
  return <span>{t("table.record")}</span>;
};

const StatusHeader = () => {
  const { t } = useTranslation("outbox");
  return <span>{t("table.status")}</span>;
};

const CreatedAtHeader = () => {
  const { t } = useTranslation("outbox");
  return <span>{t("table.createdAt")}</span>;
};

// Cell components avec traductions
const EntityNameCell = ({
  operation,
}: {
  operation: OutboxOperationDetails;
}) => {
  const { t } = useTranslation("outbox");
  const entityTypeKey = getEntityTypeKey(operation);
  const entityTypeLabel = entityTypeKey.includes(".")
    ? t(
        entityTypeKey as
          | "entityTypes.productionBasin"
          | "entityTypes.campaign"
          | "entityTypes.location"
          | "entityTypes.user"
          | "entityTypes.store"
          | "entityTypes.actor"
          | "entityTypes.parcel"
          | "entityTypes.document"
          | "entityTypes.calendar"
          | "entityTypes.product-transfer"
          | "entityTypes.convention"
          | "entityTypes.transaction"
      )
    : entityTypeKey;
  const entityName = `${entityTypeLabel} ${operation.entityId.slice(0, 12)}...`;

  // Extraire les informations de l'entité depuis le payload
  const entityInfo = getEntityInfoFromPayload(operation, t);

  return (
    <div className="flex flex-col gap-1 min-w-0">
      <EntityInfoTooltip entityInfo={entityInfo}>
        <span
          className="font-medium truncate flex items-center"
          title={entityName}
        >
          <Icon
            name="DocumentIcon"
            className={getOperationVariant(operation.operation)}
          />{" "}
          <span className="ml-1">{entityName}</span>
        </span>
      </EntityInfoTooltip>
    </div>
  );
};

const StatusCell = ({ operation }: { operation: OutboxOperationDetails }) => {
  const { t } = useTranslation("outbox");
  const { translateError } = useOutboxErrorTranslation();
  const hasError = !!operation.lastError;

  if (hasError) {
    // Affichage spécialisé pour les conflits de localisation
    if (
      operation.lastError?.code === "PRODUCTION_BASIN_LOCATION_CONFLICTS" &&
      operation.lastError?.conflicts &&
      operation.lastError.conflicts.length > 0
    ) {
      return (
        <LocationConflictDisplay
          conflicts={operation.lastError.conflicts}
          operation={operation}
          isMobile={false}
        />
      );
    }

    // Affichage spécialisé pour les conflits hiérarchiques
    if (
      (operation.lastError?.code ===
        "PRODUCTION_BASIN_REGION_DEPARTMENT_HIERARCHY_CONFLICT" ||
        operation.lastError?.code ===
          "PRODUCTION_BASIN_DEPARTMENT_DISTRICT_HIERARCHY_CONFLICT" ||
        operation.lastError?.code ===
          "PRODUCTION_BASIN_DISTRICT_PARENT_CONFLICT" ||
        operation.lastError?.code ===
          "PRODUCTION_BASIN_DEPARTMENT_PARENT_CONFLICT") &&
      ((operation.lastError?.regionConflicts &&
        operation.lastError.regionConflicts.length > 0) ||
        (operation.lastError?.departmentConflicts &&
          operation.lastError.departmentConflicts.length > 0) ||
        (operation.lastError?.districtParentConflicts &&
          operation.lastError.districtParentConflicts.length > 0) ||
        (operation.lastError?.departmentParentConflicts &&
          operation.lastError.departmentParentConflicts.length > 0))
    ) {
      return (
        <HierarchicalConflictDisplay
          regionConflicts={operation.lastError.regionConflicts}
          departmentConflicts={operation.lastError.departmentConflicts}
          districtParentConflicts={operation.lastError.districtParentConflicts}
          departmentParentConflicts={
            operation.lastError.departmentParentConflicts
          }
          operation={operation}
          isMobile={false}
        />
      );
    }

    // Traduire le message d'erreur basé sur le code
    const translatedErrorMessage = operation.lastError?.code
      ? translateError(operation.lastError.code, operation.lastError?.message)
      : operation.lastError?.message || t("status.syncError");

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center space-x-2 cursor-help">
              <Icon name="AlertCircle" className="h-4 w-4 text-red-500" />
              <Badge variant="destructive" className="text-xs">
                {t("status.failed")}
              </Badge>
              {operation.retries > 0 && (
                <Badge variant="outline" className="text-xs">
                  {t("status.attempts", { count: operation.retries })}
                </Badge>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="left" className="max-w-xs">
            <div className="space-y-1">
              <p className="font-medium">{t("status.syncError")}</p>
              <p className="text-sm">{translatedErrorMessage}</p>
              {operation.lastError?.code && (
                <p className="text-xs text-muted-foreground">
                  {t("mobile.code")} {operation.lastError.code}
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <Clock className="h-4 w-4 text-orange-500" />
      <Badge variant="secondary" className="text-xs">
        {t("status.pending")}
      </Badge>
    </div>
  );
};

const TimestampCell = ({ timestamp }: { timestamp: number }) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInMinutes = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60)
  );

  let relativeTime = "";
  if (diffInMinutes < 1) {
    relativeTime = "À l'instant";
  } else if (diffInMinutes < 60) {
    relativeTime = `il y a ${diffInMinutes} min`;
  } else if (diffInMinutes < 1440) {
    const hours = Math.floor(diffInMinutes / 60);
    relativeTime = `il y a ${hours} h`;
  } else {
    const days = Math.floor(diffInMinutes / 1440);
    relativeTime = `il y a ${days}j`;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="text-sm cursor-help">
            <div className="font-medium">{relativeTime}</div>
            <div className="text-xs text-muted-foreground">
              {dayjs(timestamp).format("DD/MM HH:mm")}
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{dayjs(timestamp).format("dddd DD MMMM YYYY [à] HH:mm:ss")}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// Colonnes pour l'affichage desktop avec actions avancées
export const columns: ColumnDef<OutboxOperationDetails>[] = [
  {
    accessorKey: "entityName",
    header: RecordHeader,
    size: 250,
    cell: ({ row }) => <EntityNameCell operation={row.original} />,
  },
  {
    accessorKey: "lastError",
    header: StatusHeader,
    size: 200,
    cell: ({ row }) => <StatusCell operation={row.original} />,
  },
  {
    accessorKey: "timestamp",
    header: CreatedAtHeader,
    size: 150,
    cell: ({ row }) => (
      <TimestampCell timestamp={row.getValue("timestamp") as number} />
    ),
  },
  {
    id: "actions",
    size: 120,
    cell: ({ row }) => {
      const operation = row.original;
      return (
        <div className="flex justify-end">
          <OperationActions operation={operation} />
        </div>
      );
    },
    enableSorting: false,
  },
];

const MobileOperationsHeader = () => {
  const { t } = useTranslation("outbox");
  return <span>{t("table.operations")}</span>;
};

const MobileCard = ({ operation }: { operation: OutboxOperationDetails }) => {
  const { t } = useTranslation("outbox");
  const { translateError } = useOutboxErrorTranslation();
  const entityTypeKey = getEntityTypeKey(operation);
  const entityTypeLabel = entityTypeKey.includes(".")
    ? t(
        entityTypeKey as
          | "entityTypes.productionBasin"
          | "entityTypes.campaign"
          | "entityTypes.location"
          | "entityTypes.user"
          | "entityTypes.store"
          | "entityTypes.actor"
          | "entityTypes.parcel"
          | "entityTypes.document"
          | "entityTypes.calendar"
          | "entityTypes.product-transfer"
          | "entityTypes.convention"
          | "entityTypes.transaction"
      )
    : entityTypeKey;
  const entityName = `${entityTypeLabel} ${operation.entityId.slice(0, 12)}...`;
  const hasError = !!operation.lastError;

  // Extraire les informations de l'entité depuis le payload
  const entityInfo = getEntityInfoFromPayload(operation, t);

  return (
    <div className="border border-border rounded-md p-4 bg-white space-y-3">
      {/* En-tête */}
      <div className="flex items-start space-x-3">
        <div className="flex-1 min-w-0">
          <EntityInfoTooltip entityInfo={entityInfo}>
            <span
              className="font-medium truncate flex items-center"
              title={entityName}
            >
              <Icon
                name="DocumentIcon"
                className={getOperationVariant(operation.operation)}
              />{" "}
              <span className="ml-1">{entityName}</span>
            </span>
          </EntityInfoTooltip>
        </div>

        <OperationActions operation={operation} />
      </div>

      {/* Informations détaillées */}
      <div className="text-sm text-muted-foreground space-y-2">
        <div className="flex items-center justify-between">
          <span>Créé: {dayjs(operation.timestamp).format("DD MMM HH:mm")}</span>
          <span className="text-xs">
            ID: {operation.entityId.slice(0, 8)}...
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {hasError ? (
              <>
                <AlertCircle className="h-4 w-4 text-red-500" />
                <Badge variant="destructive" className="text-xs">
                  {t("status.failed")}
                </Badge>
                {operation.retries > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {t("status.attempts", { count: operation.retries })}
                  </Badge>
                )}
              </>
            ) : (
              <>
                <Clock className="h-4 w-4 text-orange-500" />
                <Badge variant="secondary" className="text-xs">
                  {t("status.pending")}
                </Badge>
              </>
            )}
          </div>
        </div>

        {/* Affichage de l'erreur sur mobile */}
        {hasError && operation.lastError && (
          <>
            {/* Affichage spécialisé pour les conflits de localisation */}
            {operation.lastError.code ===
              "PRODUCTION_BASIN_LOCATION_CONFLICTS" &&
            operation.lastError.conflicts &&
            operation.lastError.conflicts.length > 0 ? (
              <LocationConflictDisplay
                conflicts={operation.lastError.conflicts}
                operation={operation}
                isMobile={true}
              />
            ) : /* Affichage spécialisé pour les conflits hiérarchiques */
            (operation.lastError.code ===
                "PRODUCTION_BASIN_REGION_DEPARTMENT_HIERARCHY_CONFLICT" ||
                operation.lastError.code ===
                  "PRODUCTION_BASIN_DEPARTMENT_DISTRICT_HIERARCHY_CONFLICT" ||
                operation.lastError.code ===
                  "PRODUCTION_BASIN_DISTRICT_PARENT_CONFLICT" ||
                operation.lastError.code ===
                  "PRODUCTION_BASIN_DEPARTMENT_PARENT_CONFLICT") &&
              ((operation.lastError.regionConflicts &&
                operation.lastError.regionConflicts.length > 0) ||
                (operation.lastError.departmentConflicts &&
                  operation.lastError.departmentConflicts.length > 0) ||
                (operation.lastError.districtParentConflicts &&
                  operation.lastError.districtParentConflicts.length > 0) ||
                (operation.lastError.departmentParentConflicts &&
                  operation.lastError.departmentParentConflicts.length > 0)) ? (
              <HierarchicalConflictDisplay
                regionConflicts={operation.lastError.regionConflicts}
                departmentConflicts={operation.lastError.departmentConflicts}
                districtParentConflicts={
                  operation.lastError.districtParentConflicts
                }
                departmentParentConflicts={
                  operation.lastError.departmentParentConflicts
                }
                operation={operation}
                isMobile={true}
              />
            ) : (
              /* Affichage standard pour les autres erreurs */
              <div className="bg-red-50 border border-red-200 rounded p-2">
                <p className="text-xs text-red-700 line-clamp-2">
                  {operation.lastError.code
                    ? translateError(
                        operation.lastError.code,
                        operation.lastError.message
                      )
                    : operation.lastError.message}
                </p>
                {operation.lastError.code && (
                  <p className="text-xs text-red-600 mt-1">
                    {t("mobile.code")} {operation.lastError.code}
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// Colonnes mobile simplifiées
export const columnsMobile: ColumnDef<OutboxOperationDetails>[] = [
  {
    id: "mobile-card",
    header: MobileOperationsHeader,
    cell: ({ row }) => <MobileCard operation={row.original} />,
  },
];
