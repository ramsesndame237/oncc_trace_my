/**
 * Instance i18next bundlée pour ONCC-V1
 * Toutes les traductions sont importées statiquement (offline-first)
 */

"use client";

import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import { i18nConfig } from "./config";

// ===================================================================
// IMPORTS STATIQUES DES TRADUCTIONS (BUNDLÉES DANS LE BUILD)
// ===================================================================

// Traductions françaises - Génériques
import commonFr from "./locales/fr/common.json";
import errorsFr from "./locales/fr/errors.json";
import successFr from "./locales/fr/success.json";
import uiFr from "./locales/fr/ui.json";
import validationFr from "./locales/fr/validation.json";

// Traductions françaises - Features (à remplir plus tard)
import actorFr from "./locales/fr/features/actor.json";
import auditLogFr from "./locales/fr/features/auditLog.json";
import authFr from "./locales/fr/features/auth.json";
import calendarFr from "./locales/fr/features/calendar.json";
import campaignFr from "./locales/fr/features/campaign.json";
import conventionFr from "./locales/fr/features/convention.json";
import dashboardFr from "./locales/fr/features/dashboard.json";
import documentFr from "./locales/fr/features/document.json";
import locationFr from "./locales/fr/features/location.json";
import outboxFr from "./locales/fr/features/outbox.json";
import parcelFr from "./locales/fr/features/parcel.json";
import pinFr from "./locales/fr/features/pin.json";
import productionBasinFr from "./locales/fr/features/productionBasin.json";
import productTransferFr from "./locales/fr/features/productTransfer.json";
import storeFr from "./locales/fr/features/store.json";
import transactionFr from "./locales/fr/features/transaction.json";
import userFr from "./locales/fr/features/user.json";

// Traductions anglaises - Génériques
import commonEn from "./locales/en/common.json";
import errorsEn from "./locales/en/errors.json";
import successEn from "./locales/en/success.json";
import uiEn from "./locales/en/ui.json";
import validationEn from "./locales/en/validation.json";

// Traductions anglaises - Features (à remplir plus tard)
import actorEn from "./locales/en/features/actor.json";
import auditLogEn from "./locales/en/features/auditLog.json";
import authEn from "./locales/en/features/auth.json";
import calendarEn from "./locales/en/features/calendar.json";
import campaignEn from "./locales/en/features/campaign.json";
import conventionEn from "./locales/en/features/convention.json";
import dashboardEn from "./locales/en/features/dashboard.json";
import documentEn from "./locales/en/features/document.json";
import locationEn from "./locales/en/features/location.json";
import outboxEn from "./locales/en/features/outbox.json";
import parcelEn from "./locales/en/features/parcel.json";
import pinEn from "./locales/en/features/pin.json";
import productionBasinEn from "./locales/en/features/productionBasin.json";
import productTransferEn from "./locales/en/features/productTransfer.json";
import storeEn from "./locales/en/features/store.json";
import transactionEn from "./locales/en/features/transaction.json";
import userEn from "./locales/en/features/user.json";

// ===================================================================
// RESSOURCES COMPILÉES
// ===================================================================

const resources = {
  fr: {
    common: commonFr,
    errors: errorsFr,
    success: successFr,
    ui: uiFr,
    validation: validationFr,
    // Features - À décommenter au fur et à mesure
    auth: authFr,
    user: userFr,
    auditLog: auditLogFr,
    dashboard: dashboardFr,
    document: documentFr,
    location: locationFr,
    outbox: outboxFr,
    campaign: campaignFr,
    productionBasin: productionBasinFr,
    store: storeFr,
    actor: actorFr,
    parcel: parcelFr,
    pin: pinFr,
    convention: conventionFr,
    productTransfer: productTransferFr,
    calendar: calendarFr,
    transaction: transactionFr,
  },
  en: {
    common: commonEn,
    errors: errorsEn,
    success: successEn,
    ui: uiEn,
    validation: validationEn,
    // Features - À décommenter au fur et à mesure
    auth: authEn,
    user: userEn,
    auditLog: auditLogEn,
    dashboard: dashboardEn,
    document: documentEn,
    location: locationEn,
    outbox: outboxEn,
    campaign: campaignEn,
    productionBasin: productionBasinEn,
    store: storeEn,
    actor: actorEn,
    parcel: parcelEn,
    pin: pinEn,
    convention: conventionEn,
    productTransfer: productTransferEn,
    calendar: calendarEn,
    transaction: transactionEn,
  },
} as const;

// ===================================================================
// INITIALISATION I18NEXT
// ===================================================================

i18n
  // Détecteur de langue automatique (localStorage → navigator.language)
  .use(LanguageDetector)
  // Intégration React
  .use(initReactI18next)
  // Initialisation avec configuration et ressources bundlées
  .init({
    ...i18nConfig,
    resources, // ✅ Toutes les traductions sont bundlées
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "i18nextLng",
    },
  });

// ===================================================================
// EXPORTS
// ===================================================================

export default i18n;
export { resources };
