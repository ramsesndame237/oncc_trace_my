# Architecture de Mapping d'IDs pour la Synchronisation Offline/Online

> **Date de création** : 20 Novembre 2025
> **Objectif** : Permettre au field_agent de créer des acteurs et transactions en mode offline, puis les synchroniser correctement lorsque la connexion revient.

---

## 📋 Table des matièresV

1. [Contexte et Problématique](#contexte-et-problématique)
2. [Analyse de l'Architecture Actuelle](#analyse-de-larchitecture-actuelle)
3. [Problème Identifié](#problème-identifié)
4. [Solution Proposée : Table de Mapping](#solution-proposée--table-de-mapping)
5. [Architecture Détaillée](#architecture-détaillée)
6. [Plan d'Implémentation](#plan-dimplémentation)
7. [Flux Complet avec Exemples](#flux-complet-avec-exemples)
8. [Tests et Validation](#tests-et-validation)

---

## 🎯 Contexte et Problématique

### Cas d'usage du field_agent

Le **field_agent** travaille principalement en **mode offline** (zones rurales sans connexion internet). Son workflow typique :

1. **Créer des acteurs** (producteurs) sur le terrain en mode offline
2. **Créer des transactions** (vente/achat) avec ces acteurs en mode offline
3. **Synchroniser** toutes les données lorsque la connexion internet revient

### Problème actuel

❌ **Les transactions ne peuvent pas être synchronisées** car elles référencent des acteurs avec des IDs locaux qui n'existent pas sur le serveur.

---

## 🔍 Analyse de l'Architecture Actuelle

### ✅ Ce qui existe déjà

1. **UUIDs côté backend** : PostgreSQL génère des UUIDs via `gen_random_uuid()`
2. **UUIDs côté frontend** : Génération via `uuid v4` pour les entités créées offline
3. **Outbox Pattern** : File d'attente (`pendingOperations`) pour la synchronisation
4. **IndexedDB (Dexie)** : Stockage local des acteurs, transactions, etc.
5. **SyncService** : Service central qui orchestre la synchronisation

### ❌ Ce qui manque

1. **Aucun mécanisme de mapping** entre IDs locaux et IDs serveur
2. **L'ID local est supprimé** lors de la synchronisation (ligne 612 d'ActorRepository)
3. **Pas de résolution des foreign keys** après synchronisation
4. **Les entités avec références** (transactions → acteurs) ne peuvent pas être synchronisées

---

## ⚠️ Problème Identifié

### Scénario problématique actuel

```
┌─────────────────────────────────────────────────────────────────────┐
│ JOUR 1 - MODE OFFLINE                                               │
└─────────────────────────────────────────────────────────────────────┘

1. Field agent crée un acteur (producteur)
   IndexedDB → offlineActors
   ┌────────────────────────────────────────┐
   │ id: "aaa-111-local"                    │
   │ familyName: "Dupont"                   │
   │ actorType: "PRODUCER"                  │
   └────────────────────────────────────────┘

   IndexedDB → pendingOperations
   ┌────────────────────────────────────────┐
   │ entityType: "actor"                    │
   │ operation: "create"                    │
   │ payload: { id: "aaa-111-local", ... }  │
   └────────────────────────────────────────┘

2. Field agent crée une transaction de vente
   IndexedDB → offlineTransactions
   ┌────────────────────────────────────────┐
   │ id: "bbb-222-local"                    │
   │ sellerId: "aaa-111-local" ← Référence  │
   │ buyerId: "ccc-333-server"              │
   │ transactionType: "SALE"                │
   └────────────────────────────────────────┘

   IndexedDB → pendingOperations
   ┌────────────────────────────────────────┐
   │ entityType: "transaction"              │
   │ operation: "create"                    │
   │ payload: {                             │
   │   id: "bbb-222-local",                 │
   │   sellerId: "aaa-111-local" ← ID local │
   │ }                                      │
   └────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ JOUR 2 - RETOUR EN LIGNE                                            │
└─────────────────────────────────────────────────────────────────────┘

3. Synchronisation de l'acteur
   ActorRepository.handleCreate()
   ┌────────────────────────────────────────┐
   │ 1. localId = "aaa-111-local"           │
   │ 2. delete payload.id  ← ❌ SUPPRIMÉ    │
   │ 3. POST /actors                        │
   │ 4. serverId = "zzz-999-server"         │
   │ 5. ❌ AUCUN MAPPING SAUVEGARDÉ         │
   └────────────────────────────────────────┘

4. Synchronisation de la transaction
   TransactionRepository.handleCreate()
   ┌────────────────────────────────────────┐
   │ 1. POST /transactions                  │
   │    {                                   │
   │      sellerId: "aaa-111-local"         │
   │    }                                   │
   │                                        │
   │ 2. ❌ ERREUR: Foreign key violation    │
   │    Actor "aaa-111-local" not found     │
   └────────────────────────────────────────┘

❌ RÉSULTAT: La transaction ne peut pas être créée!
```

---

## 💡 Solution Proposée : Table de Mapping

### Concept de base

Créer une **table de mapping** dans IndexedDB qui stocke la correspondance entre :

- **localId** : UUID généré en mode offline
- **serverId** : UUID retourné par le serveur après synchronisation

### Schéma de la table

```typescript
interface IdMapping {
  id?: number; // Auto-increment Dexie
  localId: string; // UUID local (ex: "aaa-111-local")
  serverId: string; // UUID serveur (ex: "zzz-999-server")
  entityType: string; // "actor", "transaction", "parcel", etc.
  userId: string; // ID de l'utilisateur (field_agent)
  syncedAt: number; // Timestamp de la synchronisation
  metadata?: {
    // Métadonnées pour debug
    entityName?: string; // Nom de l'acteur, code transaction, etc.
    [key: string]: unknown;
  };
}
```

### Index pour performance

```javascript
idMappings: "++id, localId, serverId, entityType, userId, [localId+entityType], [serverId+entityType], syncedAt";
```

- `localId` : Recherche rapide du serverId
- `[localId+entityType]` : Recherche combinée (ex: acteur avec cet ID local)
- `userId` : Filtrer par utilisateur
- `syncedAt` : Pour nettoyage des vieux mappings

---

## 🏗️ Architecture Détaillée

### 1. Nouvelle table IndexedDB : `idMappings`

**Fichier** : `frontend/src/core/infrastructure/database/db.ts`

```typescript
// ✅ Ajouter l'interface
export interface IdMapping {
  id?: number;
  localId: string;
  serverId: string;
  entityType: string;
  userId: string;
  syncedAt: number;
  metadata?: {
    entityName?: string;
    [key: string]: unknown;
  };
}

// ✅ Ajouter dans AppDatabase
class AppDatabase extends Dexie {
  // ... tables existantes
  pendingOperations!: EntityTable<PendingOperation, "id">;
  offlineActors!: EntityTable<OfflineActorData, "id">;
  offlineTransactions!: EntityTable<OfflineTransactionData, "id">;

  // ✅ NOUVELLE TABLE
  idMappings!: EntityTable<IdMapping, "id">;

  constructor() {
    super("sifc_manager_db");

    // Version actuelle (exemple: 19)
    this.version(19).stores({
      // ... stores existants
    });

    // ✅ NOUVELLE VERSION 20 pour ajouter idMappings
    this.version(20).stores({
      // Garder toutes les tables existantes
      pendingOperations:
        "++id, entityId, entityType, operation, userId, timestamp",
      offlineActors:
        "id, actorType, familyName, givenName, locationCode, status",
      offlineTransactions:
        "id, code, transactionType, sellerId, buyerId, campaignId, status",
      // ... autres tables

      // ✅ Ajouter la nouvelle table
      idMappings:
        "++id, localId, serverId, entityType, userId, [localId+entityType], [serverId+entityType], syncedAt",
    });
  }
}
```

**⚠️ Important** : Incrémenter le numéro de version Dexie pour déclencher la migration.

---

### 2. Service de résolution d'IDs

**Fichier** : `frontend/src/core/infrastructure/services/idMappingService.ts` (NOUVEAU)

```typescript
import { db, IdMapping } from "@/core/infrastructure/database/db";

/**
 * Service centralisé pour gérer le mapping entre IDs locaux et IDs serveur
 */
export class IdMappingService {
  /**
   * Sauvegarde le mapping entre un ID local et un ID serveur
   * @param localId UUID généré en mode offline
   * @param serverId UUID retourné par le serveur
   * @param entityType Type d'entité ("actor", "transaction", etc.)
   * @param userId ID de l'utilisateur qui a créé l'entité
   * @param metadata Métadonnées optionnelles pour debug
   */
  async saveMapping(
    localId: string,
    serverId: string,
    entityType: string,
    userId: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await db.idMappings.add({
      localId,
      serverId,
      entityType,
      userId,
      syncedAt: Date.now(),
      metadata,
    });

    console.log(
      `✅ Mapping sauvegardé: ${localId} → ${serverId} (${entityType})`
    );
  }

  /**
   * Résout un ID local vers un ID serveur
   * @param localId UUID local à résoudre
   * @param entityType Type d'entité
   * @returns L'ID serveur si mapping existe, sinon l'ID original (déjà un ID serveur)
   */
  async resolveId(localId: string, entityType: string): Promise<string> {
    const mapping = await db.idMappings
      .where(["localId", "entityType"])
      .equals([localId, entityType])
      .first();

    if (mapping) {
      console.log(`🔄 ID résolu: ${localId} → ${mapping.serverId}`);
      return mapping.serverId;
    }

    // Si pas de mapping, c'est probablement déjà un ID serveur
    console.log(`⚠️ Pas de mapping pour ${localId}, utilisation directe`);
    return localId;
  }

  /**
   * Résout plusieurs IDs en une seule fois
   * @param ids Liste des IDs à résoudre
   * @returns Map avec localId → serverId
   */
  async resolveIds(
    ids: { localId: string; entityType: string }[]
  ): Promise<Map<string, string>> {
    const result = new Map<string, string>();

    for (const { localId, entityType } of ids) {
      const serverId = await this.resolveId(localId, entityType);
      result.set(localId, serverId);
    }

    return result;
  }

  /**
   * Vérifie si un ID local a déjà été synchronisé
   * @param localId UUID local
   * @param entityType Type d'entité
   * @returns true si mapping existe
   */
  async hasMapping(localId: string, entityType: string): Promise<boolean> {
    const count = await db.idMappings
      .where(["localId", "entityType"])
      .equals([localId, entityType])
      .count();

    return count > 0;
  }

  /**
   * Récupère tous les mappings pour un utilisateur
   * @param userId ID de l'utilisateur
   * @param entityType Type d'entité (optionnel)
   * @returns Liste des mappings
   */
  async getMappingsForUser(
    userId: string,
    entityType?: string
  ): Promise<IdMapping[]> {
    let query = db.idMappings.where("userId").equals(userId);

    const mappings = await query.toArray();

    if (entityType) {
      return mappings.filter((m) => m.entityType === entityType);
    }

    return mappings;
  }

  /**
   * Nettoie les mappings anciens (maintenance)
   * @param daysOld Nombre de jours (défaut: 30)
   * @returns Nombre de mappings supprimés
   */
  async cleanOldMappings(daysOld: number = 30): Promise<number> {
    const cutoffTime = Date.now() - daysOld * 24 * 60 * 60 * 1000;

    const oldMappings = await db.idMappings
      .where("syncedAt")
      .below(cutoffTime)
      .toArray();

    await db.idMappings.bulkDelete(oldMappings.map((m) => m.id!));

    console.log(`🧹 Nettoyage: ${oldMappings.length} mappings supprimés`);
    return oldMappings.length;
  }

  /**
   * Supprime tous les mappings d'un utilisateur (utile lors de la déconnexion)
   * @param userId ID de l'utilisateur
   * @returns Nombre de mappings supprimés
   */
  async clearMappingsForUser(userId: string): Promise<number> {
    const mappings = await db.idMappings
      .where("userId")
      .equals(userId)
      .toArray();

    await db.idMappings.bulkDelete(mappings.map((m) => m.id!));

    console.log(
      `🧹 Mappings supprimés pour utilisateur ${userId}: ${mappings.length}`
    );
    return mappings.length;
  }
}

// Export singleton
export const idMappingService = new IdMappingService();
```

---

### 3. Modification ActorRepository

**Fichier** : `frontend/src/features/actor/infrastructure/repositories/ActorRepository.ts`

**Changements à apporter** :

```typescript
import { idMappingService } from "@/core/infrastructure/services/idMappingService";

private async handleCreate(operation: PendingOperation): Promise<void> {
  const { documents, ...payload } = operation.payload as unknown as CreateActorRequest;

  try {
    // ✅ ÉTAPE 1: Sauvegarder l'ID local AVANT de le supprimer
    const localId = (payload as any).id; // UUID généré en offline

    // Nettoyer le payload
    const cleanPayload = { ...payload };
    delete (cleanPayload as Record<string, unknown>).id;
    delete (cleanPayload as Record<string, unknown>).documents;

    // ... autres nettoyages existants (phone, email, etc.)

    // ✅ ÉTAPE 2: Créer l'acteur sur le serveur
    const actorResponse = await apiClient.post<{
      actor: ActorResponse;
      parcels: unknown[];
      summary: { parcelsCreated: number };
    }>("/actors", cleanPayload);

    if (!actorResponse.success || !actorResponse.data) {
      throw new Error("Échec de la création de l'acteur");
    }

    const serverId = actorResponse.data.actor.id; // UUID retourné par le serveur

    // ✅ ÉTAPE 3: NOUVEAU - Sauvegarder le mapping local → serveur
    if (localId && localId !== serverId) {
      const userId = await this.getCurrentUserId();
      if (userId) {
        await idMappingService.saveMapping(
          localId,
          serverId,
          'actor',
          userId,
          {
            entityName: `${cleanPayload.familyName} ${cleanPayload.givenName}`,
            actorType: cleanPayload.actorType,
          }
        );
      }
    }

    // ✅ ÉTAPE 4: NOUVEAU - Mettre à jour l'acteur local avec l'ID serveur
    // Cela permet aux transactions locales de voir le bon ID
    await db.offlineActors
      .where('id')
      .equals(localId)
      .modify({ id: serverId });

    console.log(`✅ Acteur créé: local ${localId} → serveur ${serverId}`);

    // ÉTAPE 5: Upload documents (code existant)
    if (documents && documents.length > 0) {
      try {
        const files = documents.map((doc) =>
          this.base64ToFile(doc.base64Data, doc.mimeType, doc.fileName)
        );
        const documentTypes = documents.map((doc) => doc.documentType);

        await this.documentRepository.uploadDocuments(
          {
            files,
            documentableType: "Actor",
            documentableId: serverId, // ✅ Utiliser l'ID serveur
            documentTypes,
          },
          true
        );
      } catch (docError) {
        console.error("Erreur lors de l'upload des documents:", docError);
      }
    }
  } catch (err) {
    throw err;
  }
}
```

**Points clés** :

1. ✅ Sauvegarder `localId` avant de le supprimer
2. ✅ Créer le mapping après réception du `serverId`
3. ✅ Mettre à jour l'entité locale avec le `serverId`

---

### 4. Modification TransactionRepository

**Fichier** : `frontend/src/features/transaction/infrastructure/repositories/TransactionRepository.ts`

**Changements à apporter** :

```typescript
import { idMappingService } from "@/core/infrastructure/services/idMappingService";

private async handleCreate(operation: PendingOperation): Promise<void> {
  const { documents, ...payload } = operation.payload as unknown as CreateTransactionRequest;

  try {
    const localId = (payload as any).id;

    // ✅ ÉTAPE 1: Résoudre les IDs des acteurs AVANT l'envoi au serveur
    console.log(`🔄 Résolution des IDs pour transaction ${localId}`);
    console.log(`   Seller ID original: ${payload.sellerId}`);
    console.log(`   Buyer ID original: ${payload.buyerId}`);

    const resolvedSellerId = await idMappingService.resolveId(
      payload.sellerId,
      'actor'
    );
    const resolvedBuyerId = await idMappingService.resolveId(
      payload.buyerId,
      'actor'
    );

    console.log(`   Seller ID résolu: ${resolvedSellerId}`);
    console.log(`   Buyer ID résolu: ${resolvedBuyerId}`);

    // ✅ ÉTAPE 2: Vérifier que les acteurs ont bien été synchronisés
    // Si resolveId retourne le même ID, ça peut signifier:
    //   - C'est déjà un ID serveur (OK)
    //   - Ou l'acteur n'a pas encore été synchronisé (PROBLÈME)

    // Vérification pour le seller
    if (resolvedSellerId === payload.sellerId) {
      const hasMapping = await idMappingService.hasMapping(payload.sellerId, 'actor');
      if (!hasMapping) {
        // Vérifier si c'est un UUID qui semble local (contient "local" ou autre pattern)
        // Ou vérifier si l'acteur existe dans offlineActors mais pas encore sync
        const offlineActor = await db.offlineActors.get(payload.sellerId);
        if (offlineActor) {
          throw new ApiError(
            'ACTOR_NOT_SYNCED',
            `L'acteur vendeur "${offlineActor.familyName} ${offlineActor.givenName}" doit être synchronisé avant la transaction`
          );
        }
      }
    }

    // Vérification pour le buyer
    if (resolvedBuyerId === payload.buyerId) {
      const hasMapping = await idMappingService.hasMapping(payload.buyerId, 'actor');
      if (!hasMapping) {
        const offlineActor = await db.offlineActors.get(payload.buyerId);
        if (offlineActor) {
          throw new ApiError(
            'ACTOR_NOT_SYNCED',
            `L'acteur acheteur "${offlineActor.familyName} ${offlineActor.givenName}" doit être synchronisé avant la transaction`
          );
        }
      }
    }

    // ✅ ÉTAPE 3: Préparer le payload avec les IDs résolus
    const cleanPayload = {
      ...payload,
      sellerId: resolvedSellerId,  // ✅ ID serveur
      buyerId: resolvedBuyerId,    // ✅ ID serveur
    };

    delete (cleanPayload as any).id;
    delete (cleanPayload as any).documents;

    console.log(`✅ Transaction prête pour envoi avec IDs résolus`);

    // ✅ ÉTAPE 4: Créer la transaction sur le serveur
    const transactionResponse = await apiClient.post<{
      transaction: TransactionResponse;
      products: unknown[];
    }>("/transactions", cleanPayload);

    if (!transactionResponse.success || !transactionResponse.data) {
      throw new Error("Échec de la création de la transaction");
    }

    const serverId = transactionResponse.data.transaction.id;

    // ✅ ÉTAPE 5: Sauvegarder le mapping pour la transaction aussi
    if (localId && localId !== serverId) {
      const userId = await this.getCurrentUserId();
      if (userId) {
        await idMappingService.saveMapping(
          localId,
          serverId,
          'transaction',
          userId,
          {
            code: transactionResponse.data.transaction.code,
            transactionType: cleanPayload.transactionType,
          }
        );
      }
    }

    // ✅ ÉTAPE 6: Mettre à jour la transaction locale
    await db.offlineTransactions
      .where('id')
      .equals(localId)
      .modify({
        id: serverId,
        sellerId: resolvedSellerId,
        buyerId: resolvedBuyerId,
      });

    console.log(`✅ Transaction créée: local ${localId} → serveur ${serverId}`);

    // ÉTAPE 7: Upload documents si présents (code existant)
    if (documents && documents.length > 0) {
      // ... code existant
    }

  } catch (err) {
    throw err;
  }
}
```

**Points clés** :

1. ✅ Résoudre **tous** les IDs de références (sellerId, buyerId)
2. ✅ Vérifier que les acteurs ont été synchronisés
3. ✅ Lancer une erreur claire si acteur pas encore sync
4. ✅ Sauvegarder le mapping de la transaction
5. ✅ Mettre à jour la transaction locale

---

### 5. Ordre de synchronisation

**CRITIQUE** : Les opérations doivent être synchronisées dans le bon ordre.

Le `SyncService` utilise déjà `orderBy("timestamp")`, ce qui est correct :

```typescript
// syncService.ts ligne 86-88
let pendingOps = await db.pendingOperations.orderBy("timestamp").toArray();
```

✅ **Cela garantit que** :

1. L'acteur créé en premier sera synchronisé en premier
2. La transaction créée après sera synchronisée après

---

## 📝 Plan d'Implémentation

### Itération 1 : Infrastructure de base

**Objectif** : Mettre en place la table de mapping et le service

**Tâches** :

- [ ] Créer l'interface `IdMapping` dans `db.ts`
- [ ] Ajouter la table `idMappings` dans AppDatabase (version 20)
- [ ] Créer le fichier `idMappingService.ts`
- [ ] Implémenter les méthodes de base :
  - `saveMapping()`
  - `resolveId()`
  - `hasMapping()`

**Tests** :

```typescript
// Test manuel dans la console
import { idMappingService } from "@/core/infrastructure/services/idMappingService";

// Sauvegarder un mapping
await idMappingService.saveMapping(
  "local-123",
  "server-456",
  "actor",
  "user-id",
  { entityName: "Test Actor" }
);

// Résoudre un ID
const serverId = await idMappingService.resolveId("local-123", "actor");
console.log(serverId); // Devrait afficher 'server-456'
```

**Validation** :

- ✅ La table `idMappings` apparaît dans IndexedDB (DevTools → Application → IndexedDB)
- ✅ Les mappings sont sauvegardés correctement
- ✅ La résolution d'ID fonctionne

---

### Itération 2 : Modification ActorRepository

**Objectif** : Sauvegarder le mapping lors de la création d'un acteur

**Tâches** :

- [ ] Importer `idMappingService` dans `ActorRepository.ts`
- [ ] Modifier `handleCreate()` :
  - Sauvegarder `localId` avant suppression
  - Appeler `saveMapping()` après réception du `serverId`
  - Mettre à jour l'acteur local avec `serverId`
- [ ] Ajouter des logs pour debugging

**Tests** :

1. Créer un acteur en mode offline
2. Passer en mode online
3. Déclencher la synchronisation
4. Vérifier dans IndexedDB :
   - Table `idMappings` contient le mapping
   - Table `offlineActors` a l'ID mis à jour

**Validation** :

- ✅ Le mapping est créé automatiquement
- ✅ L'acteur local a le bon `serverId`
- ✅ Pas de régression (acteurs créés online fonctionnent toujours)

---

### Itération 3 : Modification TransactionRepository

**Objectif** : Résoudre les IDs avant synchronisation

**Tâches** :

- [ ] Importer `idMappingService` dans `TransactionRepository.ts`
- [ ] Modifier `handleCreate()` :
  - Résoudre `sellerId` et `buyerId`
  - Vérifier que les acteurs ont été synchronisés
  - Utiliser les IDs résolus dans le payload
  - Sauvegarder le mapping de la transaction
- [ ] Gérer le cas d'erreur "acteur non synchronisé"

**Tests** :

1. Créer un acteur offline (ID: `aaa-111`)
2. Créer une transaction offline avec `sellerId: aaa-111`
3. Passer online et synchroniser
4. Vérifier :
   - L'acteur est créé avec un nouvel ID serveur (`zzz-999`)
   - La transaction est créée avec `sellerId: zzz-999`

**Validation** :

- ✅ Les transactions se synchronisent correctement
- ✅ Les foreign keys sont valides
- ✅ Erreur claire si acteur pas encore synchronisé

---

### Itération 4 : Autres entités avec références

**Objectif** : Appliquer le même pattern aux parcelles, etc.

**Entités concernées** :

- **Parcelles** (`Parcel`) : Référence `actorId`
- **Autres** : À identifier

**Pattern à suivre** :

```typescript
// Pour toute entité avec référence à un acteur
const resolvedActorId = await idMappingService.resolveId(
  payload.actorId,
  "actor"
);

cleanPayload.actorId = resolvedActorId;
```

---

### Itération 5 : Tests end-to-end

**Scénarios de test** :

**Scénario 1 : Flux nominal**

```
1. Mode offline
2. Créer acteur A
3. Créer transaction avec acteur A
4. Mode online
5. Synchroniser
6. ✅ Vérifier que tout est créé correctement
```

**Scénario 2 : Transaction avec acteur non synchronisé**

```
1. Mode offline
2. Créer acteur A
3. Créer transaction avec acteur A
4. Mode online
5. Supprimer manuellement l'opération de création de l'acteur A
6. Tenter de synchroniser la transaction
7. ✅ Vérifier qu'une erreur claire est affichée
```

**Scénario 3 : Mixte online/offline**

```
1. Mode offline
2. Créer acteur A (offline)
3. Mode online
4. Synchroniser acteur A
5. Mode offline
6. Créer transaction avec acteur A (qui a maintenant un serverId)
7. Mode online
8. Synchroniser transaction
9. ✅ Vérifier que la transaction utilise le serverId
```

---

## 🔄 Flux Complet avec Exemples

### Exemple détaillé : Field agent en mission

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ LUNDI MATIN - ZONE RURALE (PAS DE CONNEXION)                                │
└─────────────────────────────────────────────────────────────────────────────┘

09:00 - Field agent arrive chez un producteur
        Crée un nouvel acteur: Jean MBALLA

        📱 IndexedDB → offlineActors
        ┌──────────────────────────────────────────────────────┐
        │ id: "aaa-111-local-uuid"                             │
        │ familyName: "MBALLA"                                 │
        │ givenName: "Jean"                                    │
        │ actorType: "PRODUCER"                                │
        │ locationCode: "CM-OU-MIF-BAF"                        │
        │ phone: "+237678901234"                               │
        └──────────────────────────────────────────────────────┘

        📱 IndexedDB → pendingOperations
        ┌──────────────────────────────────────────────────────┐
        │ id: 1                                                │
        │ entityType: "actor"                                  │
        │ operation: "create"                                  │
        │ entityId: "aaa-111-local-uuid"                       │
        │ timestamp: 1735567890000                             │
        │ userId: "field-agent-001"                            │
        │ payload: {                                           │
        │   id: "aaa-111-local-uuid",                          │
        │   familyName: "MBALLA",                              │
        │   givenName: "Jean",                                 │
        │   ...                                                │
        │ }                                                    │
        └──────────────────────────────────────────────────────┘

10:30 - Enregistre une vente de cacao
        Transaction: Jean MBALLA vend à un acheteur (déjà en ligne)

        📱 IndexedDB → offlineTransactions
        ┌──────────────────────────────────────────────────────┐
        │ id: "bbb-222-local-uuid"                             │
        │ code: "TXN-2025-001"                                 │
        │ transactionType: "SALE"                              │
        │ locationType: "FARM"                                 │
        │ sellerId: "aaa-111-local-uuid" ← Acteur créé ce matin│
        │ buyerId: "ccc-333-server-uuid" ← Acteur en ligne     │
        │ transactionDate: "2025-01-20"                        │
        │ products: [...]                                      │
        └──────────────────────────────────────────────────────┘

        📱 IndexedDB → pendingOperations
        ┌──────────────────────────────────────────────────────┐
        │ id: 2                                                │
        │ entityType: "transaction"                            │
        │ operation: "create"                                  │
        │ entityId: "bbb-222-local-uuid"                       │
        │ timestamp: 1735573200000  ← Plus récent              │
        │ userId: "field-agent-001"                            │
        │ payload: {                                           │
        │   id: "bbb-222-local-uuid",                          │
        │   sellerId: "aaa-111-local-uuid", ← ID local !       │
        │   buyerId: "ccc-333-server-uuid",                    │
        │   ...                                                │
        │ }                                                    │
        └──────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ LUNDI APRÈS-MIDI - RETOUR AU BUREAU (CONNEXION INTERNET)                    │
└─────────────────────────────────────────────────────────────────────────────┘

14:00 - Connexion WiFi détectée
        Synchronisation automatique déclenchée

        🔄 SyncService.processQueue()

        Opérations triées par timestamp (ordre chronologique):
        1. id: 1, entityType: "actor", timestamp: 1735567890000
        2. id: 2, entityType: "transaction", timestamp: 1735573200000

14:01 - Synchronisation de l'acteur (opération #1)

        📡 ActorRepository.handleCreate()

        ÉTAPE 1: Extraction du localId
        ┌──────────────────────────────────────────────────────┐
        │ const localId = payload.id;                          │
        │ // localId = "aaa-111-local-uuid"                    │
        └──────────────────────────────────────────────────────┘

        ÉTAPE 2: Nettoyage et envoi
        ┌──────────────────────────────────────────────────────┐
        │ delete cleanPayload.id;                              │
        │                                                      │
        │ POST /api/v1/actors                                  │
        │ {                                                    │
        │   familyName: "MBALLA",                              │
        │   givenName: "Jean",                                 │
        │   actorType: "PRODUCER",                             │
        │   ...                                                │
        │ }                                                    │
        └──────────────────────────────────────────────────────┘

        ÉTAPE 3: Réponse du serveur
        ┌──────────────────────────────────────────────────────┐
        │ 200 OK                                               │
        │ {                                                    │
        │   success: true,                                     │
        │   data: {                                            │
        │     actor: {                                         │
        │       id: "zzz-999-server-uuid", ← Nouvel UUID !     │
        │       familyName: "MBALLA",                          │
        │       givenName: "Jean",                             │
        │       ...                                            │
        │     }                                                │
        │   }                                                  │
        │ }                                                    │
        └──────────────────────────────────────────────────────┘

        ÉTAPE 4: ✅ NOUVEAU - Sauvegarde du mapping
        ┌──────────────────────────────────────────────────────┐
        │ const serverId = actorResponse.data.actor.id;        │
        │ // serverId = "zzz-999-server-uuid"                  │
        │                                                      │
        │ await idMappingService.saveMapping(                  │
        │   "aaa-111-local-uuid",     // localId               │
        │   "zzz-999-server-uuid",    // serverId              │
        │   "actor",                  // entityType            │
        │   "field-agent-001",        // userId                │
        │   {                         // metadata              │
        │     entityName: "MBALLA Jean",                       │
        │     actorType: "PRODUCER"                            │
        │   }                                                  │
        │ );                                                   │
        └──────────────────────────────────────────────────────┘

        📱 IndexedDB → idMappings (NOUVEAU)
        ┌──────────────────────────────────────────────────────┐
        │ id: 1                                                │
        │ localId: "aaa-111-local-uuid"                        │
        │ serverId: "zzz-999-server-uuid"                      │
        │ entityType: "actor"                                  │
        │ userId: "field-agent-001"                            │
        │ syncedAt: 1735585200000                              │
        │ metadata: {                                          │
        │   entityName: "MBALLA Jean",                         │
        │   actorType: "PRODUCER"                              │
        │ }                                                    │
        └──────────────────────────────────────────────────────┘

        ÉTAPE 5: ✅ NOUVEAU - Mise à jour de l'acteur local
        ┌──────────────────────────────────────────────────────┐
        │ await db.offlineActors                               │
        │   .where('id')                                       │
        │   .equals("aaa-111-local-uuid")                      │
        │   .modify({ id: "zzz-999-server-uuid" });            │
        └──────────────────────────────────────────────────────┘

        📱 IndexedDB → offlineActors (MIS À JOUR)
        ┌──────────────────────────────────────────────────────┐
        │ id: "zzz-999-server-uuid" ← Mis à jour !             │
        │ familyName: "MBALLA"                                 │
        │ givenName: "Jean"                                    │
        │ actorType: "PRODUCER"                                │
        │ locationCode: "CM-OU-MIF-BAF"                        │
        │ phone: "+237678901234"                               │
        └──────────────────────────────────────────────────────┘

        ÉTAPE 6: Suppression de l'opération pending
        ┌──────────────────────────────────────────────────────┐
        │ await db.pendingOperations.delete(1);                │
        │                                                      │
        │ ✅ Acteur synchronisé avec succès                    │
        └──────────────────────────────────────────────────────┘

14:02 - Synchronisation de la transaction (opération #2)

        📡 TransactionRepository.handleCreate()

        ÉTAPE 1: Résolution des IDs d'acteurs
        ┌──────────────────────────────────────────────────────┐
        │ payload.sellerId = "aaa-111-local-uuid"              │
        │ payload.buyerId = "ccc-333-server-uuid"              │
        │                                                      │
        │ const resolvedSellerId =                             │
        │   await idMappingService.resolveId(                  │
        │     "aaa-111-local-uuid",                            │
        │     "actor"                                          │
        │   );                                                 │
        │                                                      │
        │ // Recherche dans idMappings:                        │
        │ // localId="aaa-111-local-uuid" + entityType="actor" │
        │ // → Trouvé: serverId="zzz-999-server-uuid" ✅       │
        │                                                      │
        │ resolvedSellerId = "zzz-999-server-uuid"             │
        │                                                      │
        │ const resolvedBuyerId =                              │
        │   await idMappingService.resolveId(                  │
        │     "ccc-333-server-uuid",                           │
        │     "actor"                                          │
        │   );                                                 │
        │                                                      │
        │ // Pas de mapping trouvé (déjà un ID serveur)        │
        │ // → Retourne l'ID original                          │
        │                                                      │
        │ resolvedBuyerId = "ccc-333-server-uuid"              │
        └──────────────────────────────────────────────────────┘

        ÉTAPE 2: Préparation du payload avec IDs résolus
        ┌──────────────────────────────────────────────────────┐
        │ const cleanPayload = {                               │
        │   ...payload,                                        │
        │   sellerId: "zzz-999-server-uuid", ✅ ID résolu      │
        │   buyerId: "ccc-333-server-uuid",                    │
        │ };                                                   │
        │                                                      │
        │ delete cleanPayload.id;                              │
        └──────────────────────────────────────────────────────┘

        ÉTAPE 3: Envoi au serveur
        ┌──────────────────────────────────────────────────────┐
        │ POST /api/v1/transactions                            │
        │ {                                                    │
        │   transactionType: "SALE",                           │
        │   locationType: "FARM",                              │
        │   sellerId: "zzz-999-server-uuid", ✅                │
        │   buyerId: "ccc-333-server-uuid",                    │
        │   transactionDate: "2025-01-20",                     │
        │   products: [...]                                    │
        │ }                                                    │
        └──────────────────────────────────────────────────────┘

        ÉTAPE 4: Réponse du serveur
        ┌──────────────────────────────────────────────────────┐
        │ 200 OK                                               │
        │ {                                                    │
        │   success: true,                                     │
        │   data: {                                            │
        │     transaction: {                                   │
        │       id: "ddd-444-server-uuid",                     │
        │       code: "TXN-2025-001234",                       │
        │       sellerId: "zzz-999-server-uuid", ✅            │
        │       buyerId: "ccc-333-server-uuid",                │
        │       ...                                            │
        │     }                                                │
        │   }                                                  │
        │ }                                                    │
        │                                                      │
        │ ✅ Transaction créée avec succès !                   │
        │ ✅ Foreign keys valides !                            │
        └──────────────────────────────────────────────────────┘

        ÉTAPE 5: Sauvegarde du mapping transaction
        ┌──────────────────────────────────────────────────────┐
        │ await idMappingService.saveMapping(                  │
        │   "bbb-222-local-uuid",                              │
        │   "ddd-444-server-uuid",                             │
        │   "transaction",                                     │
        │   "field-agent-001",                                 │
        │   {                                                  │
        │     code: "TXN-2025-001234",                         │
        │     transactionType: "SALE"                          │
        │   }                                                  │
        │ );                                                   │
        └──────────────────────────────────────────────────────┘

        ÉTAPE 6: Mise à jour de la transaction locale
        ┌──────────────────────────────────────────────────────┐
        │ await db.offlineTransactions                         │
        │   .where('id')                                       │
        │   .equals("bbb-222-local-uuid")                      │
        │   .modify({                                          │
        │     id: "ddd-444-server-uuid",                       │
        │     sellerId: "zzz-999-server-uuid",                 │
        │     buyerId: "ccc-333-server-uuid"                   │
        │   });                                                │
        └──────────────────────────────────────────────────────┘

        ÉTAPE 7: Suppression de l'opération pending
        ┌──────────────────────────────────────────────────────┐
        │ await db.pendingOperations.delete(2);                │
        │                                                      │
        │ ✅ Transaction synchronisée avec succès              │
        └──────────────────────────────────────────────────────┘

14:03 - Synchronisation terminée

        📊 Résultat final dans IndexedDB:

        idMappings (2 entrées)
        ┌──────────────────────────────────────────────────────┐
        │ 1. localId: "aaa-111-local-uuid"                     │
        │    serverId: "zzz-999-server-uuid"                   │
        │    entityType: "actor"                               │
        │                                                      │
        │ 2. localId: "bbb-222-local-uuid"                     │
        │    serverId: "ddd-444-server-uuid"                   │
        │    entityType: "transaction"                         │
        └──────────────────────────────────────────────────────┘

        offlineActors
        ┌──────────────────────────────────────────────────────┐
        │ id: "zzz-999-server-uuid" ✅                         │
        │ familyName: "MBALLA"                                 │
        │ givenName: "Jean"                                    │
        └──────────────────────────────────────────────────────┘

        offlineTransactions
        ┌──────────────────────────────────────────────────────┐
        │ id: "ddd-444-server-uuid" ✅                         │
        │ code: "TXN-2025-001234"                              │
        │ sellerId: "zzz-999-server-uuid" ✅                   │
        │ buyerId: "ccc-333-server-uuid"                       │
        └──────────────────────────────────────────────────────┘

        pendingOperations
        ┌──────────────────────────────────────────────────────┐
        │ (vide - toutes les opérations synchronisées)         │
        └──────────────────────────────────────────────────────┘

        🎉 Succès total !
        ✅ Acteur créé en ligne
        ✅ Transaction créée en ligne
        ✅ Toutes les références sont correctes
```

---

## 🧪 Tests et Validation

### Tests unitaires

**Fichier** : `frontend/src/core/infrastructure/services/__tests__/idMappingService.test.ts`

```typescript
import { idMappingService } from "../idMappingService";
import { db } from "@/core/infrastructure/database/db";

describe("IdMappingService", () => {
  beforeEach(async () => {
    // Nettoyer la table avant chaque test
    await db.idMappings.clear();
  });

  it("devrait sauvegarder un mapping", async () => {
    await idMappingService.saveMapping(
      "local-123",
      "server-456",
      "actor",
      "user-1",
      { entityName: "Test" }
    );

    const mappings = await db.idMappings.toArray();
    expect(mappings).toHaveLength(1);
    expect(mappings[0].localId).toBe("local-123");
    expect(mappings[0].serverId).toBe("server-456");
  });

  it("devrait résoudre un ID local vers un ID serveur", async () => {
    await idMappingService.saveMapping(
      "local-123",
      "server-456",
      "actor",
      "user-1"
    );

    const serverId = await idMappingService.resolveId("local-123", "actor");
    expect(serverId).toBe("server-456");
  });

  it("devrait retourner l'ID original si pas de mapping", async () => {
    const serverId = await idMappingService.resolveId("server-789", "actor");
    expect(serverId).toBe("server-789");
  });

  it("devrait vérifier l'existence d'un mapping", async () => {
    await idMappingService.saveMapping(
      "local-123",
      "server-456",
      "actor",
      "user-1"
    );

    const exists = await idMappingService.hasMapping("local-123", "actor");
    expect(exists).toBe(true);

    const notExists = await idMappingService.hasMapping("local-999", "actor");
    expect(notExists).toBe(false);
  });
});
```

### Tests d'intégration

**Scénario 1 : Acteur offline → Online**

```typescript
describe("Actor synchronization with ID mapping", () => {
  it("devrait créer un mapping lors de la sync d'un acteur", async () => {
    // 1. Créer un acteur offline
    const localId = uuid();
    const actorData = {
      id: localId,
      familyName: "Test",
      givenName: "Actor",
      actorType: "PRODUCER",
      locationCode: "CM-OU-MIF-BAF",
    };

    // Sauvegarder en local
    await db.offlineActors.add(actorData);

    // Ajouter à la file de sync
    await syncService.queueOperation(
      {
        entityId: localId,
        entityType: "actor",
        operation: "create",
        payload: actorData,
      },
      "user-1"
    );

    // 2. Synchroniser
    await syncService.processQueue();

    // 3. Vérifier le mapping
    const mapping = await db.idMappings
      .where(["localId", "entityType"])
      .equals([localId, "actor"])
      .first();

    expect(mapping).toBeDefined();
    expect(mapping!.localId).toBe(localId);
    expect(mapping!.serverId).toBeTruthy();
    expect(mapping!.serverId).not.toBe(localId);

    // 4. Vérifier que l'acteur local a été mis à jour
    const actor = await db.offlineActors.get(mapping!.serverId);
    expect(actor).toBeDefined();
    expect(actor!.familyName).toBe("Test");
  });
});
```

**Scénario 2 : Transaction avec résolution d'IDs**

```typescript
describe("Transaction synchronization with ID resolution", () => {
  it("devrait résoudre les IDs d'acteurs avant de créer une transaction", async () => {
    // 1. Créer un acteur et son mapping
    const localActorId = uuid();
    const serverActorId = uuid();

    await idMappingService.saveMapping(
      localActorId,
      serverActorId,
      "actor",
      "user-1"
    );

    // 2. Créer une transaction avec l'ID local
    const localTxnId = uuid();
    const txnData = {
      id: localTxnId,
      transactionType: "SALE",
      sellerId: localActorId, // ID local
      buyerId: "existing-buyer-id",
      transactionDate: "2025-01-20",
      products: [],
    };

    await syncService.queueOperation(
      {
        entityId: localTxnId,
        entityType: "transaction",
        operation: "create",
        payload: txnData,
      },
      "user-1"
    );

    // 3. Synchroniser
    await syncService.processQueue();

    // 4. Vérifier que la transaction a été créée avec l'ID résolu
    // (Nécessite un mock de l'API pour vérifier le payload envoyé)
    expect(mockApiClient.post).toHaveBeenCalledWith(
      "/transactions",
      expect.objectContaining({
        sellerId: serverActorId, // ID résolu
      })
    );
  });
});
```

---

## 📊 Métriques de succès

### Critères de validation

✅ **L'implémentation est réussie si** :

1. **Mapping automatique**

   - Les mappings sont créés automatiquement lors de la sync d'acteurs
   - Les mappings sont persistés dans IndexedDB
   - Les mappings survivent à un rechargement de page

2. **Résolution d'IDs**

   - Les IDs locaux sont correctement résolus en IDs serveur
   - Les transactions avec acteurs offline se synchronisent sans erreur
   - Les foreign keys sont valides côté serveur

3. **Performance**

   - La résolution d'ID prend moins de 10ms
   - Pas de régression sur le temps de synchronisation global
   - Pas de ralentissement perceptible par l'utilisateur

4. **Robustesse**

   - Gestion des erreurs si acteur pas encore synchronisé
   - Messages d'erreur clairs pour l'utilisateur
   - Pas de corruption de données en cas d'erreur

5. **Maintenance**
   - Les vieux mappings peuvent être nettoyés
   - Les mappings d'un utilisateur peuvent être supprimés (déconnexion)
   - Les logs permettent de débugger facilement

---

## 🔧 Outils de debug

### Console debug helper

```typescript
// À ajouter dans la console du navigateur pour debug

// Voir tous les mappings
async function debugMappings() {
  const mappings = await db.idMappings.toArray();
  console.table(mappings);
}

// Voir les mappings d'un utilisateur
async function debugUserMappings(userId: string) {
  const mappings = await db.idMappings.where("userId").equals(userId).toArray();
  console.table(mappings);
}

// Résoudre un ID manuellement
async function debugResolve(localId: string, entityType: string) {
  const serverId = await idMappingService.resolveId(localId, entityType);
  console.log(`${localId} → ${serverId}`);
}

// Vérifier la cohérence des données
async function debugCheckConsistency() {
  const actors = await db.offlineActors.toArray();
  const transactions = await db.offlineTransactions.toArray();
  const mappings = await db.idMappings.toArray();

  console.log("Acteurs:", actors.length);
  console.log("Transactions:", transactions.length);
  console.log("Mappings:", mappings.length);

  // Vérifier les transactions qui référencent des acteurs
  for (const txn of transactions) {
    const sellerMapping = mappings.find(
      (m) => m.localId === txn.sellerId && m.entityType === "actor"
    );
    const buyerMapping = mappings.find(
      (m) => m.localId === txn.buyerId && m.entityType === "actor"
    );

    console.log(`Transaction ${txn.code}:
      Seller: ${txn.sellerId} ${sellerMapping ? "✅" : "⚠️"}
      Buyer: ${txn.buyerId} ${buyerMapping ? "✅" : "⚠️"}
    `);
  }
}
```

### Logs de synchronisation

Ajouter des logs détaillés pour tracer le flux :

```typescript
// Dans ActorRepository.handleCreate()
console.log(`🔄 [ACTOR SYNC] Début sync acteur`);
console.log(`   Local ID: ${localId}`);
console.log(`   Server ID: ${serverId}`);
console.log(`   Mapping sauvegardé: ${localId} → ${serverId}`);

// Dans TransactionRepository.handleCreate()
console.log(`🔄 [TXN SYNC] Début sync transaction`);
console.log(`   Seller ID (original): ${payload.sellerId}`);
console.log(`   Seller ID (résolu): ${resolvedSellerId}`);
console.log(`   Buyer ID (original): ${payload.buyerId}`);
console.log(`   Buyer ID (résolu): ${resolvedBuyerId}`);
```

---

## 🚧 Points d'attention

### 1. Migration des données existantes

Si des données ont déjà été créées en offline avant cette implémentation :

- ❌ Ces données ne pourront **pas** être synchronisées automatiquement
- ⚠️ Il faudra soit :
  - Les supprimer manuellement
  - Les recréer après l'implémentation
  - Écrire un script de migration (complexe)

### 2. Versioning Dexie

- ✅ Incrémenter le numéro de version de la base de données
- ✅ Dexie gère automatiquement la migration
- ⚠️ Tester sur un environnement de dev d'abord

### 3. Performance

- ✅ Les index composites garantissent des recherches rapides
- ⚠️ Surveiller la taille de la table `idMappings` sur le long terme
- 💡 Implémenter le nettoyage automatique des vieux mappings

### 4. Sécurité

- ✅ Les mappings sont liés à un `userId`
- ✅ Pas de fuite de données entre utilisateurs
- ⚠️ Nettoyer les mappings lors de la déconnexion

### 5. Edge cases

**Cas 1 : Transaction créée avant acteur**

- ❌ Impossible car l'UI ne permet pas de sélectionner un acteur qui n'existe pas
- ✅ Mais si cela arrive, l'erreur sera claire

**Cas 2 : Acteur supprimé en offline puis transaction créée**

- ⚠️ La transaction échouera lors de la sync
- 💡 Vérifier l'existence de l'acteur avant de créer la transaction

**Cas 3 : Conflit d'UUID**

- ❌ Très peu probable (UUID v4 a 2^122 possibilités)
- ✅ Si cela arrive, le backend rejettera avec une erreur de contrainte unique

---

## 📚 Ressources

### Documentation Dexie

- [Indexes composites](https://dexie.org/docs/Compound-Index)
- [Versioning](https://dexie.org/docs/Tutorial/Design#database-versioning)
- [Migrations](https://dexie.org/docs/Tutorial/Design#database-migration)

### Patterns

- [Outbox Pattern](https://microservices.io/patterns/data/transactional-outbox.html)
- [UUID Best Practices](https://www.postgresql.org/docs/current/datatype-uuid.html)

---

## 🎯 Prochaines étapes

1. ✅ Valider ce document avec l'équipe
2. 🔄 Créer les branches pour chaque itération
3. 🚀 Commencer l'implémentation (Itération 1)
4. ✅ Tests unitaires pour chaque itération
5. 🧪 Tests d'intégration end-to-end
6. 📱 Tests sur device réel (field agent)
7. 📊 Monitoring en production

---

**Document maintenu par** : L'équipe de développement ONCC-V1
**Dernière mise à jour** : 20 Novembre 2025
