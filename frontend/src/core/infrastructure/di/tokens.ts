/**
 * Tokens d'injection de dépendances
 * Fichier séparé pour éviter les dépendances circulaires
 */

/**
 * Tokens d'injection pour éviter les magic strings
 */
export const DI_TOKENS = {
  // Auth - Utilisation de Symbol pour éviter les collisions
  IAuthRepository: Symbol.for("IAuthRepository"),

  // Production Basins - Feature bassins de production
  IProductionBasinRepository: Symbol.for("IProductionBasinRepository"),

  // Locations - Feature localisations
  ILocationRepository: Symbol.for("ILocationRepository"),

  // Campaigns - Feature campagnes
  ICampaignRepository: Symbol.for("ICampaignRepository"),

  // Users - Feature utilisateurs
  IUserRepository: Symbol.for("IUserRepository"),

  // Stores - Feature magasins
  IStoreRepository: Symbol.for("IStoreRepository"),

  // AuditLog - Feature logs d'audit
  IAuditLogRepository: Symbol.for("IAuditLogRepository"),

  // Actors - Feature acteurs
  IActorRepository: Symbol.for("IActorRepository"),

  // Documents - Feature documents
  IDocumentRepository: Symbol.for("IDocumentRepository"),

  // Parcels - Feature parcelles
  IParcelRepository: Symbol.for("IParcelRepository"),

  // Conventions - Feature conventions
  IConventionRepository: Symbol.for("IConventionRepository"),

  // Product Transfers - Feature transferts de produits
  IProductTransferRepository: Symbol.for("IProductTransferRepository"),

  // Calendars - Feature calendriers
  ICalendarRepository: Symbol.for("ICalendarRepository"),

  // Transactions - Feature transactions
  ITransactionRepository: Symbol.for("ITransactionRepository"),

  SyncService: Symbol.for("SyncService"),
  PollingService: Symbol.for("PollingService"),
} as const;
