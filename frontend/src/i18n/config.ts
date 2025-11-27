/**
 * Configuration i18next pour ONCC-V1
 * Système de traduction multi-langues avec support offline
 */

/**
 * Langues supportées dans l'application
 */
export const locales = ["fr", "en"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "fr";

export const localeNames: Record<Locale, string> = {
  fr: "Français",
  en: "English",
};

/**
 * Namespaces de traduction
 * Organisés par catégorie et feature
 */
export const namespaces = [
  // Namespaces génériques
  "common", // Actions, navigation, statuts génériques
  "errors", // Codes d'erreur génériques
  "success", // Messages de succès
  "ui", // Composants UI génériques
  "validation", // Messages de validation

  // Features
  "auth", // Authentification
  "user", // Utilisateurs
  "auditLog", // Journaux d'audit
  "dashboard", // Tableau de bord
  "document", // Documents
  "location", // Localisation (régions, départements, etc.)
  "outbox", // Synchronisation offline
  "campaign", // Campagnes
  "productionBasin", // Bassins de production
  "store", // Magasins/Points de vente
  "actor", // Acteurs (producteurs)
  "parcel", // Parcelles
  "productTransfer", // Transferts de produit
  "calendar", // Calendriers
  "transaction", // Transactions
] as const;

export type Namespace = (typeof namespaces)[number];

/**
 * Configuration i18next
 */
export const i18nConfig = {
  fallbackLng: defaultLocale,
  supportedLngs: [...locales],
  defaultNS: "common",
  ns: [...namespaces],

  // ✅ IMPORTANT pour PWA : Tout est en mémoire
  load: "languageOnly" as const,
  preload: [...locales],

  // Pas de backend HTTP (toutes les traductions sont bundlées)
  backend: undefined,

  interpolation: {
    escapeValue: false, // React protège déjà contre XSS
  },

  // Configuration du détecteur de langue
  detection: {
    // Ordre de détection : localStorage > navigateur
    order: ["localStorage", "navigator"],
    caches: ["localStorage"],
    lookupLocalStorage: "i18nextLng",
  },

  // Mode développement
  debug: process.env.NODE_ENV === "development",

  // Options React
  react: {
    useSuspense: false, // Important pour éviter les bugs avec SSR
  },

  // Initialisation immédiate pour éviter le flash de texte non traduit
  initImmediate: true,
};
