import type {
  DepartmentConflict,
  LocationConflict,
  RegionConflict,
} from "@/features/outbox/domain/outbox.types";
import Dexie, { type EntityTable } from "dexie";

export interface OfflinePinData {
  id: string;
  userId: string;
  encryptedPin: string;
  salt: string;
  createdAt: Date;
  lastUsed: Date;
  failedAttempts: number;
  isLocked: boolean;
  lockUntil?: Date;
}

/**
 * Opération en attente dans la file de synchronisation globale.
 */
export interface PendingOperation {
  id?: number;
  entityId: string; // L'ID local (UUID) ou serveur de l'entité concernée
  entityType: string; // 'productionBasin', 'actor', 'parcel', etc.
  operation:
    | "create"
    | "update"
    | "delete"
    | "create_bulk"
    | "update_producer_opa"
    | "update_buyer_exporter";
  payload: Record<string, unknown>; // Les données de l'opération
  timestamp: number;
  retries: number;
  userId: string; // ID de l'utilisateur qui a créé l'opération (OBLIGATOIRE - pas de données anonymes)
  lastError?: {
    code: string; // Code d'erreur (ex: CAMPAIGNS_OVERLAP, PRODUCTION_BASIN_LOCATION_CONFLICTS, REGION_DEPARTMENT_HIERARCHY_CONFLICT)
    message: string; // Message d'erreur détaillé
    timestamp: number; // Timestamp de l'erreur
    conflicts?: LocationConflict[]; // Détails des conflits de localisation pour PRODUCTION_BASIN_LOCATION_CONFLICTS
    regionConflicts?: RegionConflict[]; // Détails des conflits hiérarchiques de région pour REGION_DEPARTMENT_HIERARCHY_CONFLICT
    departmentConflicts?: DepartmentConflict[]; // Détails des conflits hiérarchiques de département pour DEPARTMENT_DISTRICT_HIERARCHY_CONFLICT
    districtParentConflicts?: DepartmentConflict[]; // Détails des conflits district → département parent pour DISTRICT_PARENT_CONFLICT
    departmentParentConflicts?: RegionConflict[]; // Détails des conflits département → région parente pour DEPARTMENT_PARENT_CONFLICT
  };
}

/**
 * Données des localisations stockées localement
 */
export interface OfflineLocationData {
  id?: number; // ID local auto-incrémenté par Dexie
  code: string; // Identifiant unique de la localisation (clé primaire côté serveur)
  name: string;
  type: "region" | "department" | "district" | "village";
  status: "active" | "inactive";
  parentCode: string | null;
  isInProductionBasin?: boolean; // Inclut la propagation hiérarchique
  // Support multi-bassins avec propagation (UNION des bassins enfants)
  productionBasinIds?: string[]; // IDs des bassins de production (tableau pour support multi-bassins)
  productionBasins?: Array<{ id: string; name: string }>; // Détails complets des bassins
  createdAt: string;
  updatedAt: string;
  syncedAt: number; // Timestamp de la dernière synchronisation
}

/**
 * Données des paramètres de l'application stockées localement
 */
export interface OfflineSettingsData {
  id?: number;
  key: string;
  value: string;
  updatedAt: string;
}

/**
 * Interface pour la campagne active
 */
export interface ActiveCampaignData {
  id: string;
  code: string;
}

/**
 * Données des conventions stockées localement
 * ⚠️ Les conventions sont maintenant dans une table séparée (db.conventions)
 * Les repositories lisent et écrivent directement dans cette table
 */
export interface OfflineConventionData {
  id?: number; // Clé primaire auto-générée par Dexie
  serverId?: string; // UUID serveur (présent uniquement après sync)
  localId?: string; // UUID local (présent avant sync, conservé après pour traçabilité)
  code: string; // CONV-LOCAL-xxxx si local, CONV-YYYY-0001 si synced

  // IDs de l'OPA (Producteur)
  producerServerId?: string; // UUID serveur de l'OPA
  producerLocalId?: string; // UUID local de l'OPA

  // IDs du Buyer/Exporter
  buyerExporterServerId?: string; // UUID serveur du Buyer/Exporter
  buyerExporterLocalId?: string; // UUID local du Buyer/Exporter

  signatureDate: string; // ISO date
  status: "active" | "inactive";
  products: Array<{
    quality: "grade_1" | "grade_2" | "hs";
    standard: "certifie" | "excellent" | "fin" | "conventionnel";
    weight: number;
    bags: number;
    pricePerKg: number;
    humidity: number;
  }>;
  syncedAt: number; // Timestamp de la dernière synchronisation
}

/**
 * Données des calendriers stockées localement
 */
export interface OfflineCalendarData {
  id?: number; // Clé primaire auto-générée par Dexie
  serverId?: string; // UUID serveur (présent uniquement après sync)
  localId?: string; // UUID local (présent avant sync, conservé après pour traçabilité)
  code: string; // CAL-LOCAL-xxxx si local, CAL-YYYY-0001 si synced
  type: "MARCHE" | "ENLEVEMENT";
  status: "active" | "inactive";
  location: string | null;
  locationCode: string | null;
  startDate: string; // ISO date
  endDate: string; // ISO date
  eventTime: string | null; // HH:mm format
  conventionServerId?: string; // UUID serveur de la convention
  conventionLocalId?: string; // UUID local de la convention
  producerServerId?: string; // UUID serveur de l'OPA
  producerLocalId?: string; // UUID local de l'OPA
  syncedAt: number; // Timestamp de la dernière synchronisation
}

/**
 * Données des transactions stockées localement pour synchronisation
 */
export interface OfflineTransactionData {
  id?: string; // UUID serveur (présent = synced)
  localId?: string; // UUID local (présent = offline)
  code?: string;
  transactionType: "SALE" | "PURCHASE";
  locationType: "MARKET" | "CONVENTION" | "OUTSIDE_MARKET";
  status: "pending" | "confirmed" | "cancelled";
  transactionDate: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;

  // IDs (peuvent être localIds ou serverIds)
  sellerId: string;
  buyerId: string;
  principalExporterId?: string | null;
  createdByActorId: string | null;
  campaignId?: string | null;
  calendarId?: string | null;
  conventionId?: string | null;

  // Products
  products: Array<{
    id: string;
    quality: string;
    standard: string;
    weight: number;
    bagCount: number;
    pricePerKg: number;
    totalPrice: number;
    humidity: number | null;
    producerId: string | null;
    notes: string | null;
  }>;

  // Attributs calculés
  isPendingComplementary?: boolean;
  isMyTransaction?: boolean;
  isEditable?: boolean;

  syncStatus?: "pending" | "synced" | "failed";
}

/**
 * Relation Producer ↔ OPA (table producer_opa)
 * Stocke les relations entre producteurs et OPA avec gestion offline/online
 */
export interface ProducerOpaRelation {
  id?: number; // Clé primaire auto-générée par Dexie
  // IDs de la relation (on stocke serverId OU localId pour chaque partie)
  producerServerId?: string; // UUID serveur du producteur (si synced)
  producerLocalId?: string; // UUID local du producteur (si offline)
  opaServerId?: string; // UUID serveur de l'OPA (si synced)
  opaLocalId?: string; // UUID local de l'OPA (si offline)
  // Métadonnées de synchronisation
  createdAt: string; // Date de création (format ISO)
  syncedAt: number; // Timestamp de la dernière synchronisation
}

/**
 * Relation Exporter ↔ Buyer (table exporter_mandates)
 * Stocke les mandats entre exportateurs et acheteurs avec gestion offline/online
 */
export interface ExporterMandateRelation {
  id?: number; // Clé primaire auto-générée par Dexie
  // IDs de la relation (on stocke serverId OU localId pour chaque partie)
  exporterServerId?: string; // UUID serveur de l'exportateur (si synced)
  exporterLocalId?: string; // UUID local de l'exportateur (si offline)
  buyerServerId?: string; // UUID serveur de l'acheteur (si synced)
  buyerLocalId?: string; // UUID local de l'acheteur (si offline)
  // Métadonnées de synchronisation
  createdAt: string; // Date de création (format ISO)
  syncedAt: number; // Timestamp de la dernière synchronisation
}

/**
 * Données des acteurs stockées localement
 */
export interface OfflineActorData {
  id?: number; // Clé primaire auto-générée par Dexie
  serverId?: string; // UUID serveur (présent uniquement après sync)
  localId?: string; // UUID local (présent avant sync, conservé après pour traçabilité)
  actorType: "PRODUCER" | "TRANSFORMER" | "PRODUCERS" | "BUYER" | "EXPORTER";
  familyName: string;
  givenName: string;
  status?: "active" | "inactive";
  onccId?: string;
  stores?: Array<{
    id: string;
    name: string;
    code: string | null;
    status?: "active" | "inactive";
  }>;
  // ⚠️ Les relations many-to-many sont maintenant dans des tables séparées:
  // - producerOpaRelations (Producer ↔ OPA)
  // - exporterMandates (Exporter ↔ Buyer)
  syncedAt: number; // Timestamp de la dernière synchronisation
}

// Configuration de la base de données Dexie
export class SifcDatabase extends Dexie {
  // Tables principales
  pins!: EntityTable<OfflinePinData, "id">;
  pendingOperations!: EntityTable<PendingOperation, "id">;
  locations!: EntityTable<OfflineLocationData, "id">;
  settings!: EntityTable<OfflineSettingsData, "id">;
  actors!: EntityTable<OfflineActorData, "id">;

  // Table transactions
  transactions!: EntityTable<OfflineTransactionData, "id">;

  // Tables cache/index pour formulaires (autocomplete/select)
  conventions!: EntityTable<OfflineConventionData, "id">;
  calendars!: EntityTable<OfflineCalendarData, "id">;

  // Tables de relations many-to-many (normalisées)
  producerOpaRelations!: EntityTable<ProducerOpaRelation, "id">;
  exporterMandates!: EntityTable<ExporterMandateRelation, "id">;

  constructor() {
    super("SifcDatabase");

    // Version 1: Configuration initiale
    this.version(1).stores({
      // Table des PINs offline
      pins: "id, userId, createdAt, lastUsed, isLocked",

      // Table des opérations en attente de synchronisation
      pendingOperations:
        "++id, entityId, entityType, timestamp, userId, [entityType+operation], [userId+entityType]",

      // Table des localisations
      locations:
        "++id, code, name, type, status, parentCode, syncedAt, [type+name], isInProductionBasin, productionBasinId, productionBasinName",

      // Table des paramètres de l'application
      settings: "++id, key, updatedAt",

      // Table des acteurs
      actors:
        "id, actorType, familyName, givenName, locationCode, status, syncedAt, [actorType+status], onccId",
    });

    // Version 2: Ajout du système de mapping d'IDs pour synchronisation offline/online
    this.version(2).stores({
      // Conserver toutes les tables existantes
      pins: "id, userId, createdAt, lastUsed, isLocked",
      pendingOperations:
        "++id, entityId, entityType, timestamp, userId, [entityType+operation], [userId+entityType]",
      locations:
        "++id, code, name, type, status, parentCode, syncedAt, [type+name], isInProductionBasin, productionBasinId, productionBasinName",
      settings: "++id, key, updatedAt",

      // Table actors mise à jour avec support de localId et serverId
      actors:
        "++id, serverId, localId, actorType, familyName, givenName, locationCode, status, syncedAt, [actorType+status], onccId",

      // Table transactions
      transactions:
        "id, localId, type, sellerId, buyerId, calendarId, conventionId, transactionDate",
    });

    // Version 3: Ajout de la table conventions (cache/index pour formulaires)
    this.version(3).stores({
      // Conserver toutes les tables existantes
      pins: "id, userId, createdAt, lastUsed, isLocked",
      pendingOperations:
        "++id, entityId, entityType, timestamp, userId, [entityType+operation], [userId+entityType]",
      locations:
        "++id, code, name, type, status, parentCode, syncedAt, [type+name], isInProductionBasin, productionBasinId, productionBasinName",
      settings: "++id, key, updatedAt",
      actors:
        "++id, serverId, localId, actorType, familyName, givenName, locationCode, status, syncedAt, [actorType+status], onccId",
      transactions:
        "id, localId, type, sellerId, buyerId, calendarId, conventionId, transactionDate",

      // NOUVELLE TABLE conventions (cache/index pour formulaires uniquement)
      conventions:
        "++id, serverId, localId, code, producersId, buyerExporterId, status, syncedAt, [producersId+status], [buyerExporterId+status], signatureDate",
    });

    // Version 4: Ajout de la table calendars
    this.version(4).stores({
      // Conserver toutes les tables existantes
      pins: "id, userId, createdAt, lastUsed, isLocked",
      pendingOperations:
        "++id, entityId, entityType, timestamp, userId, [entityType+operation], [userId+entityType]",
      locations:
        "++id, code, name, type, status, parentCode, syncedAt, [type+name], isInProductionBasin, productionBasinId, productionBasinName",
      settings: "++id, key, updatedAt",
      actors:
        "++id, serverId, localId, actorType, familyName, givenName, locationCode, status, syncedAt, [actorType+status], onccId",
      transactions:
        "++id, serverId, localId, type, sellerId, buyerId, calendarId, conventionId, transactionDate",
      conventions:
        "++id, serverId, localId, code, producersId, buyerExporterId, status, syncedAt, [producersId+status], [buyerExporterId+status], signatureDate",

      // NOUVELLE TABLE calendars
      calendars:
        "++id, serverId, localId, code, type, status, producersId, campaignId, conventionId, locationCode, startDate, endDate, syncedAt, [producersId+status], [campaignId+status], [type+status]",
    });

    // Version 5: Ajout des tables de relations many-to-many normalisées
    this.version(5).stores({
      // Conserver toutes les tables existantes
      pins: "id, userId, createdAt, lastUsed, isLocked",
      pendingOperations:
        "++id, entityId, entityType, timestamp, userId, [entityType+operation], [userId+entityType]",
      locations:
        "++id, code, name, type, status, parentCode, syncedAt, [type+name], isInProductionBasin, productionBasinId, productionBasinName",
      settings: "++id, key, updatedAt",
      actors:
        "++id, serverId, localId, actorType, familyName, givenName, locationCode, status, syncedAt, [actorType+status], onccId",
      transactions:
        "++id, serverId, localId, type, sellerId, buyerId, calendarId, conventionId, transactionDate",
      conventions:
        "++id, serverId, localId, code, producersId, buyerExporterId, status, syncedAt, [producersId+status], [buyerExporterId+status], signatureDate",
      calendars:
        "++id, serverId, localId, code, type, status, producersId, conventionId, locationCode, startDate, endDate, syncedAt, [producersId+status], [campaignId+status], [type+status]",

      // NOUVELLES TABLES de relations many-to-many
      // Table Producer ↔ OPA (PRODUCERS)
      producerOpaRelations:
        "++id, producerServerId, producerLocalId, opaServerId, opaLocalId, status, syncedAt, [producerServerId+opaServerId], [producerLocalId+opaLocalId], [status+syncedAt]",
      // Table Exporter ↔ Buyer (mandats)
      exporterMandates:
        "++id, exporterServerId, exporterLocalId, buyerServerId, buyerLocalId, status, syncedAt, [exporterServerId+buyerServerId+campaignId], [exporterLocalId+buyerLocalId], [status+syncedAt]",
    });

    // Version 6: Ajout des index pour producerServerId/LocalId et buyerExporterServerId/LocalId dans conventions
    this.version(6).stores({
      // Conserver toutes les tables existantes
      pins: "id, userId, createdAt, lastUsed, isLocked",
      pendingOperations:
        "++id, entityId, entityType, timestamp, userId, [entityType+operation], [userId+entityType]",
      locations:
        "++id, code, name, type, status, parentCode, syncedAt, [type+name], isInProductionBasin, productionBasinId, productionBasinName",
      settings: "++id, key, updatedAt",
      actors:
        "++id, serverId, localId, actorType, familyName, givenName, locationCode, status, syncedAt, [actorType+status], onccId",
      transactions:
        "++id, serverId, localId, type, sellerId, buyerId, calendarId, conventionId, transactionDate",

      // TABLE conventions MISE À JOUR avec nouveaux index
      conventions:
        "++id, serverId, localId, code, producerServerId, producerLocalId, buyerExporterServerId, buyerExporterLocalId, status, syncedAt, [producerServerId+status], [producerLocalId+status], [buyerExporterServerId+status], [buyerExporterLocalId+status], [buyerExporterLocalId+producerLocalId], [buyerExporterServerId+producerServerId], signatureDate",

      calendars:
        "++id, serverId, localId, code, type, status, producerServerId, producerLocalId, conventionServerId, conventionLocalId, locationCode, startDate, endDate, syncedAt, [producerServerId+status], [producerLocalId+status], [conventionServerId+status], [conventionLocalId+status], [type+status]",

      // Tables de relations many-to-many
      producerOpaRelations:
        "++id, producerServerId, producerLocalId, opaServerId, opaLocalId, status, syncedAt, [producerServerId+opaServerId], [producerLocalId+opaLocalId], [status+syncedAt]",
      exporterMandates:
        "++id, exporterServerId, exporterLocalId, buyerServerId, buyerLocalId, status, syncedAt, [exporterServerId+buyerServerId], [exporterLocalId+buyerLocalId], [status+syncedAt]",
    });
  }
}

// Instance singleton de la base de données
export const db = new SifcDatabase();
