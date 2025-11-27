/**
 * Types TypeScript pour i18next
 * Fournit l'autocomplétion et la vérification de type pour les traductions
 */

import { TFunction } from "i18next";
import type common from "./locales/fr/common.json";
import type errors from "./locales/fr/errors.json";
import type success from "./locales/fr/success.json";
import type ui from "./locales/fr/ui.json";
import type validation from "./locales/fr/validation.json";

// Features - À décommenter au fur et à mesure
import type actor from "./locales/fr/features/actor.json";
import type auditLog from "./locales/fr/features/auditLog.json";
import type auth from "./locales/fr/features/auth.json";
import type calendar from "./locales/fr/features/calendar.json";
import type campaign from "./locales/fr/features/campaign.json";
import type convention from "./locales/fr/features/convention.json";
import type dashboard from "./locales/fr/features/dashboard.json";
import type document from "./locales/fr/features/document.json";
import type location from "./locales/fr/features/location.json";
import type outbox from "./locales/fr/features/outbox.json";
import type parcel from "./locales/fr/features/parcel.json";
import type pin from "./locales/fr/features/pin.json";
import type productionBasin from "./locales/fr/features/productionBasin.json";
import type productTransfer from "./locales/fr/features/productTransfer.json";
import type store from "./locales/fr/features/store.json";
import type user from "./locales/fr/features/user.json";

/**
 * Type personnalisé pour les fonctions de traduction
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TranslateFn = TFunction<any, undefined>;

/**
 * Interface Resources typée
 * Permet l'autocomplétion des clés de traduction
 */
interface Resources {
  common: typeof common;
  errors: typeof errors;
  success: typeof success;
  ui: typeof ui;
  validation: typeof validation;
  // Features - À décommenter au fur et à mesure
  auth: typeof auth;
  user: typeof user;
  auditLog: typeof auditLog;
  auditLog: typeof auditLog;
  dashboard: typeof dashboard;
  document: typeof document;
  location: typeof location;
  outbox: typeof outbox;
  campaign: typeof campaign;
  productionBasin: typeof productionBasin;
  store: typeof store;
  actor: typeof actor;
  parcel: typeof parcel;
  pin: typeof pin;
  convention: typeof convention;
  productTransfer: typeof productTransfer;
  calendar: typeof calendar;
  transaction: typeof transaction;
}

/**
 * Déclaration de module pour i18next
 * Active l'autocomplétion et la vérification des types
 */
declare module "i18next" {
  interface CustomTypeOptions {
    /**
     * Namespace par défaut
     */
    defaultNS: "common";
    /**
     * Ressources de traduction typées
     */
    resources: Resources;
  }
}
