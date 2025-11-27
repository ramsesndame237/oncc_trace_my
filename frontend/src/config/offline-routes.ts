/**
 * 🎯 ROUTES CRITIQUES À PRÉCACHER POUR LE MODE OFFLINE
 *
 * Ce fichier centralise toutes les routes qui doivent être disponibles offline.
 * Il est utilisé par :
 * - next.config.ts : Pour le précache au build
 * - src/app/sw.ts : Pour le précache dans le Service Worker
 *
 * ⚠️ IMPORTANT : Ne modifier ce fichier QUE pour ajouter/retirer des routes.
 * Les deux fichiers ci-dessus importent automatiquement ces routes.
 */

export const OFFLINE_ROUTES = [
  // ========================================
  // 🔐 AUTHENTIFICATION & NAVIGATION
  // ========================================
  "/",
  "/offline",
  "/auth/login",
  "/auth/verify-otp",
  "/auth/create-pin",
  "/auth/sync",
  "/auth/ask-recovery",
  "/auth/recovery/security-check",
  "/auth/recovery/new-password",
  "/auth/onboarding",
  "/auth/onboarding/confirm-details",
  "/auth/onboarding/create-password",
  "/auth/onboarding/security-questions",
  "/auth/onboarding/success",
  "/dashboard",
  "/quick-menu",
  "/outbox",
  "/search",
  "/preferences",

  // ========================================
  // 📋 LISTINGS PRINCIPAUX
  // ========================================
  // Acteurs
  "/actors", // Hub principal acteurs
  "/actors/producers", // Liste OPA
  "/actors/producer", // Liste producteurs individuels
  "/actors/buyers",
  "/actors/exporters",
  "/actors/transformers",
  "/my-producers", // Mes producteurs (OPA)
  "/my-buyers", // Mes acheteurs (Exportateur)

  // Autres entités
  "/users",
  "/campaign",
  "/locations",
  "/production-basin",
  "/stores",
  "/parcels",
  "/conventions",
  "/calendars",
  "/product-transfers",
  "/transactions",

  "/actors/producer/choice",

  // ========================================
  // ➕ FORMULAIRES DE CRÉATION - PRODUCTEURS (INDIVIDUEL)
  // ========================================
  "/actors/producer/create",
  "/actors/producer/create/parcels",
  "/actors/producer/create/documents",
  "/actors/producer/create/summary",

  // ========================================
  // ➕ FORMULAIRES DE CRÉATION - OPA (PRODUCERS)
  // ========================================
  "/actors/producers/create",
  "/actors/producers/create/manager",
  "/actors/producers/create/members",
  "/actors/producers/create/documents",
  "/actors/producers/create/summary",

  // ========================================
  // ➕ FORMULAIRES DE CRÉATION - AUTRES ACTEURS
  // ========================================
  // Acheteurs (BUYER)
  "/actors/buyers/create",
  "/actors/buyers/create/documents",
  "/actors/buyers/create/summary",

  // Exportateurs (EXPORTER)
  "/actors/exporters/create",
  "/actors/exporters/create/manager",
  "/actors/exporters/create/buyers",
  "/actors/exporters/create/documents",
  "/actors/exporters/create/summary",

  // Transformateurs (TRANSFORMER)
  "/actors/transformers/create",
  "/actors/transformers/create/manager",
  "/actors/transformers/create/documents",
  "/actors/transformers/create/summary",

  // ========================================
  // ➕ FORMULAIRES DE CRÉATION - CONVENTIONS
  // ========================================
  "/conventions/create",
  "/conventions/create/basic-info",
  "/conventions/create/products",
  "/conventions/create/documents",
  "/conventions/create/summary",

  // ========================================
  // ➕ FORMULAIRES DE CRÉATION - CALENDRIERS
  // ========================================
  // Calendriers - Marchés
  "/calendars/market/create/informations",
  "/calendars/market/create/summary",

  // Calendriers - Enlèvements
  "/calendars/pickup/create/informations",
  "/calendars/pickup/create/summary",

  // ========================================
  // ➕ FORMULAIRES DE CRÉATION - TRANSACTIONS
  // ========================================
  // Transactions - Ventes
  "/transactions/sale/create/general-info",
  "/transactions/sale/create/products",
  "/transactions/sale/create/documents",
  "/transactions/sale/create/summary",

  // Transactions - Achats
  "/transactions/purchase/create/general-info",
  "/transactions/purchase/create/products",
  "/transactions/purchase/create/documents",
  "/transactions/purchase/create/summary",

  // ========================================
  // ➕ FORMULAIRES DE CRÉATION - TRANSFERTS
  // ========================================
  // Transferts de produits - Standard
  "/product-transfers/standard/create/general-info",
  "/product-transfers/standard/create/products",
  "/product-transfers/standard/create/driver",
  "/product-transfers/standard/create/documents",
  "/product-transfers/standard/create/summary",

  // Transferts de produits - Groupage
  "/product-transfers/groupage/create/general-info",
  "/product-transfers/groupage/create/products",
  "/product-transfers/groupage/create/summary",

  // ========================================
  // ✏️ FORMULAIRES D'ÉDITION (routes de base)
  // ========================================
  "/actors/producer/edit",
  "/actors/producers/edit",
  "/actors/buyers/edit",
  "/actors/exporters/edit",
  "/actors/transformers/edit",
  "/users/edit",
  "/campaign/edit",
  "/production-basin/edit",
  "/stores/edit",
  "/conventions/edit",
  "/calendars/market/edit",
  "/calendars/pickup/edit",
  "/transactions/sale/edit",
  "/transactions/purchase/edit",
  "/product-transfers/standard/edit",
  "/product-transfers/groupage/edit",

  // Étapes formulaires édition
  "/actors/producer/edit/parcels",
  "/actors/producer/edit/documents",
  "/actors/producers/edit/documents",
  "/actors/producers/edit/producers",
  "/actors/buyers/edit/documents",
  "/actors/exporters/edit/documents",
  "/actors/exporters/edit/buyers",
  "/actors/transformers/edit/documents",
  "/stores/edit/occupants",
  "/conventions/edit/documents",
  "/conventions/edit-products",
  "/transactions/sale/edit/products",
  "/transactions/sale/edit/documents",
  "/transactions/purchase/edit/products",
  "/transactions/purchase/edit/documents",
  "/product-transfers/edit/documents",

  // ========================================
  // 👁️ PAGES DE DÉTAIL (routes de base)
  // ========================================
  "/actors/producer/view",
  "/actors/producers/view",
  "/actors/buyers/view",
  "/actors/exporters/view",
  "/actors/transformers/view",
  "/users/view",
  "/campaign/view",
  "/production-basin/view",
  "/stores/view",
  "/parcels/view",
  "/conventions/view",
  "/calendars/view",
  "/product-transfers/view",
  "/transactions/view",

  // ========================================
  // ⚡ ACTIONS RAPIDES
  // ========================================
  "/actors/producer/add",
  "/actors/producer/add/parcels",
  "/actors/producer/add/summary",

  // Gestion des producteurs d'un OPA
  "/actors/producers/choice",
  "/actors/producers/manage/select-opa",
  "/actors/producers/manage/producers",
  "/actors/producers/manage/summary",

  // Gestion des acheteurs d'un Exportateur
  "/actors/exporters/choice",
  "/actors/exporters/manage/select-exporter",
  "/actors/exporters/manage/buyers",
  "/actors/exporters/manage/summary",

  "/calendars/pickup/add",
] as const;

/**
 * Type pour les routes offline (utile pour le type-safety)
 */
export type OfflineRoute = (typeof OFFLINE_ROUTES)[number];

/**
 * Nombre total de routes à précacher
 */
export const OFFLINE_ROUTES_COUNT = OFFLINE_ROUTES.length;
