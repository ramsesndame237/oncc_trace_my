import { PendingOperation } from "../infrastructure/database/db";

/**
 * Statut de synchronisation d'un bassin
 */
export type ISyncStatus =
  | "synced"
  | "pending_creation"
  | "pending_update"
  | "pending_deletion";

export const SyncStatus = {
  SYNCED: "synced",
  PENDING_CREATION: "pending_creation",
  PENDING_UPDATE: "pending_update",
  PENDING_DELETION: "pending_deletion",
} as const;

/**
 * Définit le contrat pour un gestionnaire de synchronisation.
 * Chaque module de feature (bassin, acteur, etc.) qui nécessite une synchronisation
 * devra implémenter cette interface.
 */
export interface ISyncHandler {
  /**
   * Le nom unique qui identifie le type d'entité.
   * Ex: 'productionBasin', 'actor'
   */
  readonly entityType: string;

  /**
   * Traite une opération de synchronisation spécifique pour cette entité.
   * C'est ici que la logique d'appel à l'API (POST, PUT, DELETE) sera implémentée.
   * @param operation L'opération en attente à traiter.
   * @returns Une promesse qui se résout lorsque l'opération est terminée.
   */
  handle(operation: PendingOperation): Promise<void>;
}

/**
 * Interface pour les handlers qui doivent se synchroniser après une connexion réussie.
 * Les repositories qui implémentent cette interface seront automatiquement
 * appelés par le SyncService après chaque connexion utilisateur.
 */
export interface IPostLoginSyncHandler extends ISyncHandler {
  /**
   * Méthode appelée après une connexion réussie pour synchroniser les données initiales.
   * Cette méthode doit implémenter une logique intelligente pour éviter les synchronisations inutiles.
   */
  syncOnLogin(): Promise<void>;
}

/**
 * Interface pour les callbacks de synchronisation.
 * Permet aux composants d'être notifiés des succès et échecs de synchronisation.
 */
export interface ISyncCallbacks {
  /**
   * Appelé quand une opération de synchronisation réussit.
   * @param entityType Type d'entité (ex: 'campaign', 'productionBasin')
   * @param operation Type d'opération ('create', 'update', 'delete')
   * @param entityId ID de l'entité synchronisée
   */
  onSuccess?: (entityType: string, operation: string, entityId: string) => void;

  /**
   * Appelé quand une opération de synchronisation échoue.
   * @param entityType Type d'entité (ex: 'campaign', 'productionBasin')
   * @param operation Type d'opération ('create', 'update', 'delete')
   * @param error Message d'erreur
   * @param entityId ID de l'entité qui a échoué
   */
  onError?: (
    entityType: string,
    operation: string,
    error: string,
    entityId: string
  ) => void;
}

/**
 * Interface combinée pour les handlers qui supportent aussi les callbacks.
 * Permet une auto-détection automatique des callbacks lors de l'enregistrement.
 */
export interface ISyncHandlerWithCallbacks
  extends ISyncHandler,
    ISyncCallbacks {}
