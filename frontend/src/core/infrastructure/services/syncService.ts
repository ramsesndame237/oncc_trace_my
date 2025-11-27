import { injectable } from "tsyringe";
import { SystemErrorCodes } from "../../domain/error-codes";
import {
  IPostLoginSyncHandler,
  ISyncCallbacks,
  ISyncHandler,
} from "../../domain/sync.types";
import { ApiError } from "../api/client";
import { db, PendingOperation } from "../database/db";

/**
 * Nombre maximum de tentatives de synchronisation avant d'abandonner
 */
const MAX_RETRIES = 3;

/**
 * Service central pour orchestrer la synchronisation des données.
 * Il gère une file d'attente d'opérations et délègue leur traitement
 * aux `handlers` spécifiques à chaque type d'entité.
 */
@injectable()
export class SyncService {
  private handlers = new Map<string, ISyncHandler>();
  private isProcessing = false;
  private callbacks: ISyncCallbacks = {};

  /**
   * Enregistre un gestionnaire de synchronisation pour un type d'entité spécifique.
   * Auto-détecte et configure les callbacks si le handler les implémente.
   * @param handler Le gestionnaire à enregistrer.
   */
  public registerHandler(handler: ISyncHandler): void {
    this.handlers.set(handler.entityType, handler);

    // Auto-détection des callbacks
    if (this.hasSyncCallbacks(handler)) {
      this.setCallbacks(handler);
    }
  }

  /**
   * Configure les callbacks pour les notifications de synchronisation.
   * @param callbacks Les callbacks à enregistrer pour les événements de sync.
   */
  public setCallbacks(callbacks: ISyncCallbacks): void {
    this.callbacks = callbacks;
  }

  /**
   * Ajoute une opération à la file d'attente de synchronisation.
   * @param operation L'opération à mettre en file d'attente.
   * @param userId L'ID de l'utilisateur qui effectue l'opération (OBLIGATOIRE).
   */
  public async queueOperation(
    operation: Omit<
      PendingOperation,
      "id" | "timestamp" | "retries" | "userId"
    >,
    userId: string
  ): Promise<void> {
    if (!userId) {
      throw new Error(
        "userId est obligatoire - aucune donnée anonyme autorisée"
      );
    }

    await db.pendingOperations.add({
      ...operation,
      userId,
      retries: 0,
      timestamp: Date.now(),
    });
    this.triggerSync();
  }

  /**
   * Traite la file d'attente des opérations. S'assure qu'un seul traitement
   * est en cours à la fois pour éviter les conditions de concurrence.
   * @param userId ID de l'utilisateur pour filtrer les opérations (optionnel, traite toutes si non fourni)
   */
  public async processQueue(userId?: string): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      let pendingOps = await db.pendingOperations
        .orderBy("timestamp")
        .toArray();

      // Filtrer par utilisateur si spécifié
      if (userId !== undefined) {
        pendingOps = pendingOps.filter((op) => op.userId === userId);
      }

      // ⚠️ NOUVEAU : Trier par type d'entité selon l'ordre de dépendance
      // Cela garantit que les actors sont synced avant conventions/calendars/transactions
      const orderedOps = this.sortOperationsByDependency(pendingOps);

      for (const op of orderedOps) {
        const handler = this.handlers.get(op.entityType);
        if (handler) {
          try {
            console.log(
              `🔄 SyncService: Début traitement opération #${op.id} (${op.entityType} ${op.operation} ${op.entityId})`
            );
            await handler.handle(op);
            console.log(`✅ SyncService: Opération #${op.id} réussie`);

            // Si le traitement réussit, supprime l'opération de la file.
            await db.pendingOperations.delete(op.id!);

            // Appel du callback de succès
            if (this.callbacks.onSuccess) {
              console.log(
                `✅ SyncService: Appel callback onSuccess pour #${op.id}`
              );
              this.callbacks.onSuccess(
                op.entityType,
                op.operation,
                op.entityId
              );
            }
          } catch (error) {
            console.log(`❌ SyncService: Opération #${op.id} échouée:`, error);
            const errorMessage =
              error instanceof Error ? error.message : String(error);
            const errorCode =
              error instanceof ApiError
                ? error.errorCode
                : SystemErrorCodes.INTERNAL_ERROR;

            console.error(
              `Échec de la synchronisation pour l'opération #${op.id} (${
                op.entityType
              }), tentative ${op.retries + 1}/${MAX_RETRIES + 1}`,
              error
            );

            // Incrémenter le compteur de tentatives et enregistrer l'erreur
            const updatedRetries = op.retries + 1;
            const lastError: NonNullable<PendingOperation["lastError"]> = {
              code: errorCode,
              message: errorMessage,
              timestamp: Date.now(),
            };

            // Préserver tous les détails de l'erreur si présents
            if (error instanceof ApiError && error.details) {
              Object.assign(lastError, error.details);
            }

            await db.pendingOperations.update(op.id!, {
              retries: updatedRetries,
              lastError,
            });

            // Appel du callback d'erreur
            // Passer le code d'erreur avec le message pour permettre la traduction
            if (this.callbacks.onError) {
              const errorWithCode = errorCode
                ? `${errorCode}: ${errorMessage}`
                : errorMessage;
              this.callbacks.onError(
                op.entityType,
                op.operation,
                errorWithCode,
                op.entityId
              );
            }

            // Si on a dépassé le nombre maximum de tentatives, on arrête les retries pour cette opération
            if (updatedRetries > MAX_RETRIES) {
              console.warn(
                `Opération #${op.id} (${op.entityType}) abandonnée après ${MAX_RETRIES} tentatives. L'opération reste dans la file d'attente pour examen manuel.`
              );
            }
          }
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Traite la file d'attente des opérations pour un utilisateur spécifique uniquement.
   * @param userId ID de l'utilisateur dont les opérations doivent être traitées.
   */
  public async processQueueForUser(userId: string): Promise<void> {
    return this.processQueue(userId);
  }

  /**
   * Obtient les opérations en attente pour un utilisateur spécifique.
   * @param userId ID de l'utilisateur (OBLIGATOIRE - plus d'opérations anonymes).
   * @returns Liste des opérations en attente pour cet utilisateur.
   */
  public async getPendingOperationsForUser(
    userId: string
  ): Promise<PendingOperation[]> {
    if (!userId) {
      throw new Error(
        "userId est obligatoire - aucune opération anonyme n'existe"
      );
    }

    return await db.pendingOperations
      .where("userId")
      .equals(userId)
      .sortBy("timestamp");
  }

  /**
   * Obtient le nombre d'opérations en attente pour un utilisateur spécifique.
   * @param userId ID de l'utilisateur (OBLIGATOIRE - plus d'opérations anonymes).
   * @returns Nombre d'opérations en attente.
   */
  public async getPendingOperationsCountForUser(
    userId: string
  ): Promise<number> {
    if (!userId) {
      throw new Error(
        "userId est obligatoire - aucune opération anonyme n'existe"
      );
    }

    return await db.pendingOperations.where("userId").equals(userId).count();
  }

  /**
   * Supprime toutes les opérations d'un utilisateur spécifique.
   * NOUVEAU COMPORTEMENT: Les données ne sont jamais marquées comme anonymes.
   * Elles restent avec leur userId original et sont simplement invisibles pour les autres utilisateurs.
   * @param userId ID de l'utilisateur dont les opérations doivent être supprimées.
   * @param deleteOperations Si true, supprime définitivement les opérations (défaut: false pour préserver les données).
   */
  public async cleanupUserOperations(
    userId: string,
    deleteOperations = false
  ): Promise<void> {
    if (deleteOperations) {
      // Supprimer complètement les opérations (cas rare - changement de device par exemple)
      const userOps = await db.pendingOperations
        .where("userId")
        .equals(userId)
        .toArray();

      for (const op of userOps) {
        await db.pendingOperations.delete(op.id!);
      }

      console.log(
        `🗑️ Supprimé ${userOps.length} opérations pour l'utilisateur ${userId}`
      );
    } else {
      // NOUVEAU: Ne rien faire - les données restent avec leur userId
      // Elles sont simplement invisibles aux autres utilisateurs grâce au filtrage UI
      console.log(
        `💾 Conservation des opérations de l'utilisateur ${userId} (invisibles aux autres)`
      );
    }
  }

  /**
   * Démarre le service et attache les écouteurs d'événements.
   * Synchronise immédiatement les données si un utilisateur est connecté.
   */
  public start(): void {
    // Vérifier que nous sommes côté client avant d'utiliser window
    if (typeof window !== "undefined") {
      // Fonction utilitaire pour récupérer l'utilisateur connecté
      const getCurrentUserId = () => {
        if (typeof window === "undefined") return null;
        // Récupérer l'utilisateur depuis le localStorage (authStore persist)
        const authState = localStorage.getItem("auth-storage");
        if (authState) {
          try {
            const parsed = JSON.parse(authState);
            return parsed?.state?.user?.id || null;
          } catch {
            return null;
          }
        }
        return null;
      };

      // Synchronisation immédiate au démarrage si utilisateur connecté
      const userId = getCurrentUserId();
      if (userId && navigator.onLine) {
        console.log(
          `🚀 Démarrage - synchronisation pour l'utilisateur connecté: ${userId}`
        );
        this.processQueue(userId);
      }

      // Écouter les changements de connexion réseau
      window.addEventListener("online", () => {
        const currentUserId = getCurrentUserId();
        if (currentUserId) {
          console.log(
            `📡 Retour en ligne - synchronisation pour l'utilisateur: ${currentUserId}`
          );
          this.processQueue(currentUserId);
        }
      });

      // Exposer le service globalement pour debug
      (window as unknown as Record<string, unknown>).debugSync = async () => {
        this.forceSync();
      };

      // Fonction pour vider la queue des opérations en attente
      (window as unknown as Record<string, unknown>).clearSyncQueue =
        async () => {
          await db.pendingOperations.clear();
        };
    }
  }

  /**
   * Force la synchronisation des données post-connexion.
   * Méthode publique pour déclencher manuellement la synchronisation.
   */
  public async forcePostLoginSync(): Promise<void> {
    await this.syncPostLoginData();
  }

  /**
   * Synchronise les données après une connexion réussie.
   * Cette méthode utilise la nouvelle interface IPostLoginSyncHandler
   * pour découpler les features et permettre une synchronisation extensible.
   */
  private async syncPostLoginData(): Promise<void> {
    const syncPromises: Promise<void>[] = [];

    for (const [entityType, handler] of this.handlers) {
      if (this.isPostLoginSyncHandler(handler)) {
        syncPromises.push(
          handler.syncOnLogin().catch((error) => {
            console.error(
              `❌ Erreur lors de la synchronisation post-connexion pour ${entityType}:`,
              error
            );
          })
        );
      }
    }

    // Attendre que toutes les synchronisations se terminent
    await Promise.allSettled(syncPromises);
  }

  /**
   * Type guard pour vérifier si un handler supporte la synchronisation post-connexion
   */
  private isPostLoginSyncHandler(
    handler: ISyncHandler
  ): handler is IPostLoginSyncHandler {
    return (
      "syncOnLogin" in handler &&
      typeof (handler as IPostLoginSyncHandler).syncOnLogin === "function"
    );
  }

  /**
   * Type guard pour vérifier si un handler implémente ISyncCallbacks
   */
  private hasSyncCallbacks(
    handler: ISyncHandler
  ): handler is ISyncHandler & ISyncCallbacks {
    return (
      typeof (handler as ISyncCallbacks).onSuccess === "function" ||
      typeof (handler as ISyncCallbacks).onError === "function"
    );
  }

  /**
   * Déclenche le traitement de la file d'attente si l'application est en ligne.
   * C'est le point d'entrée public pour démarrer la synchronisation.
   */
  public triggerSync(): void {
    if (typeof window !== "undefined" && navigator.onLine) {
      this.processQueue();
    }
  }

  /**
   * Méthode de debug pour forcer la synchronisation même hors ligne
   */
  public forceSync(): void {
    this.processQueue();
  }

  /**
   * Méthode de debug pour obtenir des informations sur l'état du service
   */
  public async getDebugInfo(): Promise<{
    handlersCount: number;
    handlerTypes: string[];
    isProcessing: boolean;
    pendingOperationsCount: number;
    pendingOperations: PendingOperation[];
    operationsByUser: Record<string, number>;
    isOnline: boolean | string;
    hasCallbacks: boolean;
  }> {
    const pendingOps = await db.pendingOperations
      .orderBy("timestamp")
      .toArray();

    // Compter les opérations par utilisateur (plus d'opérations anonymes)
    const operationsByUser: Record<string, number> = {};

    for (const op of pendingOps) {
      operationsByUser[op.userId] = (operationsByUser[op.userId] || 0) + 1;
    }

    return {
      handlersCount: this.handlers.size,
      handlerTypes: Array.from(this.handlers.keys()),
      isProcessing: this.isProcessing,
      pendingOperationsCount: pendingOps.length,
      pendingOperations: pendingOps,
      operationsByUser,
      isOnline: typeof window !== "undefined" ? navigator.onLine : "undefined",
      hasCallbacks: Boolean(this.callbacks.onSuccess || this.callbacks.onError),
    };
  }

  /**
   * Trie les opérations selon l'ordre de dépendance pour garantir
   * que les entités parentes sont synchronisées avant leurs dépendances :
   * 1. Actor          (pas de dépendances)
   * 2. Store          (dépend de Actor pour occupants - optionnel)
   * 3. Convention     (dépend de Actor : OPA, BuyerExporter)
   * 4. Calendar       (dépend de Actor : OPA, et Convention - optionnel)
   * 5. ProductTransfer (dépend de Actor : sender/receiver, et Store : sender/receiver)
   * 6. Transaction    (dépend de Actor, Convention, Calendar)
   */
  private sortOperationsByDependency(
    operations: PendingOperation[]
  ): PendingOperation[] {
    // Ordre des types d'entités (actors en premier)
    const entityOrder: Record<string, number> = {
      parcel: 1,
      actor: 2,
      store: 3,
      convention: 4,
      calendar: 5,
      productTransfer: 6,
      transaction: 7,
    };

    // Ordre des types d'acteurs pour éviter les conflits de localId
    // Les acteurs de base (PRODUCER, BUYER) doivent être synchronisés AVANT
    // les groupements (PRODUCERS/OPA, EXPORTER) qui les référencent
    const actorTypeOrder: Record<string, number> = {
      PRODUCER: 1, // Producteurs individuels d'abord
      BUYER: 2, // Acheteurs individuels
      PRODUCERS: 3, // OPA (groupements) après les producteurs
      EXPORTER: 4, // Exportateurs après les OPA et acheteurs
      TRANSFORMER: 5, // Transformateurs en dernier
    };

    // Ordre des types d'opérations
    // Logique : CREATE → AJOUT DE RELATIONS → MODIFICATIONS → DELETE
    const operationTypeOrder: Record<string, number> = {
      // 1️⃣ CRÉATIONS (entité principale)
      create: 1,
      create_bulk: 1, // Création en masse

      // 2️⃣ AJOUT DE RELATIONS (après création de l'entité)
      update_producer_opa: 2, // Ajouter des producteurs à un OPA
      update_buyer_exporter: 2, // Ajouter des acheteurs à un Exportateur

      // 3️⃣ MODIFICATIONS DE L'ENTITÉ PRINCIPALE
      update: 3,

      // 4️⃣ SUPPRESSIONS (tout à la fin)
      delete: 4,
    };

    return operations.sort((a, b) => {
      const orderA = entityOrder[a.entityType] || 999;
      const orderB = entityOrder[b.entityType] || 999;

      // 1️⃣ Tri par type d'entité (actor, store, convention...)
      if (orderA !== orderB) {
        return orderA - orderB;
      }

      // 2️⃣ Si c'est le même type d'entité ET que c'est un actor,
      //    trier par actorType pour respecter l'ordre de dépendance
      if (a.entityType === "actor" && b.entityType === "actor") {
        const actorTypeA = (a.payload as { actorType?: string })?.actorType;
        const actorTypeB = (b.payload as { actorType?: string })?.actorType;

        if (actorTypeA && actorTypeB) {
          const actorOrderA = actorTypeOrder[actorTypeA] || 999;
          const actorOrderB = actorTypeOrder[actorTypeB] || 999;

          if (actorOrderA !== actorOrderB) {
            return actorOrderA - actorOrderB;
          }
        }
      }

      // 3️⃣ Tri par type d'opération (create, update, delete...)
      const opOrderA = operationTypeOrder[a.operation] || 999;
      const opOrderB = operationTypeOrder[b.operation] || 999;

      if (opOrderA !== opOrderB) {
        return opOrderA - opOrderB;
      }

      // 4️⃣ Si même type d'entité, même actorType ET même opération, trier par timestamp
      return a.timestamp - b.timestamp;
    });
  }
}
