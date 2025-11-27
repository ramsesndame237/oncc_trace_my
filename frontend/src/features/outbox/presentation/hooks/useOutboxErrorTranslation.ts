/**
 * Hook spécialisé pour traduire les codes d'erreur dans l'outbox
 * Inspiré du projet ProjectManagerGabon
 */

"use client";

import { useTranslation } from "react-i18next";

/**
 * Hook pour traduire les codes d'erreur et de succès spécifiques à l'outbox
 * Détermine automatiquement le namespace basé sur le préfixe du code
 *
 * @returns Fonctions de traduction
 *
 * @example
 * ```tsx
 * const { translateError } = useOutboxErrorTranslation();
 * const message = translateError('USER_CREATE_EMAIL_EXISTS', 'Erreur lors de la création');
 * // FR: "Un utilisateur avec cet email existe déjà"
 * ```
 */
export function useOutboxErrorTranslation() {
  const { t } = useTranslation(["errors", "success"]);

  /**
   * Traduit un code d'erreur en détectant automatiquement le namespace
   *
   * @param errorCode - Code d'erreur (ex: "USER_CREATE_EMAIL_EXISTS")
   * @param fallbackMessage - Message de fallback si la traduction n'existe pas
   * @returns Message d'erreur traduit
   */
  const translateError = (
    errorCode: string,
    fallbackMessage?: string
  ): string => {
    if (!errorCode) {
      return fallbackMessage || t("errors:system.SYSTEM_INTERNAL_ERROR");
    }

    // Déterminer le namespace basé sur le préfixe du code
    let namespace = "errors:system";
    const key = errorCode;

    if (errorCode.startsWith("USER_")) {
      namespace = "errors:user";
    } else if (errorCode.startsWith("AUTH_")) {
      namespace = "errors:auth";
    } else if (errorCode.startsWith("VALIDATION_")) {
      namespace = "errors:validation";
    } else if (errorCode.startsWith("LOCATION_")) {
      namespace = "errors:location";
    } else if (errorCode.startsWith("DOCUMENT_")) {
      namespace = "errors:document";
    } else if (errorCode.startsWith("CAMPAIGN_")) {
      namespace = "errors:campaign";
    } else if (errorCode.startsWith("PRODUCTION_BASIN_")) {
      namespace = "errors:productionBasin";
    } else if (errorCode.startsWith("STORE_")) {
      namespace = "errors:store";
    } else if (errorCode.startsWith("ACTOR_")) {
      namespace = "errors:actor";
    } else if (errorCode.startsWith("PARCEL_")) {
      namespace = "errors:parcel";
    } else if (errorCode.startsWith("AUDIT_LOG_")) {
      namespace = "errors:auditLog";
    } else if (errorCode.startsWith("SYNC_")) {
      namespace = "errors:sync";
    } else if (errorCode.startsWith("OUTBOX_")) {
      namespace = "errors:outbox";
    } else if (errorCode.startsWith("PRODUCT_TRANSFER_")) {
      namespace = "errors:productTransfer";
    } else if (errorCode.startsWith("TRANSACTION_")) {
      namespace = "errors:transaction";
    } else if (errorCode.startsWith("CALENDAR_")) {
      namespace = "errors:calendar";
    } else if (errorCode.startsWith("CONVENTION_")) {
      namespace = "errors:convention";
    }

    // Construire la clé complète
    const fullKey = `${namespace}.${key}`;

    // Tenter la traduction
    const translated = t(fullKey, { defaultValue: "" });

    // Si pas de traduction trouvée, utiliser le fallback ou un message générique
    if (!translated || translated === fullKey) {
      return fallbackMessage || t("errors:system.SYSTEM_INTERNAL_ERROR");
    }

    return translated;
  };

  /**
   * Traduit un code de succès en détectant automatiquement le namespace
   *
   * @param successCode - Code de succès (ex: "USER_CREATED")
   * @param fallbackMessage - Message de fallback si la traduction n'existe pas
   * @returns Message de succès traduit
   */
  const translateSuccess = (
    successCode: string,
    fallbackMessage?: string
  ): string => {
    if (!successCode) {
      return fallbackMessage || t("success:common.OPERATION_SUCCESS");
    }

    // Déterminer le namespace basé sur le préfixe du code
    let namespace = "success:common";
    const key = successCode;

    if (successCode.startsWith("USER_")) {
      namespace = "success:user";
    } else if (successCode.startsWith("AUTH_")) {
      namespace = "success:auth";
    } else if (successCode.startsWith("DOCUMENT_")) {
      namespace = "success:document";
    } else if (successCode.startsWith("CAMPAIGN_")) {
      namespace = "success:campaign";
    } else if (successCode.startsWith("PRODUCTION_BASIN_")) {
      namespace = "success:productionBasin";
    } else if (
      successCode.startsWith("STORE_") ||
      successCode.startsWith("STORES_")
    ) {
      namespace = "success:store";
    } else if (successCode.startsWith("ACTOR_")) {
      namespace = "success:actor";
    } else if (successCode.startsWith("PARCEL_")) {
      namespace = "success:parcel";
    } else if (successCode.startsWith("LOCATION_")) {
      namespace = "success:location";
    } else if (successCode.startsWith("AUDIT_LOG_")) {
      namespace = "success:auditLog";
    } else if (successCode.startsWith("SYNC_")) {
      namespace = "success:sync";
    } else if (successCode.startsWith("OUTBOX_")) {
      namespace = "success:outbox";
    } else if (successCode.startsWith("PRODUCT_TRANSFER_")) {
      namespace = "success:productTransfer";
    } else if (successCode.startsWith("TRANSACTION_")) {
      namespace = "success:transaction";
    } else if (successCode.startsWith("CALENDAR_")) {
      namespace = "success:calendar";
    }

    // Construire la clé complète
    const fullKey = `${namespace}.${key}`;

    // Tenter la traduction
    const translated = t(fullKey, { defaultValue: "" });

    // Si pas de traduction trouvée, utiliser le fallback ou un message générique
    if (!translated || translated === fullKey) {
      return fallbackMessage || t("success:common.OPERATION_SUCCESS");
    }

    return translated;
  };

  return { translateError, translateSuccess };
}
