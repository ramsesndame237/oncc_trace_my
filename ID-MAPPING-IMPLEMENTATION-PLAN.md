# Plan d'Implémentation - Système de Mapping d'IDs Offline/Online

> **Date** : 20 Novembre 2025
> **Statut** : ✅ Validé - Prêt pour implémentation
> **Basé sur** : ID-MAPPING-ANALYSIS.md (Questions répondues)

---

## 📋 Vue d'Ensemble

### Objectif
Permettre aux field agents de créer des acteurs et transactions en mode offline, puis synchroniser automatiquement avec le serveur quand la connexion revient, en résolvant correctement les références entre entités.

### Décisions Clés Validées

| Décision | Choix |
|----------|-------|
| **Détection offline/online** | Présence de `id` (online) vs `localId` (offline) |
| **Structure conventions/calendars** | Garder structure actuelle de db.ts (objets complets) |
| **IdMapping initial** | Créer avec `serverId: null` |
| **Recherche entités** | OR sur `id` et `localId` |
| **Différenciation IDs** | Vérifier dans `db.idMappings` |
| **IdMapping pour transactions** | ❌ NON - pas nécessaire |
| **Ordre de sync** | Actor → Store → Convention → Calendar → Product Transfer → Transaction |
| **Nettoyage idMappings** | ✅ À LA FIN de toute la synchronisation (pas immédiatement) |
| **Suppression OfflineTransactionData** | ✅ OUI - après sync |
| **Suppression autres entités** | ❌ NON - garder pour consultation offline |

> **Note importante** : Ce document inclut Store et Product Transfer dans l'ordre de synchronisation (`sortOperationsByDependency`), mais l'implémentation détaillée de leur logique offline complète (création, stockage, résolution d'IDs) n'est pas couverte dans ce plan. Le focus principal est sur Actor, Convention, Calendar et Transaction.

---

## 🎯 Architecture de la Solution

### Schéma des Flux

```
┌─────────────────────────────────────────────────────────────┐
│                     MODE OFFLINE                             │
├─────────────────────────────────────────────────────────────┤
│  1. Field Agent crée Acteur A                               │
│     ├─ Génère localId = uuid()                              │
│     ├─ Stocke dans OfflineActorData (avec localId)          │
│     ├─ Crée idMapping { localId, serverId: null }           │
│     └─ Ajoute dans pendingOperations                        │
│                                                              │
│  2. Field Agent crée Convention C                           │
│     ├─ Génère localId = uuid()                              │
│     ├─ Référence buyerExporterId = acteur.localId           │
│     ├─ Crée idMapping { localId, serverId: null }           │
│     ├─ Met à jour acteur.conventions[] avec objet complet   │
│     └─ Ajoute dans pendingOperations                        │
│                                                              │
│  3. Field Agent crée Transaction T                          │
│     ├─ Génère localId = uuid()                              │
│     ├─ Référence sellerId = acteur.localId                  │
│     ├─ PAS d'idMapping pour transaction                     │
│     ├─ Stocke dans OfflineTransactionData                   │
│     └─ Ajoute dans pendingOperations                        │
└─────────────────────────────────────────────────────────────┘

                            ⬇️
                     CONNEXION REVIENT
                            ⬇️

┌─────────────────────────────────────────────────────────────┐
│                     SYNCHRONISATION                          │
├─────────────────────────────────────────────────────────────┤
│  ORDRE: Actor → Store → Convention → Calendar →             │
│         Product Transfer → Transaction                       │
│                                                              │
│  ÉTAPE 1: Sync Actor A                                      │
│     ├─ Envoie au serveur → reçoit serverId                  │
│     ├─ Met à jour idMapping { localId, serverId }           │
│     ├─ Met à jour OfflineActorData:                         │
│     │   • Ajoute id = serverId                              │
│     │   • Supprime localId                                  │
│     └─ ⚠️ GARDE idMapping (pas de suppression ici)          │
│                                                              │
│  ÉTAPE 2: Sync Store S                                      │
│     ├─ Résout occupants IDs via idMapping                   │
│     ├─ Envoie au serveur → reçoit serverId                  │
│     ├─ Met à jour idMapping { localId, serverId }           │
│     ├─ Met à jour OfflineStoreData:                         │
│     │   • Ajoute id = serverId                              │
│     │   • Supprime localId                                  │
│     └─ ⚠️ GARDE idMapping (pas de suppression ici)          │
│                                                              │
│  ÉTAPE 3: Sync Convention C                                 │
│     ├─ Résout buyerExporterId via idMapping ✅              │
│     ├─ Envoie au serveur → reçoit serverId                  │
│     ├─ Met à jour idMapping                                 │
│     ├─ Met à jour acteur.conventions[]:                     │
│     │   • Remplace objet avec localId par objet avec id     │
│     └─ ⚠️ GARDE idMapping (pas de suppression ici)          │
│                                                              │
│  ÉTAPE 4: Sync Calendar CAL                                 │
│     ├─ Résout opaId via idMapping ✅                        │
│     ├─ Envoie au serveur → reçoit serverId                  │
│     ├─ Met à jour idMapping                                 │
│     ├─ Met à jour acteur.calendars[]:                       │
│     │   • Remplace objet avec localId par objet avec id     │
│     └─ ⚠️ GARDE idMapping (pas de suppression ici)          │
│                                                              │
│  ÉTAPE 5: Sync Product Transfer PT                          │
│     ├─ Résout senderActorId, receiverActorId via idMapping  │
│     ├─ Résout senderStoreId, receiverStoreId via idMapping  │
│     ├─ Envoie au serveur → reçoit serverId                  │
│     ├─ Met à jour idMapping                                 │
│     ├─ Met à jour OfflineProductTransferData:               │
│     │   • Ajoute id = serverId                              │
│     │   • Supprime localId                                  │
│     └─ ⚠️ GARDE idMapping (pas de suppression ici)          │
│                                                              │
│  ÉTAPE 6: Sync Transaction T                                │
│     ├─ Résout sellerId, buyerId via idMapping ✅            │
│     ├─ Résout conventionId, calendarId via idMapping ✅     │
│     ├─ Envoie au serveur → reçoit serverId                  │
│     ├─ SUPPRIME de OfflineTransactionData                   │
│     └─ ⚠️ GARDE idMapping (pas de suppression ici)          │
│                                                              │
│  ✅ ÉTAPE FINALE: Nettoyage Global des idMappings           │
│     └─ await db.idMappings.clear()                          │
│        Vide TOUTE la table idMappings en une seule fois     │
│        après synchronisation complète de toutes les entités │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Modifications à Apporter

### Phase 1 : Modification du Schéma IndexedDB

**Fichier** : `/frontend/src/core/infrastructure/database/db.ts`

#### 1.1 Ajouter l'interface IdMapping

```typescript
/**
 * Mapping entre les IDs locaux (générés offline) et les IDs serveur (reçus après sync).
 */
export interface IdMapping {
  id?: number; // ID auto-incrémenté par Dexie
  localId: string; // UUID généré localement
  serverId: string | null; // UUID serveur (null jusqu'à sync)
  entityType: "actor" | "convention" | "calendar"; // PAS transaction
  createdAt: number; // Timestamp création
  syncedAt: number | null; // Timestamp sync (null si pas encore sync)
}
```

#### 1.2 Modifier OfflineActorData

```typescript
export interface OfflineActorData {
  id?: string; // UUID serveur (présent = synced)
  localId?: string; // UUID local (présent = offline, à supprimer après sync)
  actorType: "PRODUCER" | "TRANSFORMER" | "PRODUCERS" | "BUYER" | "EXPORTER";
  familyName: string;
  givenName: string;
  locationCode: string;
  // ... autres champs existants ...

  // STRUCTURE avec id ET localId pour identification claire offline/online
  conventions?: Array<{
    id?: string; // UUID serveur (présent = synced)
    localId?: string; // UUID local (présent = offline)
    code: string;
    opaId: string;
    buyerExporterId: string;
    signatureDate: string;
    status: string;
  }>;

  calendars?: Array<{
    id?: string; // UUID serveur (présent = synced)
    localId?: string; // UUID local (présent = offline)
    code: string;
    type: "MARCHE" | "ENLEVEMENT";
    status: "active" | "inactive";
    location: string | null;
    locationCode: string | null;
    startDate: string;
    endDate: string;
    eventTime: string | null;
    convention?: {
      id?: string; // UUID serveur
      localId?: string; // UUID local
      code: string;
      opaId: string;
      buyerExporterId: string;
      signatureDate: string;
    } | null;
  }>;

  createdAt: string;
  updatedAt: string;
  syncedAt: number;
}
```

#### 1.3 Note sur les Conventions et Calendars

**⚠️ IMPORTANT** : Nous ne créons PAS de tables séparées `OfflineConventionData` et `OfflineCalendarData`.

**Raison** : Les conventions et calendriers sont déjà stockés dans `OfflineActorData` sous forme de tableaux avec la même structure que les acteurs (id + localId) :
- `conventions?: Array<{ id?, localId?, code, opaId, buyerExporterId, ... }>`
- `calendars?: Array<{ id?, localId?, code, type, status, ... }>`

**Identification offline/online** :
- Présence de `localId` seul → Entité offline (pas encore synchronisée)
- Présence de `id` seul → Entité online (synchronisée)
- Les deux champs permettent une identification claire et cohérente avec `OfflineActorData`

Lors de la synchronisation :
1. Chercher les conventions/calendriers par leur `localId`
2. Ajouter le `serverId` dans le champ `id`
3. Supprimer le champ `localId`
4. Pas besoin de tables séparées car les données sont déjà dans les acteurs

#### 1.4 Créer OfflineTransactionData

```typescript
export interface OfflineTransactionData {
  id?: string; // UUID serveur (présent = synced)
  localId?: string; // UUID local (présent = offline)
  type: "SALE" | "PURCHASE";
  sellerId: string; // Peut être localId ou serverId
  buyerId: string; // Peut être localId ou serverId
  productType: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  transactionDate: string;
  calendarId?: string; // Peut être localId ou serverId
  conventionId?: string; // Peut être localId ou serverId
  status?: string;
  createdAt: string;
  updatedAt: string;
}
```

#### 1.5 Mettre à jour la classe SifcDatabase

```typescript
export class SifcDatabase extends Dexie {
  pins!: EntityTable<OfflinePinData, "id">;
  pendingOperations!: EntityTable<PendingOperation, "id">;
  locations!: EntityTable<OfflineLocationData, "id">;
  settings!: EntityTable<OfflineSettingsData, "id">;
  actors!: EntityTable<OfflineActorData, "id">;

  // NOUVELLES TABLES
  idMappings!: EntityTable<IdMapping, "id">;
  transactions!: EntityTable<OfflineTransactionData, "id">;
  // ⚠️ PAS de tables conventions et calendars - déjà dans actors

  constructor() {
    super("SifcDatabase");

    // ⚠️ INCREMENTER LA VERSION (actuellement v1)
    this.version(2).stores({
      pins: "id, userId, createdAt, lastUsed, isLocked",
      pendingOperations:
        "++id, entityId, entityType, timestamp, userId, [entityType+operation], [userId+entityType]",
      locations:
        "++id, code, name, type, status, parentCode, syncedAt, [type+name], isInProductionBasin, productionBasinId, productionBasinName",
      settings: "++id, key, updatedAt",
      actors:
        "id, localId, actorType, familyName, givenName, locationCode, status, syncedAt, [actorType+status], onccId",

      // NOUVELLES TABLES
      idMappings:
        "++id, localId, serverId, entityType, createdAt, syncedAt, [localId+entityType]",
      transactions:
        "id, localId, type, sellerId, buyerId, calendarId, conventionId, transactionDate",
      // ⚠️ PAS de tables conventions et calendars - déjà dans actors
    });
  }
}
```

**⚠️ IMPORTANT** : Incrémenter la version de Dexie provoquera une migration automatique.

---

### Phase 2 : Créer le Service de Résolution d'IDs

**Nouveau fichier** : `/frontend/src/core/infrastructure/services/idResolutionService.ts`

```typescript
import { db } from "@/core/infrastructure/database/db";

/**
 * Service centralisé pour résoudre les IDs locaux vers serveur.
 *
 * Stratégie de résolution :
 * 1. Vérifier dans idMappings si c'est un localId
 * 2. Si mapping trouvé avec serverId → retourner serverId
 * 3. Sinon, chercher dans les tables offline par localId
 * 4. Si pas trouvé, c'est probablement déjà un serverId → retourner tel quel
 */
export class IdResolutionService {
  /**
   * Résout un actorId (local ou serveur) vers serverId.
   */
  async resolveActorId(actorId: string): Promise<string> {
    // 1. Vérifier dans idMappings
    const mapping = await db.idMappings
      .where("localId")
      .equals(actorId)
      .and((m) => m.entityType === "actor")
      .first();

    if (mapping?.serverId) {
      return mapping.serverId;
    }

    // 2. Vérifier dans OfflineActorData par localId
    const actorByLocalId = await db.actors
      .where("localId")
      .equals(actorId)
      .first();

    if (actorByLocalId?.id) {
      return actorByLocalId.id; // Acteur déjà synchronisé
    }

    // 3. Sinon, c'est probablement déjà un serverId
    return actorId;
  }

  /**
   * Résout un conventionId (local ou serveur) vers serverId.
   * ⚠️ Les conventions sont dans OfflineActorData, pas dans une table séparée
   */
  async resolveConventionId(conventionId: string | undefined): Promise<string | undefined> {
    if (!conventionId) return undefined;

    // 1. Vérifier dans idMappings
    const mapping = await db.idMappings
      .where("localId")
      .equals(conventionId)
      .and((m) => m.entityType === "convention")
      .first();

    if (mapping?.serverId) {
      return mapping.serverId;
    }

    // 2. Chercher dans les conventions des acteurs par localId OU id
    const actors = await db.actors.toArray();
    for (const actor of actors) {
      if (actor.conventions) {
        const convention = actor.conventions.find(
          c => c.localId === conventionId || c.id === conventionId
        );
        if (convention) {
          // Si convention a un serverId, le retourner, sinon retourner l'ID original
          return convention.id || conventionId;
        }
      }
    }

    return conventionId;
  }

  /**
   * Résout un calendarId (local ou serveur) vers serverId.
   * ⚠️ Les calendriers sont dans OfflineActorData, pas dans une table séparée
   */
  async resolveCalendarId(calendarId: string | undefined): Promise<string | undefined> {
    if (!calendarId) return undefined;

    // 1. Vérifier dans idMappings
    const mapping = await db.idMappings
      .where("localId")
      .equals(calendarId)
      .and((m) => m.entityType === "calendar")
      .first();

    if (mapping?.serverId) {
      return mapping.serverId;
    }

    // 2. Chercher dans les calendriers des acteurs par localId OU id
    const actors = await db.actors.toArray();
    for (const actor of actors) {
      if (actor.calendars) {
        const calendar = actor.calendars.find(
          c => c.localId === calendarId || c.id === calendarId
        );
        if (calendar) {
          // Si calendrier a un serverId, le retourner, sinon retourner l'ID original
          return calendar.id || calendarId;
        }
      }
    }

    return calendarId;
  }

  /**
   * Recherche un acteur par id OU localId (stratégie OR).
   */
  async findActorByIdOrLocalId(idOrLocalId: string) {
    // Chercher par id
    let actor = await db.actors.where("id").equals(idOrLocalId).first();

    if (!actor) {
      // Chercher par localId
      actor = await db.actors.where("localId").equals(idOrLocalId).first();
    }

    return actor;
  }
}

// Instance singleton
export const idResolutionService = new IdResolutionService();
```

---

### Phase 3 : Modifier ActorRepository

**Fichier** : `/frontend/src/features/actor/infrastructure/repositories/ActorRepository.ts`

**Modifications nécessaires :**

#### 3.1 Créer un acteur en mode offline

```typescript
// Dans la méthode qui crée un acteur offline
async createActorOffline(actorData: CreateActorRequest) {
  const localId = uuid(); // Générer UUID local
  const timestamp = Date.now();

  // 1. Ajouter dans pendingOperations
  await db.pendingOperations.add({
    entityId: localId,
    entityType: "actor",
    operation: "create",
    payload: { ...actorData, localId },
    timestamp,
    retries: 0,
    userId: currentUserId,
  });

  // 2. Ajouter dans OfflineActorData (SANS id, AVEC localId)
  await db.actors.add({
    localId, // Pas d'id = pas synchronisé
    ...actorData,
    conventions: [],
    calendars: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    syncedAt: timestamp,
  });

  // 3. Créer idMapping
  await db.idMappings.add({
    localId,
    serverId: null,
    entityType: "actor",
    createdAt: timestamp,
    syncedAt: null,
  });

  return localId;
}
```

#### 3.2 Modifier handleCreate pour sync

```typescript
private async handleCreate(operation: PendingOperation): Promise<void> {
  const { documents, localId, ...payload } = operation.payload as unknown as CreateActorRequest & { localId: string };

  // 1. Envoyer au serveur (SANS localId)
  const actorResponse = await apiClient.post<{ actor: ActorResponse }>("/actors", payload);
  const serverId = actorResponse.data.actor.id;

  // 2. Mettre à jour idMapping
  await db.idMappings
    .where("localId")
    .equals(localId)
    .modify({
      serverId,
      syncedAt: Date.now(),
    });

  // 3. Mettre à jour OfflineActorData
  await db.actors
    .where("localId")
    .equals(localId)
    .modify((actor) => {
      actor.id = serverId; // Ajouter serverId
      delete actor.localId; // Supprimer localId
    });

  // 4. Upload documents si présents
  if (documents?.length > 0) {
    await this.uploadDocuments(serverId, documents);
  }

  // ⚠️ NE PAS supprimer idMapping ici !
  // Les idMappings sont conservés jusqu'à la fin de TOUTE la synchronisation
  // pour permettre la résolution des IDs dans les conventions, calendriers et transactions.
  // Le nettoyage global se fait dans SyncService après toutes les syncs.
}
```

---

### Phase 4 : Créer ConventionRepository (similaire)

**Nouveau fichier** : `/frontend/src/features/convention/infrastructure/repositories/ConventionRepository.ts`

**Points clés :**
- Créer idMapping lors de création offline
- Résoudre `opaId` et `buyerExporterId` avant sync via idResolutionService
- Mettre à jour les acteurs concernés après sync
- ⚠️ GARDER idMapping (pas de suppression) - nettoyage global à la fin

```typescript
import { idResolutionService } from "@/core/infrastructure/services/idResolutionService";

class ConventionRepository {
  async createConventionOffline(conventionData: CreateConventionRequest) {
    const localId = uuid();
    const timestamp = Date.now();

    // 1. pendingOperations
    await db.pendingOperations.add({
      entityId: localId,
      entityType: "convention",
      operation: "create",
      payload: { ...conventionData, localId },
      timestamp,
      retries: 0,
      userId: currentUserId,
    });

    // 2. OfflineConventionData
    await db.conventions.add({
      localId,
      ...conventionData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // 3. idMapping
    await db.idMappings.add({
      localId,
      serverId: null,
      entityType: "convention",
      createdAt: timestamp,
      syncedAt: null,
    });

    // 4. Mettre à jour les acteurs concernés
    await this.updateActorConventions(conventionData, localId);

    return localId;
  }

  private async updateActorConventions(conventionData: any, conventionLocalId: string) {
    // Trouver OPA
    const opa = await idResolutionService.findActorByIdOrLocalId(conventionData.opaId);
    if (opa) {
      await db.actors
        .where(opa.id ? "id" : "localId")
        .equals(opa.id || opa.localId!)
        .modify((actor) => {
          if (!actor.conventions) actor.conventions = [];
          actor.conventions.push({
            id: conventionLocalId, // Sera remplacé par serverId après sync
            code: conventionData.code,
            opaId: conventionData.opaId,
            buyerExporterId: conventionData.buyerExporterId,
            signatureDate: conventionData.signatureDate,
            status: conventionData.status,
          });
        });
    }

    // Idem pour buyerExporter
    // ...
  }

  private async handleCreate(operation: PendingOperation): Promise<void> {
    const { localId, ...payload } = operation.payload;

    // 1. Résoudre les IDs
    const resolvedOpaId = await idResolutionService.resolveActorId(payload.opaId);
    const resolvedBuyerExporterId = await idResolutionService.resolveActorId(payload.buyerExporterId);

    // 2. Envoyer au serveur
    const response = await apiClient.post("/conventions", {
      ...payload,
      opaId: resolvedOpaId,
      buyerExporterId: resolvedBuyerExporterId,
    });

    const serverId = response.data.convention.id;

    // 3. Mettre à jour idMapping
    await db.idMappings
      .where("localId")
      .equals(localId)
      .modify({ serverId, syncedAt: Date.now() });

    // 4. Mettre à jour OfflineConventionData
    await db.conventions
      .where("localId")
      .equals(localId)
      .modify((conv) => {
        conv.id = serverId;
        delete conv.localId;
      });

    // 5. Mettre à jour les acteurs (remplacer localId par serverId dans conventions[])
    await this.updateActorsAfterSync(localId, serverId, resolvedOpaId, resolvedBuyerExporterId);

    // ⚠️ NE PAS supprimer idMapping ici !
    // Les idMappings sont conservés jusqu'à la fin de TOUTE la synchronisation.
    // Le nettoyage global se fait dans SyncService après toutes les syncs.
  }

  private async updateActorsAfterSync(
    conventionLocalId: string,
    conventionServerId: string,
    opaServerId: string,
    buyerExporterServerId: string
  ) {
    // Mettre à jour OPA
    await db.actors
      .where("id")
      .equals(opaServerId)
      .modify((actor) => {
        if (actor.conventions) {
          const index = actor.conventions.findIndex((c) => c.id === conventionLocalId);
          if (index !== -1) {
            actor.conventions[index].id = conventionServerId;
          }
        }
      });

    // Idem pour buyerExporter
    // ...
  }
}
```

---

### Phase 5 : Créer CalendarRepository (similaire à Convention)

---

### Phase 6 : Modifier TransactionRepository

**Fichier** : `/frontend/src/features/transaction/infrastructure/repositories/TransactionRepository.ts`

**Points clés :**
- PAS d'idMapping pour les transactions
- Résoudre `sellerId`, `buyerId`, `calendarId`, `conventionId` avant sync
- SUPPRIMER de OfflineTransactionData après sync

```typescript
class TransactionRepository {
  async createTransactionOffline(transactionData: CreateTransactionRequest) {
    const localId = uuid();
    const timestamp = Date.now();

    // 1. pendingOperations
    await db.pendingOperations.add({
      entityId: localId,
      entityType: "transaction",
      operation: "create",
      payload: { ...transactionData, localId },
      timestamp,
      retries: 0,
      userId: currentUserId,
    });

    // 2. OfflineTransactionData (PAS d'idMapping)
    await db.transactions.add({
      localId,
      ...transactionData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return localId;
  }

  private async handleCreate(operation: PendingOperation): Promise<void> {
    const { localId, ...payload } = operation.payload;

    // 1. Résoudre TOUS les IDs
    const resolvedSellerId = await idResolutionService.resolveActorId(payload.sellerId);
    const resolvedBuyerId = await idResolutionService.resolveActorId(payload.buyerId);
    const resolvedCalendarId = await idResolutionService.resolveCalendarId(payload.calendarId);
    const resolvedConventionId = await idResolutionService.resolveConventionId(payload.conventionId);

    // 2. Envoyer au serveur
    const response = await apiClient.post("/transactions", {
      ...payload,
      sellerId: resolvedSellerId,
      buyerId: resolvedBuyerId,
      calendarId: resolvedCalendarId,
      conventionId: resolvedConventionId,
    });

    // 3. SUPPRIMER de OfflineTransactionData (pas besoin de garder)
    await db.transactions.where("localId").equals(localId).delete();

    // PAS d'idMapping à supprimer (jamais créé)
  }
}
```

---

### Phase 7 : Modifier SyncService (Ordre de Sync)

**Fichier** : `/frontend/src/core/infrastructure/services/syncService.ts`

**Modification critique** : Changer l'ordre de traitement

```typescript
export class SyncService {
  public async processQueue(userId?: string): Promise<void> {
    // Récupérer toutes les opérations
    let pendingOps = await db.pendingOperations
      .orderBy("timestamp")
      .toArray();

    if (userId) {
      pendingOps = pendingOps.filter((op) => op.userId === userId);
    }

    // ⚠️ NOUVEAU : Trier par type d'entité selon l'ordre de dépendance
    const orderedOps = this.sortOperationsByDependency(pendingOps);

    for (const op of orderedOps) {
      try {
        const handler = this.handlers.get(op.entityType);
        if (!handler) {
          console.error(`No handler for entity type: ${op.entityType}`);
          continue;
        }

        await handler.handle(op);
        await db.pendingOperations.delete(op.id!);
      } catch (error) {
        // Gestion d'erreur...
      }
    }

    // ✅ NETTOYAGE GLOBAL : Vider toute la table idMappings après sync complète
    // Cela garantit que toutes les résolutions d'IDs ont été effectuées
    // pour conventions, calendriers et transactions avant suppression
    await db.idMappings.clear();
    console.log("✅ Nettoyage global : table idMappings vidée");
  }

  /**
   * Trie les opérations selon l'ordre de dépendance :
   * 1. Actor          (pas de dépendances)
   * 2. Store          (dépend de Actor pour occupants - optionnel)
   * 3. Convention     (dépend de Actor : OPA, BuyerExporter)
   * 4. Calendar       (dépend de Actor : OPA, et Convention - optionnel)
   * 5. ProductTransfer (dépend de Actor : sender/receiver, et Store : sender/receiver)
   * 6. Transaction    (dépend de Actor, Convention, Calendar)
   */
  private sortOperationsByDependency(operations: PendingOperation[]): PendingOperation[] {
    const entityOrder = {
      actor: 1,
      store: 2,
      convention: 3,
      calendar: 4,
      productTransfer: 5,
      transaction: 6,
    };

    return operations.sort((a, b) => {
      const orderA = entityOrder[a.entityType as keyof typeof entityOrder] || 999;
      const orderB = entityOrder[b.entityType as keyof typeof entityOrder] || 999;

      if (orderA !== orderB) {
        return orderA - orderB;
      }

      // Si même type, trier par timestamp
      return a.timestamp - b.timestamp;
    });
  }
}
```

---

## 🗑️ Stratégie de Nettoyage des idMappings

### Pourquoi garder les idMappings jusqu'à la fin ?

**❌ Problème avec suppression immédiate** :
```typescript
// Sync Actor → supprime idMapping immédiatement
await db.idMappings.where("localId").equals("actor-local-123").delete();

// Sync Convention → essaie de résoudre opaId
const resolved = await idResolutionService.resolveActorId("actor-local-123");
// ❌ ERREUR : idMapping introuvable → résolution échoue !
```

**✅ Solution avec nettoyage global** :
```typescript
// Sync Actor → GARDE idMapping
await db.idMappings.where("localId").equals(localId).modify({ serverId, syncedAt: Date.now() });

// Sync Convention → résout opaId avec succès
const resolved = await idResolutionService.resolveActorId("actor-local-123");
// ✅ SUCCESS : idMapping trouvé → retourne "actor-server-999"

// Sync Transaction → résout tous les IDs avec succès
// ✅ SUCCESS : tous les idMappings disponibles

// FIN de toutes les syncs → nettoyage global
await db.idMappings.clear();
```

### Avantages de cette approche

| Aspect | Suppression immédiate | Nettoyage global |
|--------|----------------------|------------------|
| **Simplicité** | ❌ Complexe (gestion des dépendances) | ✅ Simple (une seule ligne) |
| **Sécurité** | ❌ Risque de références cassées | ✅ Toutes les résolutions fonctionnent |
| **Performance** | ❌ Multiples DELETE queries | ✅ Un seul CLEAR |
| **Maintenabilité** | ❌ Code dupliqué partout | ✅ Centralisé dans SyncService |

### Implémentation

**Dans chaque Repository (Actor, Convention, Calendar)** :
```typescript
// ⚠️ NE PAS supprimer idMapping ici !
// Les idMappings sont conservés jusqu'à la fin de TOUTE la synchronisation
// pour permettre la résolution des IDs dans les conventions, calendriers et transactions.
// Le nettoyage global se fait dans SyncService après toutes les syncs.
```

**Dans SyncService (après traitement de toutes les opérations)** :
```typescript
// ✅ NETTOYAGE GLOBAL : Vider toute la table idMappings après sync complète
await db.idMappings.clear();
```

---

## 🧪 Tests à Effectuer

### Scénario 1 : Acteur offline → Transaction offline → Sync

```
1. Passer en mode offline
2. Créer un producteur (Acteur A)
3. Créer une transaction de vente avec Acteur A comme vendeur
4. Vérifier dans IndexedDB :
   - actors : 1 entrée avec localId, sans id
   - idMappings : 1 entrée pour acteur
   - transactions : 1 entrée avec localId
   - pendingOperations : 2 entrées
5. Passer en mode online
6. Déclencher sync
7. Vérifier :
   - actors : id présent, localId supprimé
   - idMappings : vide (nettoyage global après toutes les syncs)
   - transactions : vide (supprimé après sync)
   - pendingOperations : vide
8. Vérifier côté serveur :
   - Acteur créé avec bon UUID
   - Transaction créée avec bon sellerId
```

### Scénario 2 : Acteur offline → Convention offline → Transaction offline → Sync

```
1. Mode offline
2. Créer OPA (Acteur A)
3. Créer Acheteur (Acteur B)
4. Créer Convention entre A et B
5. Vérifier que actors[A].conventions contient objet avec localId de convention
6. Créer Transaction avec convention
7. Mode online + sync
8. Vérifier :
   - actors : 2 entrées avec id, sans localId
   - actors[A].conventions[0].id = serverId de convention
   - conventions : 1 entrée avec id, sans localId
   - transactions : vide (supprimé)
9. Vérifier serveur :
   - 2 acteurs créés
   - 1 convention créée avec bons actorIds
   - 1 transaction créée avec bons IDs
```

### Scénario 3 : Acteur online → Transaction offline → Sync

```
1. Mode online
2. Créer Acteur A (synchronisé immédiatement)
3. Mode offline
4. Créer Transaction avec Acteur A
5. Vérifier :
   - Transaction référence id (serverId) de l'acteur
   - Pas d'idMapping créé pour l'acteur
6. Mode online + sync
7. Transaction doit se créer correctement avec serverId
```

---

## 📊 Métriques de Succès

- ✅ Acteurs créés offline sont synchronisés avec bon UUID serveur
- ✅ Transactions référencent correctement les acteurs après sync
- ✅ Conventions/Calendriers mis à jour dans les acteurs avec serverIds
- ✅ IdMappings supprimés après sync réussi
- ✅ OfflineTransactionData vidé après sync
- ✅ Pas d'accumulation de données obsolètes
- ✅ Résolution d'IDs fonctionne dans tous les cas (local, serveur, mixte)

---

## ⚠️ Points d'Attention

### Gestion d'Erreurs

- Si sync échoue, ne PAS supprimer idMapping
- Garder operation dans pendingOperations pour retry
- Incrémenter retries et logger l'erreur

### Performance

- Index Dexie optimisés pour recherches OR
- Requêtes groupées quand possible
- Éviter parcours complet de tables

### Rollback

- Garder backup de db.ts version 1
- Tester migration Dexie v1 → v2 sur base de test
- Prévoir script de rollback si nécessaire

---

## 🚀 Prochaines Étapes (Next Steps)

### Étape 1 : Préparation (Estimation : 30 min)
- [ ] Créer branche Git : `feature/offline-id-mapping`
- [ ] Backup fichier `db.ts` actuel
- [ ] Créer fichier de test pour migration Dexie

### Étape 2 : Modification Schéma DB (Estimation : 1h)
- [ ] Modifier `/frontend/src/core/infrastructure/database/db.ts`
  - [ ] Ajouter interface `IdMapping`
  - [ ] Modifier `OfflineActorData` (ajouter `localId`)
  - [ ] Créer `OfflineConventionData`
  - [ ] Créer `OfflineCalendarData`
  - [ ] Créer `OfflineTransactionData`
  - [ ] Mettre à jour `SifcDatabase` (version 2)
- [ ] Tester migration locale
- [ ] Vérifier IndexedDB dans DevTools

### Étape 3 : Service de Résolution (Estimation : 1h)
- [ ] Créer `/frontend/src/core/infrastructure/services/idResolutionService.ts`
  - [ ] Implémenter `resolveActorId()`
  - [ ] Implémenter `resolveConventionId()`
  - [ ] Implémenter `resolveCalendarId()`
  - [ ] Implémenter `findActorByIdOrLocalId()`
- [ ] Tests unitaires du service

### Étape 4 : Modifier ActorRepository (Estimation : 2h)
- [ ] Modifier `/frontend/src/features/actor/infrastructure/repositories/ActorRepository.ts`
  - [ ] Créer méthode `createActorOffline()`
  - [ ] Modifier `handleCreate()` pour sync
  - [ ] Ajouter logique idMapping
  - [ ] Supprimer localId après sync
- [ ] Tester création acteur offline
- [ ] Tester sync acteur

### Étape 5 : Créer ConventionRepository (Estimation : 3h)
- [ ] Créer `/frontend/src/features/convention/infrastructure/repositories/ConventionRepository.ts`
  - [ ] Méthode `createConventionOffline()`
  - [ ] Méthode `handleCreate()` avec résolution IDs
  - [ ] Méthode `updateActorConventions()`
  - [ ] Méthode `updateActorsAfterSync()`
- [ ] Tester création convention offline
- [ ] Tester sync convention et mise à jour acteurs

### Étape 6 : Créer CalendarRepository (Estimation : 2h)
- [ ] Créer `/frontend/src/features/calendar/infrastructure/repositories/CalendarRepository.ts`
  - [ ] Similaire à ConventionRepository
  - [ ] Mettre à jour OPA.calendars[]
- [ ] Tester création calendrier offline
- [ ] Tester sync calendrier

### Étape 7 : Modifier TransactionRepository (Estimation : 2h)
- [ ] Modifier `/frontend/src/features/transaction/infrastructure/repositories/TransactionRepository.ts`
  - [ ] Méthode `createTransactionOffline()`
  - [ ] Modifier `handleCreate()` avec résolutions multiples
  - [ ] Suppression OfflineTransactionData après sync
- [ ] Tester création transaction offline
- [ ] Tester sync transaction

### Étape 8 : Modifier SyncService (Estimation : 1h)
- [ ] Modifier `/frontend/src/core/infrastructure/services/syncService.ts`
  - [ ] Implémenter `sortOperationsByDependency()`
  - [ ] Tester ordre de sync
- [ ] Vérifier logs de synchronisation

### Étape 9 : Tests End-to-End (Estimation : 4h)
- [ ] Test Scénario 1 : Acteur → Transaction
- [ ] Test Scénario 2 : Acteur → Convention → Transaction
- [ ] Test Scénario 3 : Acteur online → Transaction offline
- [ ] Test erreurs et retry
- [ ] Test nettoyage idMappings

### Étape 10 : Documentation et Code Review (Estimation : 1h)
- [ ] Documenter les nouvelles interfaces
- [ ] Ajouter commentaires dans le code
- [ ] Créer PR avec description détaillée
- [ ] Code review

---

## 📝 Estimation Totale

**Temps total estimé : 17-18 heures**

Répartition :
- Schéma DB et services : 2.5h
- Repositories (Actor, Convention, Calendar, Transaction) : 9h
- SyncService : 1h
- Tests : 4h
- Documentation : 1h

**Recommandation** : Implémenter par itération
- Itération 1 : Schéma DB + IdResolutionService + ActorRepository (4h)
- Itération 2 : TransactionRepository + Tests simples (4h)
- Itération 3 : ConventionRepository + CalendarRepository (5h)
- Itération 4 : SyncService + Tests E2E complets (4h)

---

**Document prêt pour implémentation** - Toutes les questions ont été répondues ✅
