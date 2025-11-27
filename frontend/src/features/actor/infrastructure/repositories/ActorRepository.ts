import type { ActorTypes } from "@/core/domain/actor.types";
import { SystemErrorCodes } from "@/core/domain/error-codes";
import { USER_ROLES_CONSTANTS } from "@/core/domain/generated/user-roles.types";
import {
  IPostLoginSyncHandler,
  type ISyncHandler,
  SyncStatus,
} from "@/core/domain/sync.types";
import { apiClient, ApiError } from "@/core/infrastructure/api";
import {
  db,
  type ExporterMandateRelation,
  type OfflineActorData,
  type PendingOperation,
  type ProducerOpaRelation,
} from "@/core/infrastructure/database/db";
import { DI_TOKENS } from "@/core/infrastructure/di/tokens";
import type { SyncService } from "@/core/infrastructure/services";
import { authService } from "@/core/infrastructure/services/auth.service";
import type { PollingService } from "@/core/infrastructure/services/pollingService";
import { useAuthStore } from "@/features/auth/infrastructure/store/authStore";
import type { IDocumentRepository } from "@/features/document/domain/IDocumentRepository";
import i18n from "@/i18n/client";
import { showError, showInfo, showSuccess } from "@/lib/notifications/toast";
import { inject, injectable } from "tsyringe";
import { v4 as uuidv4 } from "uuid";
import type {
  ActorFilters,
  ActorWithSync,
  GetActorsResult,
} from "../../domain/actor.types";
import type { IActorRepository } from "../../domain/IActorRepository";
import type {
  OpaCollectionsResponse,
  ProducerProductionsResponse,
} from "../../domain/production.types";
import type {
  ActorResponse,
  PaginatedActorsResponse,
} from "../../domain/types";
import type {
  CreateActorRequest,
  UpdateActorRequest,
} from "../../domain/types/request";

@injectable()
export class ActorRepository
  implements IActorRepository, ISyncHandler, IPostLoginSyncHandler
{
  public readonly entityType = "actor";

  constructor(
    @inject(DI_TOKENS.SyncService) private syncService: SyncService,
    @inject(DI_TOKENS.IDocumentRepository)
    private documentRepository: IDocumentRepository,
    @inject(DI_TOKENS.PollingService) private pollingService: PollingService
  ) {
    // ⭐ Enregistrer le callback de changement d'utilisateur
    this.pollingService.onUserChange(async (oldUserId, newUserId) => {
      console.log(
        `🗑️ ActorRepository: Nettoyage des données suite au changement d'utilisateur (${oldUserId} → ${newUserId})`
      );
      await this.clearAllLocalData();
      console.log(`✅ ActorRepository: Données nettoyées avec succès`);
    });
  }

  /**
   * Convertit base64 en File
   */
  private base64ToFile(
    base64Data: string,
    mimeType: string,
    fileName: string
  ): File {
    // Extraire les données base64 (enlever le préfixe data:image/...;base64,)
    const base64String = base64Data.includes(",")
      ? base64Data.split(",")[1]
      : base64Data;

    // Convertir base64 en bytes
    const byteCharacters = atob(base64String);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);

    // Créer un Blob puis un File
    const blob = new Blob([byteArray], { type: mimeType });
    return new File([blob], fileName, { type: mimeType });
  }

  /**
   * Obtient l'ID de l'utilisateur actuellement connecté
   */
  private async getCurrentUserId(): Promise<string | null> {
    if (typeof window === "undefined") return null;
    return await authService.getCurrentUserId();
  }

  /**
   * Mappe une réponse API vers un acteur avec statut de sync
   */
  private mapResponseToActor(response: ActorResponse): ActorWithSync {
    return {
      id: response.id,
      actorType: response.actorType,
      familyName: response.familyName,
      givenName: response.givenName,
      phone: response.phone,
      email: response.email,
      onccId: response.onccId,
      identifiantId: response.identifiantId,
      locationCode: response.locationCode,
      status: response.status,
      managerInfo: response.managerInfo,
      metadata: response.metadata,
      existenceDeclarationDate: response.existenceDeclarationDate,
      existenceDeclarationCode: response.existenceDeclarationCode,
      existenceDeclarationYears: response.existenceDeclarationYears,
      existenceExpiryDate: response.existenceExpiryDate,
      createdAt: response.createdAt,
      updatedAt: response.updatedAt,
      location: response.location
        ? {
            code: response.location.code,
            name: response.location.name,
            type: response.location.type,
          }
        : undefined,
      parcels: response.parcels,
      documents: response.documents,
      producers: response.producers, // ✅ Ajouter le mapping des producteurs
      buyers: response.buyers, // ✅ Ajouter le mapping des mandataires (pour EXPORTER)
      mandators: response.mandators, // ✅ Ajouter le mapping des exportateurs mandants (pour BUYER)
      stores: response.stores, // ✅ Ajouter le mapping des magasins
      calendars: response.calendars, // ✅ Ajouter le mapping des calendriers
      fullName: `${response.familyName} ${response.givenName}`.trim(),
      syncStatus: SyncStatus.SYNCED,
    };
  }

  /**
   * Récupère tous les acteurs selon les filtres
   */
  async getAll(
    filters: ActorFilters,
    isOnline: boolean
  ): Promise<GetActorsResult> {
    if (!isOnline) {
      // TODO: Implémenter la récupération offline depuis IndexedDB
      return {
        actors: [],
        meta: {
          total: 0,
          perPage: filters.per_page || 10,
          currentPage: filters.page || 1,
          lastPage: 1,
          firstPage: 1,
          firstPageUrl: "",
          lastPageUrl: "",
          nextPageUrl: null,
          previousPageUrl: null,
        },
      };
    }

    // Mode online : récupération depuis l'API
    try {
      // Construire les query params
      const queryParams = new URLSearchParams();
      if (filters.page) queryParams.append("page", filters.page.toString());
      if (filters.per_page)
        queryParams.append("per_page", filters.per_page.toString());
      if (filters.search) queryParams.append("search", filters.search);
      if (filters.actorType) queryParams.append("actorType", filters.actorType);
      if (filters.status) queryParams.append("status", filters.status);
      if (filters.locationCode)
        queryParams.append("locationCode", filters.locationCode);

      const queryString = queryParams.toString();
      const endpoint = queryString ? `/actors?${queryString}` : "/actors";

      const response = await apiClient.get<PaginatedActorsResponse>(endpoint);

      if (!response.success || !response.data) {
        throw new Error("Erreur lors de la récupération des acteurs");
      }

      return {
        actors: response.data.data.map((actor) =>
          this.mapResponseToActor(actor)
        ),
        meta: response.data.meta,
      };
    } catch (error) {
      console.error("Error fetching actors:", error);
      throw error;
    }
  }

  /**
   * Récupère un acteur par son ID
   */
  async getById(id: string, isOnline: boolean): Promise<ActorWithSync> {
    if (!isOnline) {
      // Mode offline : récupération depuis les opérations en attente
      const userId = await this.getCurrentUserId();

      if (!userId) {
        throw new Error("Utilisateur non connecté");
      }

      try {
        const pendingOperation = await db.pendingOperations
          .where("entityId")
          .equals(id)
          .and((op) => op.userId === userId)
          .first();

        if (pendingOperation) {
          const payload = pendingOperation.payload as Partial<ActorResponse>;

          return {
            id: pendingOperation.entityId,
            actorType: payload.actorType ?? "PRODUCER",
            familyName: payload.familyName ?? "",
            givenName: payload.givenName ?? "",
            phone: payload.phone,
            email: payload.email,
            onccId: payload.onccId,
            identifiantId: payload.identifiantId,
            locationCode: payload.locationCode ?? "",
            status: payload.status ?? "active",
            managerInfo: payload.managerInfo,
            metadata: payload.metadata,
            createdAt: payload.createdAt ?? new Date().toISOString(),
            updatedAt: payload.updatedAt ?? new Date().toISOString(),
            location: payload.location,
            parcels: payload.parcels,
            documents: payload.documents,
            fullName: `${payload.givenName ?? ""} ${
              payload.familyName ?? ""
            }`.trim(),
            syncStatus:
              pendingOperation.operation === "create"
                ? SyncStatus.PENDING_CREATION
                : SyncStatus.PENDING_UPDATE,
          };
        } else {
          throw new Error("Acteur non trouvé en mode hors ligne");
        }
      } catch (error) {
        console.error(
          "Erreur lors de la récupération offline de l'acteur:",
          error
        );
        throw new Error("Impossible de récupérer l'acteur en mode hors ligne");
      }
    }

    // Mode online : récupération depuis l'API
    try {
      const response = await apiClient.get<ActorResponse>(`/actors/${id}`);

      if (!response.success || !response.data) {
        throw new Error("Acteur non trouvé sur le serveur.");
      }

      return this.mapResponseToActor(response.data);
    } catch (error) {
      console.error("Error fetching actor by id:", error);
      throw error;
    }
  }

  /**
   * Ajoute un nouvel acteur (stockage local + file d'attente de sync)
   */
  async add(
    actor: Omit<ActorWithSync, "id">,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _isOnline: boolean
  ): Promise<void> {
    const localId = uuidv4();
    const timestamp = Date.now();
    const userId = await this.getCurrentUserId();

    if (!userId) {
      throw new Error(
        "Utilisateur non connecté - impossible de créer une opération sans userId"
      );
    }

    // Créer les données de requête pour l'API
    const createActorRequest: CreateActorRequest = {
      actorType: actor.actorType,
      familyName: actor.familyName,
      givenName: actor.givenName,
      locationCode: actor.locationCode,
      status: actor.status || "active",
    };

    // Ajouter les champs optionnels s'ils sont présents
    if (actor.phone && actor.phone.trim() !== "") {
      createActorRequest.phone = actor.phone;
    }

    if (actor.email && actor.email.trim() !== "") {
      createActorRequest.email = actor.email;
    }

    if (actor.onccId && actor.onccId.trim() !== "") {
      createActorRequest.onccId = actor.onccId;
    }

    if (actor.identifiantId && actor.identifiantId.trim() !== "") {
      createActorRequest.identifiantId = actor.identifiantId;
    }

    if (actor.metadata) {
      createActorRequest.metadata = actor.metadata as Record<string, string>;
    }

    if (actor.managerInfo) {
      createActorRequest.managerInfo = actor.managerInfo;
    }

    if (actor.existenceDeclarationDate) {
      createActorRequest.existenceDeclarationDate =
        actor.existenceDeclarationDate ?? "";
      createActorRequest.existenceDeclarationCode =
        actor.existenceDeclarationCode ?? "";
      createActorRequest.existenceDeclarationYears =
        actor.existenceDeclarationYears ?? 2;
    }

    // Ajouter les parcelles si présentes
    if (actor.parcels && actor.parcels.length > 0) {
      createActorRequest.parcels = actor.parcels.map((parcel) => ({
        locationCode: parcel.locationCode,
        surfaceArea: parcel.surfaceArea,
        parcelType: parcel.parcelType,
        identificationId: parcel.identificationId,
        onccId: parcel.onccId,
        parcelCreationDate: parcel.parcelCreationDate,
        coordinates: parcel.coordinates,
      }));
    }

    // Ajouter les documents directement dans le payload si présents
    const documentsWithBase64 = (
      actor as unknown as {
        documents?: Array<{
          base64Data: string;
          mimeType: string;
          fileName: string;
          documentType: string;
        }>;
      }
    ).documents;

    if (documentsWithBase64 && documentsWithBase64.length > 0) {
      createActorRequest.documents = documentsWithBase64;
    }

    // Ajouter les producteurs si c'est une OPA (actorType === 'PRODUCERS')
    if (
      actor.actorType === "PRODUCERS" &&
      actor.producers &&
      actor.producers.length > 0
    ) {
      createActorRequest.producers = actor.producers.map((producer) => {
        // Support des deux formats :
        // 1. Format API : { id: "uuid", ... }
        // 2. Format formulaire : { producerId: "uuid", ... }
        const producerId =
          (producer as { producerId?: string }).producerId || producer.id;

        return {
          producerId,
          membershipDate: producer.membershipDate || undefined,
          status: (producer.status as "active" | "inactive") || "active",
        };
      });
    }

    // Ajouter les acheteurs mandataires si c'est un EXPORTER
    if (
      actor.actorType === "EXPORTER" &&
      actor.buyers &&
      actor.buyers.length > 0
    ) {
      createActorRequest.buyers = actor.buyers.map((buyer) => {
        // Support des deux formats :
        // 1. Format API : { id: "uuid", ... }
        // 2. Format formulaire : { buyerId: "uuid", ... }
        const buyerId = (buyer as { buyerId?: string }).buyerId || buyer.id;

        return {
          buyerId,
          mandateDate: buyer.mandateDate || undefined,
          status: (buyer.status as "active" | "inactive") || "active",
        };
      });
    }

    // 1. Ajouter dans pendingOperations avec localId
    const operation: Omit<
      PendingOperation,
      "id" | "timestamp" | "retries" | "userId"
    > = {
      entityId: localId,
      entityType: this.entityType,
      operation: "create",
      payload: { ...createActorRequest, localId }, // ← Ajouter localId dans le payload
    };

    await this.syncService.queueOperation(operation, userId);

    // 2. Ajouter dans OfflineActorData (SANS id, AVEC localId)
    // Convertir "pending" en "active" car OfflineActorData n'accepte que "active" | "inactive"
    const offlineStatus: "active" | "inactive" | undefined =
      actor.status === "pending" ? "active" : actor.status || "active";

    // ActorTypes correspond directement au type attendu par OfflineActorData
    const actorType: ActorTypes = actor.actorType;

    await db.actors.add({
      localId, // ← Présence de localId = offline
      serverId: undefined, // ← Pas de serverId = pas synchronisé
      actorType,
      familyName: actor.familyName,
      givenName: actor.givenName,
      status: offlineStatus,
      onccId: actor.onccId,
      // ⚠️ Les calendriers sont maintenant dans une table séparée (db.calendars)
      // ⚠️ Les relations many-to-many sont dans producerOpaRelations et exporterMandates
      syncedAt: timestamp,
    });

    // 3 Stocker les relations many-to-many dans les tables séparées
    // 3.1 Producteurs de l'OPA (si actorType === 'PRODUCERS')
    if (
      actor.actorType === "PRODUCERS" &&
      actor.producers &&
      actor.producers.length > 0
    ) {
      const producerOpaRelations: ProducerOpaRelation[] = [];

      for (const producer of actor.producers) {
        // Déterminer si le producteur a un serverId ou localId
        const producerInDb = await db.actors
          .filter(
            (a) => a.serverId === producer.id || a.localId === producer.id
          )
          .first();

        producerOpaRelations.push({
          // Si le producteur est synced (a un serverId), utiliser serverId, sinon localId
          producerServerId: producerInDb?.serverId || undefined,
          producerLocalId: producerInDb?.localId || undefined, // Fallback à producer.id si pas trouvé
          opaServerId: undefined, // L'OPA est encore offline
          opaLocalId: localId, // localId de l'OPA qu'on vient de créer
          createdAt: new Date().toISOString(),
          syncedAt: timestamp,
        });
      }

      await db.producerOpaRelations.bulkAdd(producerOpaRelations);
      console.log(
        `✅ ${producerOpaRelations.length} relations Producer-OPA créées pour l'OPA offline`
      );
    }

    // 3.2 Acheteurs mandataires de l'EXPORTER (si actorType === 'EXPORTER')
    if (
      actor.actorType === "EXPORTER" &&
      actor.buyers &&
      actor.buyers.length > 0
    ) {
      const exporterMandates: ExporterMandateRelation[] = [];

      for (const buyer of actor.buyers) {
        // Déterminer si l'acheteur a un serverId ou localId
        const buyerInDb = await db.actors
          .filter((a) => a.serverId === buyer.id || a.localId === buyer.id)
          .first();

        exporterMandates.push({
          exporterServerId: undefined, // L'exporter est encore offline
          exporterLocalId: localId, // localId de l'exporter qu'on vient de créer
          // Si le buyer est synced (a un serverId), utiliser serverId, sinon localId
          buyerServerId: buyerInDb?.serverId || undefined,
          buyerLocalId: buyerInDb?.localId || undefined, // Fallback à buyer.id si pas trouvé
          createdAt: new Date().toISOString(),
          syncedAt: timestamp,
        });
      }

      await db.exporterMandates.bulkAdd(exporterMandates);
      console.log(
        `✅ ${exporterMandates.length} mandats Exporter-Buyer créés pour l'EXPORTER offline`
      );
    }
  }

  async update(
    id: string,
    actor: Partial<ActorWithSync>,
    editOffline?: boolean
  ): Promise<void> {
    const userId = await this.getCurrentUserId();

    if (!userId) {
      throw new Error(
        "Utilisateur non connecté - impossible de mettre à jour un acteur sans userId"
      );
    }

    showInfo(i18n.t("actor:messages.processing"));

    // En mode editOffline, on met à jour l'opération pendante existante
    if (editOffline) {
      const existingOperation = await db.pendingOperations
        .where("entityId")
        .equals(id)
        .and((op) => op.userId === userId)
        .first();

      if (existingOperation && existingOperation.id) {
        const updatedPayload: Record<string, unknown> = {
          ...existingOperation.payload,
        };

        // Mettre à jour les champs fournis
        if (actor.actorType !== undefined) {
          updatedPayload.actorType = actor.actorType;
        }
        if (actor.familyName !== undefined) {
          updatedPayload.familyName = actor.familyName;
        }
        if (actor.givenName !== undefined) {
          updatedPayload.givenName = actor.givenName;
        }
        if (actor.locationCode !== undefined) {
          updatedPayload.locationCode = actor.locationCode;
        }
        if (actor.status !== undefined) {
          updatedPayload.status = actor.status;
        }
        if (actor.metadata !== undefined) {
          updatedPayload.metadata = actor.metadata;
        }
        if (actor.managerInfo !== undefined) {
          updatedPayload.managerInfo = actor.managerInfo;
        }

        if (actor.existenceDeclarationDate) {
          updatedPayload.existenceDeclarationDate =
            actor.existenceDeclarationDate;
          updatedPayload.existenceDeclarationCode =
            actor.existenceDeclarationCode;
          updatedPayload.existenceDeclarationYears =
            actor.existenceDeclarationYears;
        } else {
          // Envoyer explicitement null pour vider les champs en base
          updatedPayload.existenceDeclarationDate = null;
          updatedPayload.existenceDeclarationCode = null;
          updatedPayload.existenceDeclarationYears = null;
        }

        // Champs optionnels
        if (actor.phone !== undefined) {
          if (actor.phone && actor.phone.trim() !== "") {
            updatedPayload.phone = actor.phone;
          } else {
            delete updatedPayload.phone;
          }
        }

        if (actor.email !== undefined) {
          if (actor.email && actor.email.trim() !== "") {
            updatedPayload.email = actor.email;
          } else {
            delete updatedPayload.email;
          }
        }

        if (actor.onccId !== undefined) {
          if (actor.onccId && actor.onccId.trim() !== "") {
            updatedPayload.onccId = actor.onccId;
          } else {
            delete updatedPayload.onccId;
          }
        }

        if (actor.identifiantId !== undefined) {
          if (actor.identifiantId && actor.identifiantId.trim() !== "") {
            updatedPayload.identifiantId = actor.identifiantId;
          } else {
            delete updatedPayload.identifiantId;
          }
        }

        // Parcelles
        if (actor.parcels !== undefined) {
          updatedPayload.parcels = actor.parcels;
        }

        // Documents
        const documentsWithBase64 = (
          actor as unknown as {
            documents?: Array<{
              base64Data: string;
              mimeType: string;
              fileName: string;
              documentType: string;
            }>;
          }
        ).documents;

        if (documentsWithBase64 !== undefined) {
          updatedPayload.documents = documentsWithBase64;
        }

        // Producteurs membres (pour OPA)
        if (actor.producers !== undefined) {
          updatedPayload.producers = actor.producers.map((producer) => ({
            producerId: producer.id,
          }));
        }

        // Acheteurs mandataires (pour EXPORTER)
        if (actor.buyers !== undefined) {
          updatedPayload.buyers = actor.buyers.map((buyer) => ({
            buyerId: buyer.id,
          }));
        }

        await db.pendingOperations.update(existingOperation.id, {
          payload: updatedPayload,
          timestamp: Date.now(),
        });

        // ✅ MISE À JOUR des données locales dans db.actors
        // Trouver l'acteur par serverId ou localId
        const actorInDb = await db.actors
          .filter((a) => a.serverId === id || a.localId === id)
          .first();

        if (actorInDb) {
          const updateData: Partial<typeof actorInDb> = {};

          // Mettre à jour uniquement les champs modifiés
          if (actor.actorType !== undefined) {
            updateData.actorType = actor.actorType;
          }
          if (actor.familyName !== undefined)
            updateData.familyName = actor.familyName;
          if (actor.givenName !== undefined)
            updateData.givenName = actor.givenName;
          if (actor.status !== undefined) {
            // Convertir "pending" en "active" car OfflineActorData n'accepte que "active" | "inactive"
            updateData.status =
              actor.status === "pending" ? "active" : actor.status;
          }
          if (actor.onccId !== undefined) updateData.onccId = actor.onccId;

          // Appliquer la mise à jour
          const key = actorInDb.localId || actorInDb.id;
          if (key) {
            await db.actors
              .where(actorInDb.localId ? "localId" : "id")
              .equals(key)
              .modify(updateData);
          }
        }

        // ✅ MISE À JOUR des tables pivot (producerOpaRelations et exporterMandates)
        const timestamp = Date.now();

        // Mise à jour des producteurs membres (pour OPA)
        if (actor.actorType === "PRODUCERS" && actor.producers !== undefined) {
          // 1. Supprimer toutes les anciennes relations pour cet OPA
          await db.producerOpaRelations
            .where("opaServerId")
            .equals(id)
            .or("opaLocalId")
            .equals(id)
            .delete();

          // 2. Ajouter les nouvelles relations
          if (actor.producers.length > 0) {
            const producerOpaRelations: ProducerOpaRelation[] = [];

            for (const producer of actor.producers) {
              // Chercher le producteur dans db.actors pour savoir s'il a un serverId ou localId
              const producerInDb = await db.actors
                .filter(
                  (a) => a.serverId === producer.id || a.localId === producer.id
                )
                .first();

              producerOpaRelations.push({
                producerServerId: producerInDb?.serverId || undefined,
                producerLocalId: producerInDb?.localId || undefined,
                opaServerId: actorInDb?.serverId || undefined,
                opaLocalId: actorInDb?.localId || undefined,
                createdAt: new Date().toISOString(),
                syncedAt: timestamp,
              });
            }

            await db.producerOpaRelations.bulkAdd(producerOpaRelations);
            console.log(
              `✅ ${producerOpaRelations.length} relations Producer-OPA mises à jour pour l'OPA ${id}`
            );
          }
        }

        // Mise à jour des acheteurs mandataires (pour EXPORTER)
        if (actor.actorType === "EXPORTER" && actor.buyers !== undefined) {
          // 1. Supprimer toutes les anciennes relations pour cet exportateur
          await db.exporterMandates
            .where("exporterServerId")
            .equals(id)
            .or("exporterLocalId")
            .equals(id)
            .delete();

          // 2. Ajouter les nouvelles relations
          if (actor.buyers.length > 0) {
            const exporterMandates: ExporterMandateRelation[] = [];

            for (const buyer of actor.buyers) {
              // Chercher l'acheteur dans db.actors pour savoir s'il a un serverId ou localId
              const buyerInDb = await db.actors
                .filter(
                  (a) => a.serverId === buyer.id || a.localId === buyer.id
                )
                .first();

              exporterMandates.push({
                exporterServerId: actorInDb?.serverId || undefined,
                exporterLocalId: actorInDb?.localId || undefined,
                buyerServerId: buyerInDb?.serverId || undefined,
                buyerLocalId: buyerInDb?.localId || undefined,
                createdAt: new Date().toISOString(),
                syncedAt: timestamp,
              });
            }

            await db.exporterMandates.bulkAdd(exporterMandates);
            console.log(
              `✅ ${exporterMandates.length} relations Exporter-Buyer mises à jour pour l'exportateur ${id}`
            );
          }
        }

        this.syncService.triggerSync();
        return;
      }
    }

    // Si pas en mode editOffline ou aucune opération existante, on crée une nouvelle opération
    const updateActorRequest: Partial<UpdateActorRequest> = {};

    // Ajouter seulement les champs fournis
    if (actor.actorType !== undefined) {
      updateActorRequest.actorType = actor.actorType;
    }
    if (actor.familyName !== undefined) {
      updateActorRequest.familyName = actor.familyName;
    }
    if (actor.givenName !== undefined) {
      updateActorRequest.givenName = actor.givenName;
    }
    if (actor.locationCode !== undefined) {
      updateActorRequest.locationCode = actor.locationCode;
    }
    if (actor.status !== undefined) {
      updateActorRequest.status = actor.status;
    }
    if (actor.metadata !== undefined) {
      updateActorRequest.metadata = actor.metadata;
    }
    if (actor.managerInfo !== undefined) {
      updateActorRequest.managerInfo = actor.managerInfo;
    }

    if (actor.existenceDeclarationDate) {
      updateActorRequest.existenceDeclarationDate =
        actor.existenceDeclarationDate;
      updateActorRequest.existenceDeclarationCode =
        actor.existenceDeclarationCode ?? "";
      updateActorRequest.existenceDeclarationYears =
        actor.existenceDeclarationYears ?? 2;
    } else {
      // Envoyer explicitement null pour vider les champs en base
      updateActorRequest.existenceDeclarationDate = undefined;
      updateActorRequest.existenceDeclarationCode = undefined;
      updateActorRequest.existenceDeclarationYears = undefined;
    }

    // Gestion des champs optionnels
    if (actor.phone !== undefined) {
      if (actor.phone && actor.phone.trim() !== "") {
        updateActorRequest.phone = actor.phone;
      }
    }

    if (actor.email !== undefined) {
      if (actor.email && actor.email.trim() !== "") {
        updateActorRequest.email = actor.email;
      }
    }

    if (actor.onccId !== undefined) {
      if (actor.onccId && actor.onccId.trim() !== "") {
        updateActorRequest.onccId = actor.onccId;
      }
    }

    if (actor.identifiantId !== undefined) {
      if (actor.identifiantId && actor.identifiantId.trim() !== "") {
        updateActorRequest.identifiantId = actor.identifiantId;
      }
    }

    const operation: Omit<
      PendingOperation,
      "id" | "timestamp" | "retries" | "userId"
    > = {
      entityId: id,
      entityType: this.entityType,
      operation: "update",
      payload: updateActorRequest as unknown as Record<string, unknown>,
    };

    await this.syncService.queueOperation(operation, userId);
  }

  /**
   * Gère les opérations de synchronisation pour les acteurs
   */
  public async handle(operation: PendingOperation): Promise<void> {
    switch (operation.operation) {
      case "create":
        await this.handleCreate(operation);
        break;
      case "update":
        await this.handleUpdate(operation);
        break;
      case "update_producer_opa":
        await this.handleManageProducerOpa(operation);
        break;
      case "update_buyer_exporter":
        await this.handleManageBuyerExporter(operation);
        break;
      default:
        throw new Error(`Opération non supportée: ${operation.operation}`);
    }
  }

  /**
   * Gère la création d'un acteur côté serveur
   */
  private async handleCreate(operation: PendingOperation): Promise<void> {
    const { documents, localId, ...payload } =
      operation.payload as unknown as CreateActorRequest & { localId?: string };

    try {
      // Vérification de l'authentification
      if (!apiClient.getToken()) {
        throw new ApiError(
          SystemErrorCodes.UNAUTHORIZED,
          "Token d'authentification requis pour créer un acteur"
        );
      }

      // Nettoyer le payload avant l'envoi
      const cleanPayload = { ...payload };

      // Supprimer l'ID local qui n'est pas nécessaire pour l'API
      delete (cleanPayload as Record<string, unknown>).id;
      delete (cleanPayload as Record<string, unknown>).localId;

      // Supprimer les documents qui seront uploadés séparément
      delete (cleanPayload as Record<string, unknown>).documents;

      // Supprimer les champs optionnels qui sont undefined ou vides
      if (!cleanPayload.phone || cleanPayload.phone.trim() === "") {
        delete cleanPayload.phone;
      }

      if (!cleanPayload.email || cleanPayload.email.trim() === "") {
        delete cleanPayload.email;
      }

      if (!cleanPayload.onccId || cleanPayload.onccId.trim() === "") {
        delete cleanPayload.onccId;
      }

      if (
        !cleanPayload.identifiantId ||
        cleanPayload.identifiantId.trim() === ""
      ) {
        delete cleanPayload.identifiantId;
      }

      // Nettoyer managerInfo.phone s'il est vide
      if (cleanPayload.managerInfo) {
        if (
          !cleanPayload.managerInfo.phone ||
          cleanPayload.managerInfo.phone.trim() === ""
        ) {
          delete cleanPayload.managerInfo.phone;
        }
      }

      // ✅ Résoudre les IDs des producteurs (OPA) - convertir localId en serverId
      if (cleanPayload.producers && cleanPayload.producers.length > 0) {
        const resolvedProducers = [];

        for (const producer of cleanPayload.producers) {
          const producerId = producer.producerId;

          // Chercher l'acteur dans db.actors (soit par serverId, soit par localId)
          const actorInDb = await db.actors
            .filter(
              (a) => a.serverId === producerId || a.localId === producerId
            )
            .first();

          if (actorInDb?.serverId) {
            // Si l'acteur a un serverId, l'utiliser
            resolvedProducers.push({
              ...producer,
              producerId: actorInDb.serverId,
            });
          } else if (actorInDb?.localId) {
            // Si l'acteur n'a qu'un localId (pas encore synced), on ne peut pas l'envoyer au serveur
            console.warn(
              `⚠️ Producteur ${producerId} n'est pas encore synchronisé (localId uniquement) - ignoré`
            );
          } else {
            console.warn(
              `⚠️ Producteur ${producerId} non trouvé dans db.actors - ignoré`
            );
          }
        }

        cleanPayload.producers = resolvedProducers;
      }

      // ✅ Résoudre les IDs des acheteurs mandataires (EXPORTER) - convertir localId en serverId
      if (cleanPayload.buyers && cleanPayload.buyers.length > 0) {
        const resolvedBuyers = [];

        for (const buyer of cleanPayload.buyers) {
          const buyerId = buyer.buyerId;

          // Chercher l'acteur dans db.actors (soit par serverId, soit par localId)
          const actorInDb = await db.actors
            .filter((a) => a.serverId === buyerId || a.localId === buyerId)
            .first();

          if (actorInDb?.serverId) {
            // Si l'acteur a un serverId, l'utiliser
            resolvedBuyers.push({
              ...buyer,
              buyerId: actorInDb.serverId,
            });
          } else if (actorInDb?.localId) {
            // Si l'acteur n'a qu'un localId (pas encore synced), on ne peut pas l'envoyer au serveur
            console.warn(
              `⚠️ Acheteur ${buyerId} n'est pas encore synchronisé (localId uniquement) - ignoré`
            );
          } else {
            console.warn(
              `⚠️ Acheteur ${buyerId} non trouvé dans db.actors - ignoré`
            );
          }
        }

        cleanPayload.buyers = resolvedBuyers;
      }

      // 1. Créer l'acteur sur le serveur
      const actorResponse = await apiClient.post<{
        actor: ActorResponse;
        parcels: unknown[];
        summary: { parcelsCreated: number };
      }>("/actors", cleanPayload);

      if (!actorResponse.success || !actorResponse.data) {
        throw new Error("Échec de la création de l'acteur");
      }

      const serverId = actorResponse.data.actor.id;
      const createdActor = actorResponse.data.actor;

      // 2. Si localId présent, mettre à jour OfflineActorData (création offline)
      if (localId) {
        // Mettre à jour OfflineActorData (ajouter serverId, conserver localId pour traçabilité)
        await db.actors
          .where("localId")
          .equals(localId)
          .modify((actor) => {
            actor.serverId = serverId; // Ajouter serverId après sync
          });

        console.log(
          `✅ Actor ${localId} synchronisé avec serveur → serverId: ${serverId} (localId conservé pour traçabilité)`
        );
      }

      // 2.1. Mettre à jour les tables pivot si l'acteur créé est une OPA ou un EXPORTER
      const timestamp = Date.now();

      // Mettre à jour producerOpaRelations si c'est une OPA avec des producteurs
      if (
        createdActor.actorType === "PRODUCERS" &&
        createdActor.producers &&
        createdActor.producers.length > 0
      ) {
        // Supprimer les anciennes relations (celles avec localId si elles existent)
        if (localId) {
          await db.producerOpaRelations
            .where("opaLocalId")
            .equals(localId)
            .delete();
        }

        // Ajouter les nouvelles relations avec serverId
        const producerOpaRelations: ProducerOpaRelation[] = [];

        for (const producer of createdActor.producers) {
          producerOpaRelations.push({
            producerServerId: producer.id, // ID du producteur (vient du serveur)
            producerLocalId: undefined,
            opaServerId: serverId, // ID de l'OPA (vient du serveur)
            opaLocalId: undefined,
            createdAt: new Date().toISOString(),
            syncedAt: timestamp,
          });
        }

        if (producerOpaRelations.length > 0) {
          await db.producerOpaRelations.bulkAdd(producerOpaRelations);
          console.log(
            `✅ ${producerOpaRelations.length} relations Producer-OPA créées pour l'OPA ${serverId}`
          );
        }
      }

      // Mettre à jour exporterMandates si c'est un EXPORTER avec des acheteurs
      if (
        createdActor.actorType === "EXPORTER" &&
        createdActor.buyers &&
        createdActor.buyers.length > 0
      ) {
        // Supprimer les anciennes relations (celles avec localId si elles existent)
        if (localId) {
          await db.exporterMandates
            .where("exporterLocalId")
            .equals(localId)
            .delete();
        }

        // Ajouter les nouvelles relations avec serverId
        const exporterMandates: ExporterMandateRelation[] = [];

        for (const buyer of createdActor.buyers) {
          exporterMandates.push({
            exporterServerId: serverId, // ID de l'exportateur (vient du serveur)
            exporterLocalId: undefined,
            buyerServerId: buyer.id, // ID du buyer (vient du serveur)
            buyerLocalId: undefined,
            createdAt: new Date().toISOString(),
            syncedAt: timestamp,
          });
        }

        if (exporterMandates.length > 0) {
          await db.exporterMandates.bulkAdd(exporterMandates);
          console.log(
            `✅ ${exporterMandates.length} relations Exporter-Buyer créées pour l'exportateur ${serverId}`
          );
        }
      }

      // 3. Uploader les documents si présents dans le payload
      if (documents && documents.length > 0) {
        try {
          // Convertir tous les documents base64 en File
          const files = documents.map((doc) =>
            this.base64ToFile(doc.base64Data, doc.mimeType, doc.fileName)
          );

          // Extraire les types de documents
          const documentTypes = documents.map((doc) => doc.documentType);

          // Upload tous les documents en une seule requête via DocumentRepository
          await this.documentRepository.uploadDocuments(
            {
              files,
              documentableType: "Actor",
              documentableId: serverId,
              documentTypes,
            },
            true // isOnline
          );
        } catch (docError) {
          console.error("Erreur lors de l'upload des documents:", docError);
          // On ne bloque pas la création de l'acteur si les documents échouent
        }
      }
    } catch (err) {
      // Relancer l'erreur pour que le SyncService puisse la traiter
      throw err;
    }
  }

  /**
   * Gère la mise à jour d'un acteur côté serveur
   */
  private async handleUpdate(operation: PendingOperation): Promise<void> {
    const payload = operation.payload as unknown as Partial<CreateActorRequest>;

    try {
      // Vérification de l'authentification
      if (!apiClient.getToken()) {
        throw new ApiError(
          SystemErrorCodes.UNAUTHORIZED,
          "Token d'authentification requis pour modifier un acteur"
        );
      }

      // Nettoyer le payload avant l'envoi
      const cleanPayload = { ...payload };

      // Supprimer les champs optionnels qui sont undefined ou vides
      if (!cleanPayload.phone || cleanPayload.phone.trim() === "") {
        delete cleanPayload.phone;
      }

      if (!cleanPayload.email || cleanPayload.email.trim() === "") {
        delete cleanPayload.email;
      }

      if (!cleanPayload.onccId || cleanPayload.onccId.trim() === "") {
        delete cleanPayload.onccId;
      }

      if (
        !cleanPayload.identifiantId ||
        cleanPayload.identifiantId.trim() === ""
      ) {
        delete cleanPayload.identifiantId;
      }

      // Nettoyer managerInfo.phone s'il est vide
      if (cleanPayload.managerInfo) {
        if (
          !cleanPayload.managerInfo.phone ||
          cleanPayload.managerInfo.phone.trim() === ""
        ) {
          delete cleanPayload.managerInfo.phone;
        }
      }

      // Effectuer la mise à jour
      await apiClient.put<ActorResponse>(
        `/actors/${operation.entityId}`,
        cleanPayload
      );
    } catch (err) {
      // Relancer l'erreur pour que le SyncService puisse la traiter
      throw err;
    }
  }

  /**
   * Gère la synchronisation de la gestion des producteurs d'un OPA
   * Délègue la logique différentielle au backend qui :
   * - Ajoute les nouveaux producteurs
   * - Supprime les producteurs absents
   * - Conserve les producteurs existants
   */
  private async handleManageProducerOpa(
    operation: PendingOperation
  ): Promise<void> {
    const { opaId, producerIds } = operation.payload as {
      opaId: string;
      producerIds: string[];
      localId?: string;
    };

    try {
      // Vérification de l'authentification
      if (!apiClient.getToken()) {
        throw new ApiError(
          SystemErrorCodes.UNAUTHORIZED,
          "Token d'authentification requis pour gérer les producteurs de l'OPA"
        );
      }

      console.log(
        `🔄 handleManageProducerOpa - Synchronisation pour OPA ${opaId} avec ${producerIds.length} producteurs`
      );

      // 1. Résoudre l'ID de l'OPA (localId → serverId)
      let opaInDb = await db.actors.where("serverId").equals(opaId).first();
      if (!opaInDb) {
        opaInDb = await db.actors.where("localId").equals(opaId).first();
      }

      if (!opaInDb) {
        throw new Error(`OPA ${opaId} non trouvé dans la base locale`);
      }

      // Utiliser serverId si disponible, sinon on ne peut pas synchroniser
      const opaServerId = opaInDb.serverId;
      if (!opaServerId) {
        throw new Error(
          `L'OPA ${opaId} n'a pas encore de serverId - synchroniser l'OPA d'abord`
        );
      }

      // 2. Résoudre les IDs des producteurs (localId → serverId)
      const resolvedProducerIds: string[] = [];

      for (const producerId of producerIds) {
        // Chercher le producteur dans la base locale
        let producerInDb = await db.actors
          .where("serverId")
          .equals(producerId)
          .first();

        if (!producerInDb) {
          producerInDb = await db.actors
            .where("localId")
            .equals(producerId)
            .first();
        }

        if (!producerInDb) {
          console.warn(
            `⚠️ Producteur ${producerId} non trouvé dans la base locale - ignoré`
          );
          continue;
        }

        // Vérifier que le producteur a un serverId
        if (!producerInDb.serverId) {
          console.warn(
            `⚠️ Producteur ${producerId} n'a pas de serverId - synchroniser d'abord - ignoré`
          );
          continue;
        }

        resolvedProducerIds.push(producerInDb.serverId);
      }

      console.log(
        `✅ Résolu ${resolvedProducerIds.length}/${producerIds.length} producteurs avec serverId`
      );

      // 3. Appeler l'endpoint backend avec les serverIds résolus
      // POST /actors/:opaServerId/producers (sans producerId dans l'URL)
      // Le body contient producerIds (tableau de serverIds)
      // Le backend détecte automatiquement et appelle manageOpaProducers() pour la logique différentielle
      const response = await apiClient.post<{
        opaId: string;
        producersCount: number;
      }>(`/actors/${opaServerId}/producers`, {
        producerIds: resolvedProducerIds, // Tableau de serverIds - le backend fait la logique différentielle
      });

      if (!response.success) {
        throw new Error(
          `Erreur lors de la gestion des producteurs de l'OPA ${opaServerId}`
        );
      }

      console.log(
        `✅ handleManageProducerOpa - Synchronisation terminée pour OPA ${opaServerId}:`,
        response.data
      );

      // 4. Mettre à jour les relations locales dans IndexedDB pour refléter le nouvel état
      // Utiliser les resolvedProducerIds (serverIds) pour la cohérence
      await this.updateLocalProducerOpaRelations(
        opaServerId,
        resolvedProducerIds
      );
    } catch (err) {
      console.error(
        `❌ handleManageProducerOpa - Erreur lors de la synchronisation pour OPA ${opaId}:`,
        err
      );
      // Relancer l'erreur pour que le SyncService puisse la traiter
      throw err;
    }
  }

  /**
   * Met à jour les relations Producer-OPA dans la base de données locale
   * pour refléter l'état après synchronisation
   */
  private async updateLocalProducerOpaRelations(
    opaId: string,
    producerIds: string[]
  ): Promise<void> {
    try {
      const timestamp = Date.now();

      // 1. Récupérer l'OPA depuis la base locale
      let opaInDb = await db.actors.where("serverId").equals(opaId).first();
      if (!opaInDb) {
        opaInDb = await db.actors.where("localId").equals(opaId).first();
      }

      if (!opaInDb) {
        console.warn(`⚠️ OPA ${opaId} non trouvé dans la base locale`);
        return;
      }

      // 2. Supprimer toutes les relations existantes pour cet OPA
      const deletedCount = await db.producerOpaRelations
        .where("opaServerId")
        .equals(opaInDb.serverId || "")
        .or("opaLocalId")
        .equals(opaInDb.localId || "")
        .delete();

      console.log(
        `🗑️ Supprimé ${deletedCount} anciennes relations pour OPA ${opaId}`
      );

      // 3. Créer les nouvelles relations pour chaque producteur (uniquement serverIds)
      const newRelations: ProducerOpaRelation[] = [];

      for (const producerId of producerIds) {
        // Chercher le producteur dans la base locale
        let producerInDb = await db.actors
          .where("serverId")
          .equals(producerId)
          .first();

        if (!producerInDb) {
          producerInDb = await db.actors
            .where("localId")
            .equals(producerId)
            .first();
        }

        if (!producerInDb) {
          console.warn(
            `⚠️ Producteur ${producerId} non trouvé dans la base locale - ignoré`
          );
          continue;
        }

        // On n'insère que les serverIds (après synchronisation)
        if (!producerInDb.serverId) {
          console.warn(`⚠️ Producteur ${producerId} sans serverId - ignoré`);
          continue;
        }

        if (!opaInDb.serverId) {
          console.warn(`⚠️ OPA ${opaId} sans serverId - relations non créées`);
          return;
        }

        newRelations.push({
          producerServerId: producerInDb.serverId,
          opaServerId: opaInDb.serverId,
          createdAt: new Date().toISOString(),
          syncedAt: timestamp,
        });
      }

      // 4. Insérer les nouvelles relations
      if (newRelations.length > 0) {
        await db.producerOpaRelations.bulkAdd(newRelations);
        console.log(
          `✅ Créé ${newRelations.length} nouvelles relations pour OPA ${opaId}`
        );
      } else {
        console.log(`ℹ️ Aucune nouvelle relation à créer pour OPA ${opaId}`);
      }
    } catch (error) {
      console.error(
        `❌ Erreur lors de la mise à jour des relations locales pour OPA ${opaId}:`,
        error
      );
      // Ne pas relancer l'erreur pour ne pas bloquer la synchronisation
      // Les relations seront re-synchronisées au prochain fetch
    }
  }

  /**
   * Gère la synchronisation des acheteurs mandataires d'un Exportateur
   */
  private async handleManageBuyerExporter(
    operation: PendingOperation
  ): Promise<void> {
    const { exporterId, buyerIds } = operation.payload as {
      exporterId: string;
      buyerIds: string[];
      localId?: string;
    };

    try {
      // Vérification de l'authentification
      if (!apiClient.getToken()) {
        throw new ApiError(
          SystemErrorCodes.UNAUTHORIZED,
          "Token d'authentification requis pour gérer les acheteurs de l'Exportateur"
        );
      }

      console.log(
        `🔄 handleManageBuyerExporter - Synchronisation pour Exportateur ${exporterId} avec ${buyerIds.length} acheteurs`
      );

      // 1. Résoudre l'ID de l'Exportateur (localId → serverId)
      let exporterInDb = await db.actors
        .where("serverId")
        .equals(exporterId)
        .first();
      if (!exporterInDb) {
        exporterInDb = await db.actors
          .where("localId")
          .equals(exporterId)
          .first();
      }

      if (!exporterInDb) {
        throw new Error(
          `Exportateur ${exporterId} non trouvé dans la base locale`
        );
      }

      // Utiliser serverId si disponible, sinon on ne peut pas synchroniser
      const exporterServerId = exporterInDb.serverId;
      if (!exporterServerId) {
        throw new Error(
          `L'Exportateur ${exporterId} n'a pas encore de serverId - synchroniser l'Exportateur d'abord`
        );
      }

      // 2. Résoudre les IDs des acheteurs (localId → serverId)
      const resolvedBuyerIds: string[] = [];

      for (const buyerId of buyerIds) {
        // Chercher l'acheteur dans la base locale
        let buyerInDb = await db.actors
          .where("serverId")
          .equals(buyerId)
          .first();

        if (!buyerInDb) {
          buyerInDb = await db.actors.where("localId").equals(buyerId).first();
        }

        if (!buyerInDb) {
          console.warn(
            `⚠️ Acheteur ${buyerId} non trouvé dans la base locale - ignoré`
          );
          continue;
        }

        // Vérifier que l'acheteur a un serverId
        if (!buyerInDb.serverId) {
          console.warn(
            `⚠️ Acheteur ${buyerId} n'a pas de serverId - synchroniser d'abord - ignoré`
          );
          continue;
        }

        resolvedBuyerIds.push(buyerInDb.serverId);
      }

      console.log(
        `✅ Résolu ${resolvedBuyerIds.length}/${buyerIds.length} acheteurs avec serverId`
      );

      // 3. Appeler l'endpoint backend avec les serverIds résolus
      // POST /actors/:exporterServerId/buyers (sans buyerId dans l'URL)
      // Le body contient buyerIds (tableau de serverIds)
      // Le backend détecte automatiquement et appelle la logique différentielle
      const response = await apiClient.post<{
        exporterId: string;
        buyersCount: number;
      }>(`/actors/${exporterServerId}/buyers`, {
        buyerIds: resolvedBuyerIds, // Tableau de serverIds - le backend fait la logique différentielle
      });

      if (!response.success) {
        throw new Error(
          `Erreur lors de la gestion des acheteurs de l'Exportateur ${exporterServerId}`
        );
      }

      console.log(
        `✅ handleManageBuyerExporter - Synchronisation terminée pour Exportateur ${exporterServerId}:`,
        response.data
      );

      // 4. Mettre à jour les relations locales dans IndexedDB pour refléter le nouvel état
      // Utiliser les resolvedBuyerIds (serverIds) pour la cohérence
      await this.updateLocalBuyerExporterRelations(
        exporterServerId,
        resolvedBuyerIds
      );
    } catch (err) {
      console.error(
        `❌ handleManageBuyerExporter - Erreur lors de la synchronisation pour Exportateur ${exporterId}:`,
        err
      );
      // Relancer l'erreur pour que le SyncService puisse la traiter
      throw err;
    }
  }

  /**
   * Met à jour les relations Buyer-Exporter dans la base de données locale
   * pour refléter l'état après synchronisation
   */
  private async updateLocalBuyerExporterRelations(
    exporterId: string,
    buyerIds: string[]
  ): Promise<void> {
    try {
      const timestamp = Date.now();

      // 1. Récupérer l'Exportateur depuis la base locale
      let exporterInDb = await db.actors
        .where("serverId")
        .equals(exporterId)
        .first();
      if (!exporterInDb) {
        exporterInDb = await db.actors
          .where("localId")
          .equals(exporterId)
          .first();
      }

      if (!exporterInDb) {
        console.warn(
          `⚠️ Exportateur ${exporterId} non trouvé dans la base locale lors de la mise à jour des relations`
        );
        return;
      }

      // 2. Supprimer toutes les anciennes relations pour cet exportateur
      await db.exporterMandates
        .where("exporterServerId")
        .equals(exporterId)
        .or("exporterLocalId")
        .equals(exporterId)
        .delete();

      // 3. Créer les nouvelles relations
      const newRelations: ExporterMandateRelation[] = [];

      for (const buyerId of buyerIds) {
        // Chercher l'acheteur dans la base locale
        let buyerInDb = await db.actors
          .where("serverId")
          .equals(buyerId)
          .first();
        if (!buyerInDb) {
          buyerInDb = await db.actors.where("localId").equals(buyerId).first();
        }

        if (!buyerInDb) {
          console.warn(
            `⚠️ Acheteur ${buyerId} non trouvé localement lors de la mise à jour des relations - ignoré`
          );
          continue;
        }

        newRelations.push({
          exporterServerId: exporterInDb.serverId || undefined,
          exporterLocalId: exporterInDb.localId || undefined,
          buyerServerId: buyerInDb.serverId || undefined,
          buyerLocalId: buyerInDb.localId || undefined,
          createdAt: new Date().toISOString(),
          syncedAt: timestamp,
        });
      }

      if (newRelations.length > 0) {
        await db.exporterMandates.bulkAdd(newRelations);
        console.log(
          `✅ ${newRelations.length} relations Buyer-Exporter mises à jour localement pour Exportateur ${exporterId}`
        );
      }
    } catch (error) {
      console.error(
        `❌ Erreur lors de la mise à jour des relations locales pour Exportateur ${exporterId}:`,
        error
      );
      // Ne pas relancer l'erreur pour ne pas bloquer la synchronisation
      // Les relations seront re-synchronisées au prochain fetch
    }
  }

  /**
   * Met à jour le statut d'un acteur (active ou inactive)
   */
  async updateStatus(id: string, status: "active" | "inactive"): Promise<void> {
    try {
      if (!apiClient.getToken()) {
        throw new ApiError(
          SystemErrorCodes.UNAUTHORIZED,
          "Token d'authentification requis pour modifier le statut de l'acteur"
        );
      }

      const response = await apiClient.patch<ActorResponse>(
        `/actors/${id}/status`,
        { status }
      );

      if (!response.success || !response.data) {
        throw new Error(
          "Erreur serveur lors de la mise à jour du statut de l'acteur."
        );
      }

      const successMessage =
        status === "active"
          ? i18n.t("actor:messages.actorActivated")
          : i18n.t("actor:messages.actorDeactivated");

      showSuccess(successMessage);
    } catch (error) {
      const errorMessage =
        status === "active"
          ? i18n.t("actor:errors.activationFailed")
          : i18n.t("actor:errors.deactivationFailed");

      showError(errorMessage);

      if (error instanceof ApiError) {
        throw error;
      }

      throw new ApiError(
        SystemErrorCodes.INTERNAL_ERROR,
        "Erreur lors de la mise à jour du statut de l'acteur"
      );
    }
  }

  /**
   * Ajoute un producteur à un OPA
   */
  async addProducerToOpa(opaId: string, producerId: string): Promise<void> {
    try {
      if (!apiClient.getToken()) {
        throw new ApiError(
          SystemErrorCodes.UNAUTHORIZED,
          "Token d'authentification requis pour ajouter un producteur à l'OPA"
        );
      }

      const response = await apiClient.post<void>(
        `/actors/${opaId}/producers/${producerId}`,
        {}
      );

      if (!response.success) {
        throw new Error("Erreur lors de l'ajout du producteur à l'OPA");
      }

      showSuccess(i18n.t("actor:messages.producerAddedToOpa"));
    } catch (error) {
      showError(i18n.t("actor:errors.addProducerToOpaFailed"));

      if (error instanceof ApiError) {
        throw error;
      }

      throw new ApiError(
        SystemErrorCodes.INTERNAL_ERROR,
        "Erreur lors de l'ajout du producteur à l'OPA"
      );
    }
  }

  /**
   * Ajoute plusieurs producteurs à un OPA en une seule requête
   */
  async addProducersToOpaBulk(
    data: {
      opaId: string;
      producerIds: string[];
    },
    editOffline?: boolean,
    entityId?: string
  ): Promise<void> {
    const { opaId, producerIds } = data;
    const localId = entityId || opaId;
    const timestamp = Date.now();

    const userId = await this.getCurrentUserId();

    if (!userId) {
      throw new Error(
        "Utilisateur non connecté - impossible d'ajouter des producteurs sans userId"
      );
    }

    // Mode OFFLINE : Chercher une pending operation existante ou en créer une nouvelle
    if (editOffline) {
      // 1. Récupérer la pendingOperation par entityId
      const existingPendingOp = await db.pendingOperations
        .where("entityId")
        .equals(localId)
        .first();

      // 2. Récupérer l'OPA local (par serverId ou localId avec index)
      let opaInDb = await db.actors.where("serverId").equals(opaId).first();

      if (!opaInDb) {
        opaInDb = await db.actors.where("localId").equals(opaId).first();
      }

      if (!opaInDb) {
        throw new Error(`OPA avec ID ${opaId} introuvable dans la base locale`);
      }

      // 3. Vérifier si l'OPA ou les producteurIds ont changé
      const opaChanged = existingPendingOp
        ? existingPendingOp.payload.opaId !== opaId
        : true;
      const existingProducerIds =
        (existingPendingOp?.payload.producerIds as string[] | undefined) || [];
      const producerIdsChanged =
        JSON.stringify([...existingProducerIds].sort()) !==
        JSON.stringify([...producerIds].sort());

      // 4. Si l'OPA ou les producteurIds ont changé, mettre à jour les relations
      let relationIds: (number | undefined)[] = [];

      if (opaChanged || producerIdsChanged) {
        // Supprimer toutes les relations existantes pour cet OPA (remplacement complet)
        const existingRelations = await db.producerOpaRelations
          .where(opaInDb.serverId ? "opaServerId" : "opaLocalId")
          .equals(opaInDb.serverId || opaInDb.localId!)
          .toArray();

        // Supprimer les anciennes relations
        if (existingRelations.length > 0) {
          const idsToDelete = existingRelations
            .map((rel) => rel.id!)
            .filter(Boolean);
          if (idsToDelete.length > 0) {
            await db.producerOpaRelations.bulkDelete(idsToDelete);
            console.log(
              `🗑️ ${idsToDelete.length} anciennes relations supprimées pour OPA ${opaId}`
            );
          }
        }

        // Ajouter les nouvelles relations Producer-OPA localement
        const producerOpaRelations: ProducerOpaRelation[] = [];

        for (const producerId of producerIds) {
          // Chercher d'abord par serverId (index)
          let producerInDb = await db.actors
            .where("serverId")
            .equals(producerId)
            .first();

          // Si non trouvé, chercher par localId (index)
          if (!producerInDb) {
            producerInDb = await db.actors
              .where("localId")
              .equals(producerId)
              .first();
          }

          if (!producerInDb) {
            console.warn(
              `Producteur ${producerId} introuvable localement, ignoré`
            );
            continue;
          }

          producerOpaRelations.push({
            producerServerId: producerInDb.serverId || undefined,
            producerLocalId: producerInDb.localId || undefined,
            opaServerId: opaInDb.serverId || undefined,
            opaLocalId: opaInDb.localId || undefined,
            createdAt: new Date().toISOString(),
            syncedAt: timestamp,
          });
        }

        if (producerOpaRelations.length > 0) {
          relationIds = await db.producerOpaRelations.bulkAdd(
            producerOpaRelations,
            {
              allKeys: true,
            }
          );
          console.log(
            `✅ ${producerOpaRelations.length} relations Producer-OPA créées localement`
          );
        }
      } else {
        // Si rien n'a changé, réutiliser les relationIds existants
        relationIds =
          (existingPendingOp?.payload.relationIds as number[]) || [];
      }

      // 5. Créer ou mettre à jour la pendingOperation
      const operationPayload = {
        opaId,
        producerIds,
        localId,
        relationIds: relationIds.filter((id): id is number => id !== undefined),
      };

      if (existingPendingOp) {
        // Mettre à jour la pendingOperation existante
        await db.pendingOperations.update(existingPendingOp.id!, {
          payload: {
            ...existingPendingOp.payload,
            ...operationPayload,
          },
          timestamp,
        });
        console.log(
          `🔄 PendingOperation ${existingPendingOp.id} mise à jour pour entityId ${localId}`
        );
      } else {
        // Créer une nouvelle pendingOperation
        const operation: PendingOperation = {
          entityId: localId,
          entityType: "actor",
          operation: "update_producer_opa",
          payload: operationPayload,
          timestamp,
          retries: 0,
          userId,
        };
        await this.syncService.queueOperation(operation, userId);
        console.log(
          `✅ Nouvelle PendingOperation créée pour entityId ${localId}`
        );
      }

      showSuccess(
        i18n.t("actor:messages.producersAddedToOpa", {
          count: producerIds.length,
        })
      );

      return;
    }

    // Ajouter les relations localement aussi en mode online
    // pour que l'utilisateur voie immédiatement les changements
    const opaInDb = await db.actors
      .filter((a) => a.serverId === opaId || a.localId === opaId)
      .first();

    let relationIds: (number | undefined)[] = [];

    if (opaInDb) {
      const producerOpaRelations: ProducerOpaRelation[] = [];

      for (const producerId of producerIds) {
        // Chercher d'abord par serverId (index)
        let producerInDb = await db.actors
          .where("serverId")
          .equals(producerId)
          .first();

        // Si non trouvé, chercher par localId (index)
        if (!producerInDb) {
          producerInDb = await db.actors
            .where("localId")
            .equals(producerId)
            .first();
        }

        if (!producerInDb) continue;

        // Vérifier si la relation existe déjà
        const existingRelation = await db.producerOpaRelations
          .where("[producerServerId+opaServerId]")
          .equals([producerInDb.serverId || "", opaInDb.serverId || ""])
          .or("[producerLocalId+opaLocalId]")
          .equals([producerInDb.localId || "", opaInDb.localId || ""])
          .first();

        if (existingRelation) continue;

        producerOpaRelations.push({
          producerServerId: producerInDb.serverId || undefined,
          producerLocalId: producerInDb.localId || undefined,
          opaServerId: opaInDb.serverId || undefined,
          opaLocalId: opaInDb.localId || undefined,
          createdAt: new Date().toISOString(),
          syncedAt: timestamp,
        });
      }

      if (producerOpaRelations.length > 0) {
        relationIds = await db.producerOpaRelations.bulkAdd(
          producerOpaRelations,
          {
            allKeys: true,
          }
        );
      }
    }

    // Créer une nouvelle pending operation
    const operation: PendingOperation = {
      entityId: localId, // ID de l'OPA (serverId ou localId)
      entityType: "actor",
      operation: "update_producer_opa",
      payload: {
        opaId,
        producerIds,
        localId,
        relationIds: relationIds.filter((id): id is number => id !== undefined),
      },
      timestamp,
      retries: 0,
      userId,
    };

    await this.syncService.queueOperation(operation, userId);

    showSuccess(
      i18n.t("actor:messages.producersAddedToOpa", {
        count: producerIds.length,
      })
    );
  }

  /**
   * Ajoute plusieurs acheteurs à un Exportateur en une seule requête
   */
  async addBuyersToExporterBulk(
    data: {
      exporterId: string;
      buyerIds: string[];
    },
    editOffline?: boolean,
    entityId?: string
  ): Promise<void> {
    const { exporterId, buyerIds } = data;
    const localId = entityId || exporterId;
    const timestamp = Date.now();

    const userId = await this.getCurrentUserId();

    if (!userId) {
      throw new Error(
        "Utilisateur non connecté - impossible d'ajouter des acheteurs sans userId"
      );
    }

    // Mode OFFLINE : Chercher une pending operation existante ou en créer une nouvelle
    if (editOffline) {
      // 1. Récupérer la pendingOperation par entityId
      const existingPendingOp = await db.pendingOperations
        .where("entityId")
        .equals(localId)
        .first();

      // 2. Récupérer l'Exportateur local (par serverId ou localId avec index)
      let exporterInDb = await db.actors
        .where("serverId")
        .equals(exporterId)
        .first();

      if (!exporterInDb) {
        exporterInDb = await db.actors
          .where("localId")
          .equals(exporterId)
          .first();
      }

      if (!exporterInDb) {
        throw new Error(
          `Exportateur avec ID ${exporterId} introuvable dans la base locale`
        );
      }

      // 3. Vérifier si l'Exportateur ou les buyerIds ont changé
      const exporterChanged = existingPendingOp
        ? existingPendingOp.payload.exporterId !== exporterId
        : true;
      const existingBuyerIds =
        (existingPendingOp?.payload.buyerIds as string[] | undefined) || [];
      const buyerIdsChanged =
        JSON.stringify([...existingBuyerIds].sort()) !==
        JSON.stringify([...buyerIds].sort());

      // 4. Si l'Exportateur ou les buyerIds ont changé, mettre à jour les relations
      let relationIds: (number | undefined)[] = [];

      if (exporterChanged || buyerIdsChanged) {
        // Supprimer toutes les relations existantes pour cet Exportateur (remplacement complet)
        const existingRelations = await db.exporterMandates
          .where(exporterInDb.serverId ? "exporterServerId" : "exporterLocalId")
          .equals(exporterInDb.serverId || exporterInDb.localId!)
          .toArray();

        // Supprimer les anciennes relations
        if (existingRelations.length > 0) {
          const idsToDelete = existingRelations
            .map((rel) => rel.id!)
            .filter(Boolean);
          if (idsToDelete.length > 0) {
            await db.exporterMandates.bulkDelete(idsToDelete);
            console.log(
              `🗑️ ${idsToDelete.length} anciennes relations supprimées pour Exportateur ${exporterId}`
            );
          }
        }

        // Ajouter les nouvelles relations Buyer-Exporter localement
        const exporterMandates: ExporterMandateRelation[] = [];

        for (const buyerId of buyerIds) {
          // Chercher d'abord par serverId (index)
          let buyerInDb = await db.actors
            .where("serverId")
            .equals(buyerId)
            .first();

          // Si non trouvé, chercher par localId (index)
          if (!buyerInDb) {
            buyerInDb = await db.actors
              .where("localId")
              .equals(buyerId)
              .first();
          }

          if (!buyerInDb) {
            console.warn(`Acheteur ${buyerId} introuvable localement, ignoré`);
            continue;
          }

          exporterMandates.push({
            buyerServerId: buyerInDb.serverId || undefined,
            buyerLocalId: buyerInDb.localId || undefined,
            exporterServerId: exporterInDb.serverId || undefined,
            exporterLocalId: exporterInDb.localId || undefined,
            createdAt: new Date().toISOString(),
            syncedAt: timestamp,
          });
        }

        if (exporterMandates.length > 0) {
          relationIds = await db.exporterMandates.bulkAdd(exporterMandates, {
            allKeys: true,
          });
          console.log(
            `✅ ${exporterMandates.length} relations Buyer-Exporter créées localement`
          );
        }
      } else {
        // Si rien n'a changé, réutiliser les relationIds existants
        relationIds =
          (existingPendingOp?.payload.relationIds as number[]) || [];
      }

      // 5. Créer ou mettre à jour la pendingOperation
      const operationPayload = {
        exporterId,
        buyerIds,
        localId,
        relationIds: relationIds.filter((id): id is number => id !== undefined),
      };

      if (existingPendingOp) {
        // Mettre à jour la pendingOperation existante
        await db.pendingOperations.update(existingPendingOp.id!, {
          payload: {
            ...existingPendingOp.payload,
            ...operationPayload,
          },
          timestamp,
        });
        console.log(
          `🔄 PendingOperation ${existingPendingOp.id} mise à jour pour entityId ${localId}`
        );
      } else {
        // Créer une nouvelle pendingOperation
        const operation: PendingOperation = {
          entityId: localId,
          entityType: "actor",
          operation: "update_producer_opa" as const,
          payload: operationPayload,
          timestamp,
          retries: 0,
          userId,
        };
        await this.syncService.queueOperation(operation, userId);
        console.log(
          `✅ Nouvelle PendingOperation créée pour entityId ${localId}`
        );
      }

      showSuccess(
        i18n.t("actor:messages.buyersAddedToExporter", {
          count: buyerIds.length,
        })
      );

      return;
    }

    // Ajouter les relations localement aussi en mode online
    // pour que l'utilisateur voie immédiatement les changements
    const exporterInDb = await db.actors
      .filter((a) => a.serverId === exporterId || a.localId === exporterId)
      .first();

    let relationIds: (number | undefined)[] = [];

    if (exporterInDb) {
      const exporterMandates: ExporterMandateRelation[] = [];

      for (const buyerId of buyerIds) {
        // Chercher d'abord par serverId (index)
        let buyerInDb = await db.actors
          .where("serverId")
          .equals(buyerId)
          .first();

        // Si non trouvé, chercher par localId (index)
        if (!buyerInDb) {
          buyerInDb = await db.actors.where("localId").equals(buyerId).first();
        }

        if (!buyerInDb) continue;

        // Vérifier si la relation existe déjà
        const existingRelation = await db.exporterMandates
          .where("[buyerServerId+exporterServerId]")
          .equals([buyerInDb.serverId || "", exporterInDb.serverId || ""])
          .or("[buyerLocalId+exporterLocalId]")
          .equals([buyerInDb.localId || "", exporterInDb.localId || ""])
          .first();

        if (existingRelation) continue;

        exporterMandates.push({
          buyerServerId: buyerInDb.serverId || undefined,
          buyerLocalId: buyerInDb.localId || undefined,
          exporterServerId: exporterInDb.serverId || undefined,
          exporterLocalId: exporterInDb.localId || undefined,
          createdAt: new Date().toISOString(),
          syncedAt: timestamp,
        });
      }

      if (exporterMandates.length > 0) {
        relationIds = await db.exporterMandates.bulkAdd(exporterMandates, {
          allKeys: true,
        });
      }
    }

    // Créer une nouvelle pending operation
    const operation: PendingOperation = {
      entityId: localId, // ID de l'Exportateur (serverId ou localId)
      entityType: "actor",
      operation: "update_producer_opa" as const,
      payload: {
        exporterId,
        buyerIds,
        localId,
        relationIds: relationIds.filter((id): id is number => id !== undefined),
      },
      timestamp,
      retries: 0,
      userId,
    };

    await this.syncService.queueOperation(operation, userId);

    showSuccess(
      i18n.t("actor:messages.buyersAddedToExporter", {
        count: buyerIds.length,
      })
    );
  }

  /**
   * Retire un producteur d'un OPA
   */
  async removeProducerFromOpa(
    opaId: string,
    producerId: string
  ): Promise<void> {
    try {
      if (!apiClient.getToken()) {
        throw new ApiError(
          SystemErrorCodes.UNAUTHORIZED,
          "Token d'authentification requis pour retirer un producteur de l'OPA"
        );
      }

      const response = await apiClient.delete<void>(
        `/actors/${opaId}/producers/${producerId}`
      );

      if (!response.success) {
        throw new Error("Erreur lors du retrait du producteur de l'OPA");
      }

      showSuccess(i18n.t("actor:messages.producerRemovedFromOpa"));
    } catch (error) {
      showError(i18n.t("actor:errors.removeProducerFromOpaFailed"));

      if (error instanceof ApiError) {
        throw error;
      }

      throw new ApiError(
        SystemErrorCodes.INTERNAL_ERROR,
        "Erreur lors du retrait du producteur de l'OPA"
      );
    }
  }

  /**
   * Récupère les OPA d'un producteur avec pagination
   */
  async getProducerOpas(
    producerId: string,
    page: number,
    limit: number
  ): Promise<GetActorsResult> {
    try {
      const response = await apiClient.get<PaginatedActorsResponse>(
        `/producers/${producerId}/opas?page=${page}&limit=${limit}`
      );

      if (!response.success || !response.data) {
        throw new Error("Erreur lors de la récupération des OPA du producteur");
      }

      const actors = response.data.data.map((actorData) =>
        this.mapResponseToActor(actorData)
      );

      return {
        actors,
        meta: response.data.meta,
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      throw new ApiError(
        SystemErrorCodes.INTERNAL_ERROR,
        "Erreur lors de la récupération des OPA du producteur"
      );
    }
  }

  /**
   * Récupère les producteurs d'un OPA avec pagination
   */
  async getOpaProducers(
    opaId: string,
    page: number,
    limit: number
  ): Promise<GetActorsResult> {
    try {
      const response = await apiClient.get<PaginatedActorsResponse>(
        `/opas/${opaId}/producers?page=${page}&limit=${limit}`
      );

      if (!response.success || !response.data) {
        throw new Error(
          "Erreur lors de la récupération des producteurs de l'OPA"
        );
      }

      const actors = response.data.data.map((actorData) =>
        this.mapResponseToActor(actorData)
      );

      return {
        actors,
        meta: response.data.meta,
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      throw new ApiError(
        SystemErrorCodes.INTERNAL_ERROR,
        "Erreur lors de la récupération des producteurs de l'OPA"
      );
    }
  }

  async getBuyerExporters(
    buyerId: string,
    page: number,
    limit: number
  ): Promise<GetActorsResult> {
    try {
      const response = await apiClient.get<PaginatedActorsResponse>(
        `/buyers/${buyerId}/exporters?page=${page}&limit=${limit}`
      );

      if (!response.success || !response.data) {
        throw new Error(
          "Erreur lors de la récupération des exportateurs de l'acheteur"
        );
      }

      const actors = response.data.data.map((actorData) =>
        this.mapResponseToActor(actorData)
      );

      return {
        actors,
        meta: response.data.meta,
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      throw new ApiError(
        SystemErrorCodes.INTERNAL_ERROR,
        "Erreur lors de la récupération des exportateurs de l'acheteur"
      );
    }
  }

  /**
   * Récupère tous les acheteurs mandataires d'un exportateur
   */
  async getExporterBuyers(
    exporterId: string,
    page: number,
    limit: number
  ): Promise<GetActorsResult> {
    try {
      const response = await apiClient.get<PaginatedActorsResponse>(
        `/exporters/${exporterId}/buyers?page=${page}&limit=${limit}`
      );

      if (!response.success || !response.data) {
        throw new Error(
          "Erreur lors de la récupération des acheteurs de l'exportateur"
        );
      }

      const actors = response.data.data.map((actorData) =>
        this.mapResponseToActor(actorData)
      );

      return {
        actors,
        meta: response.data.meta,
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      throw new ApiError(
        SystemErrorCodes.INTERNAL_ERROR,
        "Erreur lors de la récupération des acheteurs de l'exportateur"
      );
    }
  }

  /**
   * Ajoute un acheteur en tant que mandataire d'un exportateur
   */
  async addBuyerToExporter(exporterId: string, buyerId: string): Promise<void> {
    try {
      if (!apiClient.getToken()) {
        throw new ApiError(
          SystemErrorCodes.UNAUTHORIZED,
          "Token d'authentification requis pour ajouter un acheteur à l'exportateur"
        );
      }

      const response = await apiClient.post<void>(
        `/actors/${exporterId}/buyers/${buyerId}`,
        {}
      );

      if (!response.success) {
        throw new Error("Erreur lors de l'ajout de l'acheteur à l'exportateur");
      }

      showSuccess(i18n.t("actor:messages.buyerAddedToExporter"));
    } catch (error) {
      showError(i18n.t("actor:errors.addBuyerToExporterFailed"));

      if (error instanceof ApiError) {
        throw error;
      }

      throw new ApiError(
        SystemErrorCodes.INTERNAL_ERROR,
        "Erreur lors de l'ajout de l'acheteur à l'exportateur"
      );
    }
  }

  /**
   * Retire un acheteur en tant que mandataire d'un exportateur
   */
  async removeBuyerFromExporter(
    exporterId: string,
    buyerId: string
  ): Promise<void> {
    try {
      if (!apiClient.getToken()) {
        throw new ApiError(
          SystemErrorCodes.UNAUTHORIZED,
          "Token d'authentification requis pour retirer un acheteur de l'exportateur"
        );
      }

      const response = await apiClient.delete<void>(
        `/actors/${exporterId}/buyers/${buyerId}`
      );

      if (!response.success) {
        throw new Error(
          "Erreur lors du retrait de l'acheteur de l'exportateur"
        );
      }

      showSuccess(i18n.t("actor:messages.buyerRemovedFromExporter"));
    } catch (error) {
      showError(i18n.t("actor:errors.removeBuyerFromExporterFailed"));

      if (error instanceof ApiError) {
        throw error;
      }

      throw new ApiError(
        SystemErrorCodes.INTERNAL_ERROR,
        "Erreur lors du retrait de l'acheteur de l'exportateur"
      );
    }
  }

  /**
   * Récupère les productions d'un producteur
   */
  async getProducerProductions(
    producerId: string,
    opaId?: string,
    campaignId?: string
  ): Promise<ProducerProductionsResponse> {
    try {
      // Construire l'URL avec les paramètres
      let url = `/producers/${producerId}/productions`;
      const params = new URLSearchParams();
      if (opaId) params.append("opaId", opaId);
      if (campaignId) params.append("campaignId", campaignId);
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      // Appel API
      const response = await apiClient.get<ProducerProductionsResponse>(url);

      if (!response.success || !response.data) {
        throw new Error("Réponse API invalide pour getProducerProductions");
      }

      return response.data;
    } catch (error) {
      console.error("❌ Erreur lors de getProducerProductions:", error);
      throw error;
    }
  }

  /**
   * Récupère les collectes d'un OPA
   */
  async getOpaCollections(
    opaId: string,
    campaignId?: string
  ): Promise<OpaCollectionsResponse> {
    try {
      // Construire l'URL avec les paramètres
      let url = `/opas/${opaId}/collections`;
      const params = new URLSearchParams();
      if (campaignId) params.append("campaignId", campaignId);
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      // Appel API
      const response = await apiClient.get<OpaCollectionsResponse>(url);

      if (!response.success || !response.data) {
        throw new Error("Réponse API invalide pour getOpaCollections");
      }

      return response.data;
    } catch (error) {
      console.error("❌ Erreur lors de getOpaCollections:", error);
      throw error;
    }
  }

  /**
   * Vérifie si l'utilisateur actuel a un rôle autorisé pour synchroniser les acteurs
   * @returns true si l'utilisateur a le rôle basin_admin ou field_agent
   */
  private hasAuthorizedRole(): boolean {
    const { user } = useAuthStore.getState();
    if (!user) return false;

    // Autoriser uniquement basin_admin et field_agent (pas technical_admin)
    return (
      user.role === USER_ROLES_CONSTANTS.BASIN_ADMIN ||
      user.role === USER_ROLES_CONSTANTS.FIELD_AGENT
    );
  }

  /**
   * Synchronise les acteurs depuis l'API vers la base locale
   * @param isInitialSync - true pour sync initiale (tous les acteurs), false pour sync incrémentale (uniquement les modifications)
   */
  private async syncFromApi(isInitialSync: boolean = false): Promise<void> {
    try {
      let actors: ActorWithSync[];

      if (isInitialSync) {
        // ⭐ SYNC INITIALE - Récupérer tous les acteurs
        const response = await apiClient.get<{
          actors: ActorWithSync[];
          total: number;
          syncedAt: number;
        }>("/actors/sync/all");

        if (!response.success || !response.data) {
          throw new Error("Réponse API invalide pour la sync initiale");
        }

        actors = response.data.actors;

        // ✅ Récupérer les acteurs offline (localId uniquement) avant le clear
        const offlineActors = await db.actors
          .filter((actor) => !!actor.localId && !actor.id)
          .toArray();

        // Vider la table locale pour la sync initiale
        await db.actors.clear();

        // Mapper les acteurs du serveur
        const offlineData: OfflineActorData[] = actors.map((actor) => ({
          serverId: actor.id, // Les données du serveur ont un serverId
          localId: undefined, // Pas de localId pour les données venant du serveur
          actorType: actor.actorType,
          familyName: actor.familyName,
          givenName: actor.givenName,
          // Convertir "pending" en "active" car OfflineActorData n'accepte que "active" | "inactive"
          status:
            actor.status === "pending" ? "active" : actor.status || undefined,
          onccId: actor.onccId,
          stores: actor.stores?.map((store) => ({
            id: store.id,
            name: store.name,
            code: store.code,
            status: store.status,
          })),
          // ⚠️ Les calendriers sont maintenant synchronisés indépendamment via CalendarRepository
          // ⚠️ Les relations many-to-many sont maintenant dans des tables séparées
          // Pas de mapping de buyers, producers, mandators, opas ici
          createdAt: actor.createdAt || new Date().toISOString(),
          updatedAt: actor.updatedAt || new Date().toISOString(),
          syncedAt: Date.now(),
        }));

        // ✅ Fusionner avec les acteurs offline préservés
        const allActors = [...offlineData, ...offlineActors];

        // Dédupliquer par serverId/localId (utiliser serverId en priorité, sinon localId)
        const uniqueOfflineData = Array.from(
          new Map(
            allActors.map((actor) => [actor.serverId || actor.localId, actor])
          ).values()
        );

        await db.actors.bulkPut(uniqueOfflineData);
        console.log(
          `✅ Sync initiale: ${offlineData.length} acteurs du serveur + ${offlineActors.length} acteurs offline préservés`
        );

        // 1. Extraire et stocker les relations Producer ↔ OPA (avec vérification anti-doublons)
        const producerOpaRelationsToAdd: ProducerOpaRelation[] = [];
        for (const actor of actors) {
          if (actor.actorType === "PRODUCERS" && actor.producers) {
            // OPA → Producers
            for (const producer of actor.producers) {
              // Vérifier si la relation existe déjà (utiliser l'index composé)
              const existingRelation = await db.producerOpaRelations
                .where("[producerServerId+opaServerId]")
                .equals([producer.id, actor.id])
                .first();

              // Si la relation n'existe pas, l'ajouter
              if (!existingRelation) {
                producerOpaRelationsToAdd.push({
                  producerServerId: producer.id, // ID du producteur (vient du serveur)
                  producerLocalId: undefined,
                  opaServerId: actor.id, // ID de l'OPA (vient du serveur)
                  opaLocalId: undefined,
                  createdAt: new Date().toISOString(),
                  syncedAt: Date.now(),
                });
              }
            }
          }
        }

        // 3. Extraire et stocker les relations Exporter ↔ Buyer (avec vérification anti-doublons)
        const exporterMandatesToAdd: ExporterMandateRelation[] = [];
        for (const actor of actors) {
          if (actor.actorType === "EXPORTER" && actor.buyers) {
            // Exporter → Buyers
            for (const buyer of actor.buyers) {
              // Vérifier si la relation existe déjà
              const existingMandate = await db.exporterMandates
                .where("exporterServerId")
                .equals(actor.id)
                .and((rel) => rel.buyerServerId === buyer.id)
                .first();

              // Si la relation n'existe pas, l'ajouter
              if (!existingMandate) {
                exporterMandatesToAdd.push({
                  exporterServerId: actor.id, // ID de l'exportateur
                  exporterLocalId: undefined,
                  buyerServerId: buyer.id, // ID du buyer
                  buyerLocalId: undefined,
                  createdAt: new Date().toISOString(),
                  syncedAt: Date.now(),
                });
              }
            }
          }
        }

        // 4. Stocker dans les tables de relations (uniquement les nouvelles)
        if (producerOpaRelationsToAdd.length > 0) {
          await db.producerOpaRelations.bulkAdd(producerOpaRelationsToAdd);
          console.log(
            `✅ ${producerOpaRelationsToAdd.length} nouvelles relations Producer-OPA ajoutées`
          );
        }
        if (exporterMandatesToAdd.length > 0) {
          await db.exporterMandates.bulkAdd(exporterMandatesToAdd);
          console.log(
            `✅ ${exporterMandatesToAdd.length} nouveaux mandats Exporter-Buyer ajoutés`
          );
        }
      } else {
        // ⭐ SYNC INCRÉMENTALE - Récupérer uniquement les acteurs modifiés
        const lastSyncTime = this.getLastSyncTime();

        if (lastSyncTime === 0) {
          console.log("⚠️ lastSyncTime est 0, basculement vers sync initiale");
          return this.syncFromApi(true);
        }

        const response = await apiClient.get<{
          actors: ActorResponse[];
          total: number;
          since: number;
          syncedAt: number;
        }>(`/actors/sync/updates?since=${lastSyncTime}`);

        if (!response.success || !response.data) {
          throw new Error("Réponse API invalide pour la sync incrémentale");
        }

        actors = response.data.actors;

        // ✅ MISE À JOUR SÉLECTIVE - Fusionner avec les données locales existantes
        const updatedActors: OfflineActorData[] = [];

        for (const serverActor of actors) {
          // Récupérer l'acteur local existant par son serverId (utiliser where() pour exploiter l'index)
          const localActor = await db.actors
            .where("serverId")
            .equals(serverActor.id)
            .first();

          if (localActor) {
            // ✅ L'acteur existe localement → Fusionner les données du serveur avec les données locales
            updatedActors.push({
              ...localActor, // Préserver toutes les données locales existantes (dont l'id primaire)
              // Écraser avec les nouvelles données du serveur
              serverId: serverActor.id,
              actorType: serverActor.actorType,
              familyName: serverActor.familyName,
              givenName: serverActor.givenName,
              // Convertir "pending" en "active" car OfflineActorData n'accepte que "active" | "inactive"
              status:
                serverActor.status === "pending"
                  ? "active"
                  : serverActor.status || undefined,
              onccId: serverActor.onccId,
              stores: serverActor.stores?.map((store) => ({
                id: store.id,
                name: store.name,
                code: store.code,
                status: store.status,
              })),
              // ⚠️ Les calendriers sont dans db.calendars (sync via CalendarRepository)
              // ⚠️ Les relations many-to-many sont dans producerOpaRelations et exporterMandates
              syncedAt: Date.now(),
            });
          } else {
            // ✅ L'acteur n'existe pas localement → Créer un nouvel acteur avec les données du serveur
            updatedActors.push({
              serverId: serverActor.id, // Données venant du serveur = serverId
              localId: undefined, // Pas de localId car nouvel acteur du serveur
              actorType: serverActor.actorType,
              familyName: serverActor.familyName,
              givenName: serverActor.givenName,
              // Convertir "pending" en "active" car OfflineActorData n'accepte que "active" | "inactive"
              status:
                serverActor.status === "pending"
                  ? "active"
                  : serverActor.status || undefined,
              onccId: serverActor.onccId,
              stores: serverActor.stores?.map((store) => ({
                id: store.id,
                name: store.name,
                code: store.code,
                status: store.status,
              })),
              // ⚠️ Les calendriers sont dans db.calendars (sync via CalendarRepository)
              // ⚠️ Les relations many-to-many sont dans producerOpaRelations et exporterMandates
              syncedAt: Date.now(),
            });
          }
        }

        // ✅ Utiliser bulkPut pour mettre à jour uniquement les acteurs modifiés
        // bulkPut mettra à jour les enregistrements existants (grâce à l'id primaire)
        // et créera les nouveaux (ceux sans id)
        await db.actors.bulkPut(updatedActors);
        console.log(
          `✅ Sync incrémentale: ${updatedActors.length} acteurs mis à jour (données offline préservées)`
        );

        // 1. Ajouter les nouvelles relations Producer ↔ OPA (vérifier l'existence avant)
        const producerOpaRelationsToAdd: ProducerOpaRelation[] = [];
        for (const actor of actors) {
          if (actor.actorType === "PRODUCERS" && actor.producers) {
            for (const producer of actor.producers) {
              // Vérifier si la relation existe déjà (utiliser l'index composé [producerServerId+opaServerId])
              const existingRelation = await db.producerOpaRelations
                .where("[producerServerId+opaServerId]")
                .equals([producer.id, actor.id])
                .first();

              // Si la relation n'existe pas, l'ajouter
              if (!existingRelation) {
                producerOpaRelationsToAdd.push({
                  producerServerId: producer.id,
                  producerLocalId: undefined,
                  opaServerId: actor.id,
                  opaLocalId: undefined,
                  createdAt: new Date().toISOString(),
                  syncedAt: Date.now(),
                });
              }
            }
          }
          if (actor.actorType === "PRODUCER" && actor.opas) {
            for (const opa of actor.opas) {
              // Vérifier si la relation existe déjà (utiliser l'index composé)
              const existingRelation = await db.producerOpaRelations
                .where("[producerServerId+opaServerId]")
                .equals([actor.id, opa.id])
                .first();

              // Si la relation n'existe pas, l'ajouter
              if (!existingRelation) {
                producerOpaRelationsToAdd.push({
                  producerServerId: actor.id,
                  producerLocalId: undefined,
                  opaServerId: opa.id,
                  opaLocalId: undefined,
                  createdAt: new Date().toISOString(),
                  syncedAt: Date.now(),
                });
              }
            }
          }
        }

        // 2. Ajouter les nouvelles relations Exporter ↔ Buyer (vérifier l'existence avant)
        const exporterMandatesToAdd: ExporterMandateRelation[] = [];
        for (const actor of actors) {
          if (actor.actorType === "EXPORTER" && actor.buyers) {
            for (const buyer of actor.buyers) {
              // Vérifier si la relation existe déjà (utiliser l'index composé [exporterServerId+buyerServerId+campaignId])
              // Note: Pour l'index composé à 3 champs, on doit fournir les 3 valeurs
              // Comme on n'a pas de campaignId ici, on vérifie avec where().equals() sur les 2 premiers champs
              const existingMandate = await db.exporterMandates
                .where("exporterServerId")
                .equals(actor.id)
                .and((rel) => rel.buyerServerId === buyer.id)
                .first();

              // Si la relation n'existe pas, l'ajouter
              if (!existingMandate) {
                exporterMandatesToAdd.push({
                  exporterServerId: actor.id,
                  exporterLocalId: undefined,
                  buyerServerId: buyer.id,
                  buyerLocalId: undefined,
                  createdAt: new Date().toISOString(),
                  syncedAt: Date.now(),
                });
              }
            }
          }
          if (actor.actorType === "BUYER" && actor.mandators) {
            for (const exporter of actor.mandators) {
              // Vérifier si la relation existe déjà
              const existingMandate = await db.exporterMandates
                .where("exporterServerId")
                .equals(exporter.id)
                .and((rel) => rel.buyerServerId === actor.id)
                .first();

              // Si la relation n'existe pas, l'ajouter
              if (!existingMandate) {
                exporterMandatesToAdd.push({
                  exporterServerId: exporter.id,
                  exporterLocalId: undefined,
                  buyerServerId: actor.id,
                  buyerLocalId: undefined,
                  createdAt: new Date().toISOString(),
                  syncedAt: Date.now(),
                });
              }
            }
          }
        }

        // 3. Stocker les nouvelles relations (uniquement celles qui n'existaient pas)
        if (producerOpaRelationsToAdd.length > 0) {
          await db.producerOpaRelations.bulkAdd(producerOpaRelationsToAdd);
          console.log(
            `✅ ${producerOpaRelationsToAdd.length} nouvelles relations Producer-OPA ajoutées`
          );
        }
        if (exporterMandatesToAdd.length > 0) {
          await db.exporterMandates.bulkAdd(exporterMandatesToAdd);
          console.log(
            `✅ ${exporterMandatesToAdd.length} nouveaux mandats Exporter-Buyer ajoutés`
          );
        }
      }

      // ⭐ SAUVEGARDER LE TIMESTAMP DE DERNIÈRE SYNC
      this.setLastSyncTime(Date.now());
    } catch (error) {
      console.error("❌ Erreur lors de la synchronisation des acteurs:", error);
      throw error;
    }
  }

  /**
   * Obtient le timestamp de la dernière synchronisation depuis localStorage
   */
  private getLastSyncTime(): number {
    const storedTime = localStorage.getItem("actors_last_sync_time");
    return storedTime ? Number.parseInt(storedTime, 10) : 0;
  }

  /**
   * Sauvegarde le timestamp de la dernière synchronisation dans localStorage
   */
  private setLastSyncTime(timestamp: number): void {
    localStorage.setItem("actors_last_sync_time", timestamp.toString());
  }

  /**
   * Obtient le nombre d'acteurs en local
   */
  private async getLocalCount(): Promise<number> {
    return db.actors.count();
  }

  /**
   * Efface les acteurs locaux (incluant les calendriers dans leurs arrays)
   * Utilisé lors d'un changement d'utilisateur
   * PUBLIC : Appelé par le callback enregistré dans PollingService
   */
  public async clearAllLocalData(): Promise<void> {
    console.log("🗑️ Effacement des acteurs locaux...");

    try {
      // Effacer uniquement la table actors
      // (ce qui inclut automatiquement les calendars[] stockés dedans)
      await db.actors.clear();

      // Effacer le timestamp de synchronisation des acteurs
      localStorage.removeItem("actors_last_sync_time");

      console.log("✅ Acteurs locaux effacés (incluant calendars)");
    } catch (error) {
      console.error(
        "❌ Erreur lors de l'effacement des acteurs locaux:",
        error
      );
      throw error;
    }
  }

  /**
   * Implémentation de la synchronisation post-connexion
   * Utilise le système de delta counts via PollingService
   * Cette méthode est appelée automatiquement après chaque connexion réussie
   */
  async syncOnLogin(): Promise<void> {
    console.log("🔑 Synchronisation des acteurs déclenchée...");

    try {
      // ⭐ VÉRIFIER LE RÔLE DE L'UTILISATEUR
      if (!this.hasAuthorizedRole()) {
        console.log(
          "⚠️ Utilisateur sans rôle autorisé (basin_admin ou field_agent) - synchronisation des acteurs ignorée."
        );
        return;
      }

      // Vérifier si nous avons des données locales
      const localCount = await this.getLocalCount();

      if (localCount === 0) {
        // ⭐ SYNC INITIALE (première fois) - Tous les acteurs
        console.log(
          "🔄 Aucune donnée locale, synchronisation initiale des acteurs..."
        );
        await this.syncFromApi(true); // isInitialSync = true
        console.log("✅ Acteurs synchronisés avec succès (sync initiale).");
        return;
      }

      // ⭐ VÉRIFIER LES DELTA COUNTS (sauvegardés par PollingService)
      const deltaCount = this.pollingService.getEntityCount("actors");

      if (deltaCount > 0) {
        // ⭐ SYNC INCRÉMENTALE - Uniquement les acteurs modifiés
        console.log(
          `🔄 ${deltaCount} acteur(s) modifié(s) détecté(s), synchronisation incrémentale en cours...`
        );
        await this.syncFromApi(false); // isInitialSync = false

        // ⭐ RESET DU COUNT APRÈS SYNC RÉUSSIE
        this.pollingService.setEntityCount("actors", 0);
        console.log(
          "✅ Acteurs synchronisés avec succès après mise à jour incrémentale."
        );
      } else {
        console.log("👍 Données des acteurs déjà à jour.");
      }
    } catch (error) {
      console.error("❌ Erreur lors de la synchronisation des acteurs:", error);
    }
  }
}
