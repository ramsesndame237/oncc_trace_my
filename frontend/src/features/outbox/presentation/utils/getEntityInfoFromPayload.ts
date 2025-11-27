import { TranslateFn } from "@/i18n/types";
import { OutboxOperationDetails } from "../../domain/outbox.types";

/**
 * Interface pour les informations d'entité à afficher dans le tooltip
 */
export interface EntityInfo {
  /** Lignes d'information à afficher */
  lines: Array<{
    label: string;
    value: string;
    highlight?: boolean; // Mettre en évidence (nom principal, code, etc.)
  }>;
  /** Icône à afficher (nom de l'icône Lucide) */
  icon?: string;
  /** Couleur de badge pour le statut */
  statusColor?: "default" | "success" | "warning" | "destructive";
}

/**
 * Extrait les informations pertinentes d'une entité depuis le payload
 * pour affichage dans un tooltip dans la colonne "Record" de l'outbox
 */
export function getEntityInfoFromPayload(
  operation: OutboxOperationDetails,
  t: TranslateFn
): EntityInfo | null {
  const { entityType, payload, operation: operationType } = operation;

  switch (entityType) {
    case "actor":
      return getActorInfo(payload, operationType, t);

    case "convention":
      return getConventionInfo(payload, t);

    case "calendar":
      return getCalendarInfo(payload, t);

    case "transaction":
      return getTransactionInfo(payload, t);

    case "campaign":
      return getCampaignInfo(payload, t);

    case "productionBasin":
      return getProductionBasinInfo(payload, t);

    case "store":
      return getStoreInfo(payload, t);

    case "user":
      return getUserInfo(payload, t);

    default:
      return null;
  }
}

// ========================================
// ACTEURS
// ========================================
function getActorInfo(
  payload: Record<string, unknown>,
  operationType: string,
  t: TranslateFn
): EntityInfo {
  const actorType = payload.actorType as string;
  const familyName = payload.familyName as string;
  const givenName = payload.givenName as string;
  const onccId = payload.onccId as string | undefined;
  const status = payload.status as string | undefined;

  const lines = [];

  // Type d'acteur
  lines.push({
    label: t("entityInfo.fields.type"),
    value: t(`entityInfo.actorTypes.${actorType}` as never, actorType),
    highlight: true,
  });

  // Nom complet
  if (familyName && givenName) {
    lines.push({
      label: t("entityInfo.fields.name"),
      value: `${familyName} ${givenName}`,
      highlight: true,
    });
  }

  // ID ONCC
  if (onccId) {
    lines.push({
      label: t("entityInfo.fields.onccId"),
      value: onccId,
    });
  }

  // Pour les relations OPA ↔ Producteurs
  if (operationType === "update_producer_opa") {
    const producers = payload.producers as Array<unknown> | undefined;
    if (producers) {
      lines.push({
        label: t("entityInfo.fields.producersAdded"),
        value: `${producers.length}`,
      });
    }
  }

  // Pour les relations Exportateur ↔ Acheteurs
  if (operationType === "update_buyer_exporter") {
    const buyers = payload.buyers as Array<unknown> | undefined;
    if (buyers) {
      lines.push({
        label: t("entityInfo.fields.buyersAdded"),
        value: `${buyers.length}`,
      });
    }
  }

  // Statut
  if (status) {
    lines.push({
      label: t("entityInfo.fields.status"),
      value: t(`entityInfo.statuses.${status}` as never, status),
    });
  }

  return {
    lines,
    icon: "Users",
    statusColor: status === "active" ? "success" : "warning",
  };
}

// ========================================
// CONVENTIONS
// ========================================
function getConventionInfo(
  payload: Record<string, unknown>,
  t: TranslateFn
): EntityInfo {
  const code = payload.code as string | undefined;
  const signatureDate = payload.signatureDate as string | undefined;
  const status = payload.status as string | undefined;

  const lines = [];

  // Code
  if (code) {
    lines.push({
      label: t("entityInfo.fields.code"),
      value: code,
      highlight: true,
    });
  }

  // Date de signature
  if (signatureDate) {
    lines.push({
      label: t("entityInfo.fields.signature"),
      value: new Date(signatureDate).toLocaleDateString("fr-FR"),
    });
  }

  // Note: Les noms de l'OPA et de l'acheteur nécessiteraient une requête IndexedDB
  // Pour l'instant, on affiche juste les informations disponibles dans le payload

  // Statut
  if (status) {
    lines.push({
      label: t("entityInfo.fields.status"),
      value: t(`entityInfo.statuses.${status}` as never, status),
    });
  }

  return {
    lines,
    icon: "FileText",
    statusColor: status === "active" ? "success" : "warning",
  };
}

// ========================================
// CALENDRIERS
// ========================================
function getCalendarInfo(
  payload: Record<string, unknown>,
  t: TranslateFn
): EntityInfo {
  const code = payload.code as string | undefined;
  const type = payload.type as string | undefined;
  const location = payload.location as string | undefined;
  const startDate = payload.startDate as string | undefined;
  const eventTime = payload.eventTime as string | undefined;
  const status = payload.status as string | undefined;

  const lines = [];

  // Code
  if (code) {
    lines.push({
      label: t("entityInfo.fields.code"),
      value: code,
      highlight: true,
    });
  }

  // Type
  if (type) {
    lines.push({
      label: t("entityInfo.fields.type"),
      value: t(`entityInfo.calendarTypes.${type}` as never, type),
      highlight: true,
    });
  }

  // Localisation
  if (location) {
    lines.push({
      label: t("entityInfo.fields.location"),
      value: location,
    });
  }

  // Date et heure
  if (startDate) {
    const dateStr = new Date(startDate).toLocaleDateString("fr-FR");
    const timeStr = eventTime ? ` à ${eventTime}` : "";
    lines.push({
      label: t("entityInfo.fields.date"),
      value: `${dateStr}${timeStr}`,
    });
  }

  // Statut
  if (status) {
    lines.push({
      label: t("entityInfo.fields.status"),
      value: t(`entityInfo.statuses.${status}` as never, status),
    });
  }

  return {
    lines,
    icon: "Calendar",
    statusColor: status === "active" ? "success" : "warning",
  };
}

// ========================================
// TRANSACTIONS
// ========================================
function getTransactionInfo(
  payload: Record<string, unknown>,
  t: TranslateFn
): EntityInfo {
  const code = payload.code as string | undefined;
  const transactionType = payload.transactionType as string | undefined;
  const transactionDate = payload.transactionDate as string | undefined;
  const products = payload.products as
    | Array<{
        totalPrice: number;
      }>
    | undefined;

  const lines = [];

  // Code
  if (code) {
    lines.push({
      label: t("entityInfo.fields.code"),
      value: code,
      highlight: true,
    });
  }

  // Type
  if (transactionType) {
    lines.push({
      label: t("entityInfo.fields.type"),
      value: t(
        `entityInfo.transactionTypes.${transactionType}` as never,
        transactionType
      ),
      highlight: true,
    });
  }

  // Date
  if (transactionDate) {
    lines.push({
      label: t("entityInfo.fields.date"),
      value: new Date(transactionDate).toLocaleDateString("fr-FR"),
    });
  }

  // Montant total
  if (products && products.length > 0) {
    const total = products.reduce((sum, p) => sum + (p.totalPrice || 0), 0);
    lines.push({
      label: t("entityInfo.fields.amount"),
      value: `${total.toLocaleString("fr-FR")} FCFA`,
    });
  }

  // Note: Les noms du vendeur et de l'acheteur nécessiteraient une requête IndexedDB

  return {
    lines,
    icon: "Receipt",
    statusColor: "default",
  };
}

// ========================================
// CAMPAGNES
// ========================================
function getCampaignInfo(
  payload: Record<string, unknown>,
  t: TranslateFn
): EntityInfo {
  const code = payload.code as string | undefined;
  const startDate = payload.startDate as string | undefined;
  const endDate = payload.endDate as string | undefined;
  const status = payload.status as string | undefined;

  const lines = [];

  // Code
  if (code) {
    lines.push({
      label: t("entityInfo.fields.code"),
      value: code,
      highlight: true,
    });
  }

  // Période
  if (startDate && endDate) {
    const start = new Date(startDate).toLocaleDateString("fr-FR");
    const end = new Date(endDate).toLocaleDateString("fr-FR");
    lines.push({
      label: t("entityInfo.fields.period"),
      value: `${start} - ${end}`,
    });
  }

  // Statut
  if (status) {
    lines.push({
      label: t("entityInfo.fields.status"),
      value: t(`entityInfo.statuses.${status}` as never, status),
    });
  }

  return {
    lines,
    icon: "Briefcase",
    statusColor: status === "active" ? "success" : "warning",
  };
}

// ========================================
// BASSINS DE PRODUCTION
// ========================================
function getProductionBasinInfo(
  payload: Record<string, unknown>,
  t: TranslateFn
): EntityInfo {
  const name = payload.name as string | undefined;
  const description = payload.description as string | undefined;

  const lines = [];

  // Nom
  if (name) {
    lines.push({
      label: t("entityInfo.fields.name"),
      value: name,
      highlight: true,
    });
  }

  // Description (tronquée)
  if (description) {
    const truncated =
      description.length > 50
        ? `${description.substring(0, 50)}...`
        : description;
    lines.push({
      label: t("entityInfo.fields.description"),
      value: truncated,
    });
  }

  return {
    lines,
    icon: "MapPin",
    statusColor: "default",
  };
}

// ========================================
// MAGASINS
// ========================================
function getStoreInfo(
  payload: Record<string, unknown>,
  t: TranslateFn
): EntityInfo {
  const name = payload.name as string | undefined;
  const code = payload.code as string | undefined;
  const storeType = payload.storeType as string | undefined;
  const capacity = payload.capacity as number | undefined;
  const status = payload.status as string | undefined;

  const lines = [];

  // Nom
  if (name) {
    lines.push({
      label: t("entityInfo.fields.name"),
      value: name,
      highlight: true,
    });
  }

  // Code
  if (code) {
    lines.push({
      label: t("entityInfo.fields.code"),
      value: code,
    });
  }

  // Type
  if (storeType) {
    lines.push({
      label: t("entityInfo.fields.storeType"),
      value: t(`entityInfo.storeTypes.${storeType}` as never, storeType),
    });
  }

  // Capacité
  if (capacity) {
    lines.push({
      label: t("entityInfo.fields.capacity"),
      value: `${capacity} tonnes`,
    });
  }

  // Statut
  if (status) {
    lines.push({
      label: t("entityInfo.fields.status"),
      value: t(`entityInfo.statuses.${status}` as never, status),
    });
  }

  return {
    lines,
    icon: "Building",
    statusColor: status === "active" ? "success" : "warning",
  };
}

// ========================================
// UTILISATEURS
// ========================================
function getUserInfo(
  payload: Record<string, unknown>,
  t: TranslateFn
): EntityInfo {
  const givenName = payload.givenName as string | undefined;
  const familyName = payload.familyName as string | undefined;
  const username = payload.username as string | undefined;
  const role = payload.role as string | undefined;
  const email = payload.email as string | undefined;
  const phone = payload.phone as string | undefined;
  const status = payload.status as string | undefined;

  const lines = [];

  // Nom complet
  if (givenName && familyName) {
    lines.push({
      label: t("entityInfo.fields.name"),
      value: `${givenName} ${familyName}`,
      highlight: true,
    });
  }

  // Username
  if (username) {
    lines.push({
      label: t("entityInfo.fields.username"),
      value: username,
    });
  }

  // Rôle
  if (role) {
    lines.push({
      label: t("entityInfo.fields.role"),
      value: t(`entityInfo.userRoles.${role}` as never, role),
    });
  }

  // Email
  if (email) {
    lines.push({
      label: t("entityInfo.fields.email"),
      value: email,
    });
  }

  // Téléphone
  if (phone) {
    lines.push({
      label: t("entityInfo.fields.phone"),
      value: phone,
    });
  }

  // Statut
  if (status) {
    lines.push({
      label: t("entityInfo.fields.status"),
      value: t(`entityInfo.statuses.${status}` as never, status),
    });
  }

  return {
    lines,
    icon: "User",
    statusColor: status === "active" ? "success" : "warning",
  };
}
