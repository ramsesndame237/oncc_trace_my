/**
 * Configuration centralisée de l'application
 * Toutes les variables d'environnement sont accessibles ici
 */

import { APP_VERSION } from "./constants";

export const appConfig = {
  // Informations de l'application
  name: process.env.NEXT_PUBLIC_APP_NAME || "App Manager",
  version: APP_VERSION,
  description: process.env.NEXT_PUBLIC_APP_DESCRIPTION || "Application Manager",

  // Configuration API
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333/api/v1",
    version: process.env.NEXT_PUBLIC_API_VERSION || "v1",
  },

  // Configuration Base de données locale (IndexedDB)
  database: {
    name: process.env.NEXT_PUBLIC_INDEXEDDB_NAME || "app_manager_db",
  },
} as const;

export type AppConfig = typeof appConfig;
