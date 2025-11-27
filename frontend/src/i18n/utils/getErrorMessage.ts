/**
 * Utilitaires pour la traduction des codes d'erreur et de succès
 */

/**
 * Détermine la clé de traduction pour un code d'erreur
 * Basé sur le préfixe du code
 *
 * @param errorCode - Code d'erreur (ex: "AUTH_LOGIN_INVALID_CREDENTIALS")
 * @returns Clé de traduction i18next (ex: "errors:auth.AUTH_LOGIN_INVALID_CREDENTIALS")
 */
export function getErrorTranslationKey(errorCode: string | undefined): string {
  // Si errorCode est undefined, retourner une clé d'erreur par défaut
  if (!errorCode) {
    return 'errors:unknown';
  }

  // Détermine automatiquement le namespace selon le préfixe
  if (errorCode.startsWith('AUTH_')) {
    return `errors:auth.${errorCode}`;
  }

  if (errorCode.startsWith('VALIDATION_')) {
    return `errors:validation.${errorCode}`;
  }

  if (errorCode.startsWith('SYSTEM_')) {
    return `errors:system.${errorCode}`;
  }

  if (errorCode.startsWith('USER_')) {
    return `errors:user.${errorCode}`;
  }

  if (errorCode.startsWith('DOCUMENT_')) {
    return `errors:document.${errorCode}`;
  }

  if (errorCode.startsWith('AUDIT_LOG_')) {
    return `errors:auditLog.${errorCode}`;
  }

  if (errorCode.startsWith('CAMPAIGN_')) {
    return `errors:campaign.${errorCode}`;
  }

  if (errorCode.startsWith('PRODUCTION_BASIN_')) {
    return `errors:productionBasin.${errorCode}`;
  }

  if (errorCode.startsWith('STORE_')) {
    return `errors:store.${errorCode}`;
  }

  if (errorCode.startsWith('ACTOR_') ||
      errorCode.startsWith('PRODUCER_') ||
      errorCode.startsWith('BUYER_')) {
    return `errors:actor.${errorCode}`;
  }

  if (errorCode.startsWith('PARCEL_')) {
    return `errors:parcel.${errorCode}`;
  }

  if (errorCode.startsWith('LOCATION_')) {
    return `errors:location.${errorCode}`;
  }

  if (errorCode.startsWith('SYNC_')) {
    return `errors:sync.${errorCode}`;
  }

  if (errorCode.startsWith('OUTBOX_')) {
    return `errors:outbox.${errorCode}`;
  }

  if (errorCode.startsWith('PRODUCT_TRANSFER_')) {
    return `errors:productTransfer.${errorCode}`;
  }

  if (errorCode.startsWith('CONVENTION_')) {
    return `errors:convention.${errorCode}`;
  }

  // Code d'erreur inconnu
  return 'errors:unknown';
}

/**
 * Détermine la clé de traduction pour un code de succès
 * Basé sur le préfixe du code
 *
 * @param successCode - Code de succès (ex: "USER_CREATED")
 * @returns Clé de traduction i18next (ex: "success:user.USER_CREATED")
 */
export function getSuccessTranslationKey(successCode: string): string {
  // Détermine automatiquement le namespace selon le préfixe
  if (successCode.startsWith('AUTH_')) {
    return `success:auth.${successCode}`;
  }

  if (successCode.startsWith('USER_')) {
    return `success:user.${successCode}`;
  }

  if (successCode.startsWith('DOCUMENT_')) {
    return `success:document.${successCode}`;
  }

  if (successCode.startsWith('AUDIT_LOG_')) {
    return `success:auditLog.${successCode}`;
  }

  if (successCode.startsWith('CAMPAIGN_')) {
    return `success:campaign.${successCode}`;
  }

  if (successCode.startsWith('PRODUCTION_BASIN_')) {
    return `success:productionBasin.${successCode}`;
  }

  if (successCode.startsWith('STORE_') || successCode.startsWith('STORES_')) {
    return `success:store.${successCode}`;
  }

  if (successCode.startsWith('ACTOR_')) {
    return `success:actor.${successCode}`;
  }

  if (successCode.startsWith('PARCEL_')) {
    return `success:parcel.${successCode}`;
  }

  if (successCode.startsWith('LOCATION_')) {
    return `success:location.${successCode}`;
  }

  if (successCode.startsWith('SYNC_')) {
    return `success:sync.${successCode}`;
  }

  if (successCode.startsWith('OUTBOX_')) {
    return `success:outbox.${successCode}`;
  }

  if (successCode.startsWith('PRODUCT_TRANSFER_')) {
    return `success:productTransfer.${successCode}`;
  }

  if (successCode.startsWith('CONVENTION_')) {
    return `success:convention.${successCode}`;
  }

  // Code de succès inconnu - fallback vers un message générique
  return `success:${successCode}`;
}
