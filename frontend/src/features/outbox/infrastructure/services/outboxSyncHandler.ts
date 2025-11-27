import { ISyncHandlerWithCallbacks } from "@/core/domain/sync.types";
import { showError, showSuccess } from "@/lib/notifications/toast";
import { getErrorTranslationKey } from "@/i18n/utils/getErrorMessage";
import i18next from "i18next";
import { useOutboxStore } from "../store/outboxStore";

/**
 * Handler spécialisé pour l'outbox qui se met à jour automatiquement
 * lors des événements de synchronisation
 */
export class OutboxSyncHandler implements ISyncHandlerWithCallbacks {
  public readonly entityType = "outbox";

  private getOperationName(operation: string): string {
    const key = `outbox:operations.${operation}`;
    const translated = i18next.t(key, { defaultValue: "" });

    if (translated && translated !== key) {
      return translated;
    }

    // Fallback
    return i18next.t("outbox:operations.operation", "opération");
  }

  private getEntityName(entityType: string): string {
    const key = `outbox:entityTypes.${entityType}`;
    const translated = i18next.t(key, { defaultValue: "" });

    if (translated && translated !== key) {
      return translated;
    }

    // Fallback
    return i18next.t("outbox:entityTypes.entity", "Entité");
  }

  /**
   * Cette méthode n'est jamais appelée car l'outbox ne traite pas d'opérations
   * Elle existe uniquement pour satisfaire l'interface ISyncHandler
   */
  async handle(): Promise<void> {
    // L'outbox n'a pas d'opérations à traiter
    return Promise.resolve();
  }

  /**
   * Callback appelé lors du succès d'une opération de synchronisation
   * Met à jour l'outbox immédiatement après chaque opération
   */
  onSuccess(entityType: string, operation: string, entityId: string): void {
    console.log(
      `🎯 Outbox: Sync réussie - ${entityType} ${operation} ${entityId}`
    );

    const entityName = this.getEntityName(entityType);
    const operationName = this.getOperationName(operation);

    const message = i18next.t("outbox:sync.successTitle", {
      entityName,
      operationName,
      defaultValue: `${entityName} : opération ${operationName} réussie`,
    });

    showSuccess(message);

    // Rafraîchir l'outbox store immédiatement après chaque opération
    const store = useOutboxStore.getState();

    // Rafraîchissement immédiat pour voir les changements en temps réel
    store.refreshOperations().catch(console.error);
  }

  /**
   * Callback appelé lors d'une erreur de synchronisation
   * Met à jour l'outbox immédiatement après chaque erreur
   */
  async onError(
    entityType: string,
    operation: string,
    error: string,
    entityId: string
  ): Promise<void> {
    console.log(
      `❌ Outbox: Sync échouée - ${entityType} ${operation} ${entityId}: ${error}`
    );

    const entityName = this.getEntityName(entityType);
    const operationName = this.getOperationName(operation);

    // Essayer de traduire le message d'erreur s'il contient un code
    // Le format attendu est "CODE: message" ou juste le code
    let translatedError = error;
    const errorParts = error.split(":");
    if (errorParts.length > 1) {
      const errorCode = errorParts[0].trim();
      const errorMessage = errorParts.slice(1).join(":").trim();
      const errorKey = getErrorTranslationKey(errorCode);
      const translated = i18next.t(errorKey as never, { defaultValue: "" });
      translatedError = translated || errorMessage || error;
    } else if (error.match(/^[A-Z_]+$/)) {
      // Si l'erreur est juste un code (tout en majuscules et underscores)
      const errorKey = getErrorTranslationKey(error);
      const translated = i18next.t(errorKey as never, { defaultValue: "" });
      translatedError = translated || error;
    }

    const title = i18next.t("outbox:sync.errorTitle", {
      entityName,
      operationName,
      defaultValue: `${entityName} : Erreur lors de l'opération ${operationName}`,
    });

    showError(title, {
      duration: 10000,
      description: translatedError,
    });

    // Rafraîchir l'outbox store immédiatement après chaque erreur
    const store = useOutboxStore.getState();

    // Rafraîchissement immédiat pour voir les changements d'état en temps réel
    store.refreshOperations().catch(console.error);
  }
}
