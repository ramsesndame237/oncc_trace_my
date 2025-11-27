# Analyse de l'Architecture Proposée pour le Mapping d'IDs

> **Date** : 20 Novembre 2025
> **Statut** : ✅ Validé - Prêt pour implémentation
> **Dernière mise à jour** : 20 Novembre 2025 - Réponses aux questions intégrées

---

## ✅ RÉPONSES AUX QUESTIONS CRITIQUES

### Questions Répondues (Toutes validées le 20 Nov 2025)

1. **Attribut "pas en ligne"** : ✅ **Juste la présence de l'id suffit**
   - Présence de `id` = entité synchronisée
   - Absence de `id` + présence de `localId` = entité locale non synchronisée

2. **Structure du tableau `conventions`** : ✅ **Garder la structure actuelle du fichier db.ts**
   ```typescript
   conventions?: Array<{
     id: string;
     code: string;
     opaId: string;
     buyerExporterId: string;
     signatureDate: string;
     status: string;
   }>;
   ```

3. **Structure du tableau `calendars`** : ✅ **Garder la structure actuelle du fichier db.ts**
   ```typescript
   calendars?: Array<{
     id: string;
     code: string;
     type: "MARCHE" | "ENLEVEMENT";
     status: "active" | "inactive";
     location: string | null;
     locationCode: string | null;
     startDate: string;
     endDate: string;
     eventTime: string | null;
     convention?: { ... } | null;
   }>;
   ```

4. **IdMapping avec serverId null** : ✅ **Option A**
   ```typescript
   { localId: "xxx", serverId: null }
   ```

5. **Mise à jour du tableau conventions** : ✅ **Push un objet avec { localId, code, ....}**
   - Ajouter un objet complet dans le tableau, pas juste l'ID

6. **Recherche des acteurs** : ✅ **OR - chercher sur id OU localId**
   ```typescript
   // Vérifier id égale OU localId égale
   ```

7. **Stockage des calendriers** : ✅ **Même réponse que la 6**
   - Utiliser OR pour chercher sur id ou localId

8. **Différenciation localId vs serverId** : ✅ **Option B - Vérifier dans idMappings**
   ```typescript
   const mapping = await db.idMappings
     .where('localId')
     .equals(sellerId)
     .first();
   if (mapping) {
     // C'est un localId
   }
   ```

9. **IdMapping pour transaction** : ✅ **NON, ce n'est pas nécessaire**
   - Juste stocker dans OfflineTransactionData et supprimer après sync

10. **Problème de dépendance** : ✅ **Option C - Changer l'ordre**
    ```
    NOUVEL ORDRE : Acteur → Convention → Calendrier → Transaction
    ```

11. **Mise à jour des acteurs après sync convention** : ✅ **Option B**
    - Utiliser les acteurs référencés dans la convention

12. **Résolution des IDs** : ✅ **OR dans db.idMappings**
    - Faire un OU dans les recherches

13. **Mise à jour en ligne** : ✅ **NON, on ne met pas à jour l'acteur côté serveur**
    - Mise à jour locale seulement

14. **Logique calendrier** : ✅ **Applique la même logique que convention**

15. **Effacement du localId** : ✅ **OUI, il faut effacer localId après synchronisation**
    - Utiliser le OR dans db pour chercher
    - Trouver un moyen de savoir si la suite doit se faire avec serverId ou localId

16. **Tableaux conventions et calendars** : ✅ **L'acteur est créé avant la convention**
    - Pas de problème de résolution rétroactive

17. **Suppression dans OfflineTransactionData** : ✅ **Parce qu'on n'en a plus besoin**
    - Les acteurs sont utilisés pour faire les prochaines transactions → on garde
    - Les conventions/calendriers peuvent être consultés offline → on garde
    - Les transactions sont juste des enregistrements historiques → on supprime
    - **Raison principale : pouvoir continuer à travailler offline**

18. **IdMapping pour transactions** : ✅ **Pas d'idMapping pour les transactions**
    - Confirmé par réponse 9

19. **Nettoyage idMappings** : ✅ **Option A - Effacer immédiatement après sync**
    ```typescript
    // Après sync de chaque entité
    await db.idMappings
      .where('localId')
      .equals(localId)
      .delete();
    ```

---

## 🎯 Approche Proposée (Résumé)

### Concepts clés

1. **Distinction localId vs serverId** :
   - Présence de `localId` → Entité locale (pas encore synchronisée)
   - Présence de `id` (serverId) → Entité en ligne (synchronisée)

2. **Création idMapping anticipée** :
   - Créer l'idMapping dès la création offline (SANS serverId au départ)
   - Compléter avec le serverId après synchronisation

3. **Relations bidirectionnelles** :
   - Les entités dépendantes (convention, calendrier) mettent à jour les acteurs
   - Les acteurs stockent les tableaux de conventions et calendriers

4. **Ordre de synchronisation spécifique** :
   - Convention → Calendrier → Acteur → Transaction

---

## 📋 Workflow Détaillé (Tel que compris)

### 1️⃣ Création d'un Acteur en Offline

```typescript
// ÉTAPE 1: Générer localId
const localId = uuid();

// ÉTAPE 2: Ajouter dans pendingOperations
await db.pendingOperations.add({
  entityId: localId,
  entityType: 'actor',
  operation: 'create',
  payload: { ...actorData, localId },
  timestamp: Date.now(),
  retries: 0,
  userId: currentUserId,
});

// ÉTAPE 3: Ajouter dans OfflineActorData
await db.offlineActors.add({
  localId: localId,           // ✅ Présence de localId = pas en ligne
  id: undefined,              // ❌ Pas d'id = pas synchronisé
  familyName: "...",
  givenName: "...",
  // ❓ QUESTION 1: Quel attribut indique "pas en ligne" ?
  isSynced: false,            // Option A ?
  syncStatus: 'pending',      // Option B ?
  // ... autres champs
  conventions: [],            // ❓ QUESTION 2: Structure ?
  calendars: [],              // ❓ QUESTION 3: Structure ?
});

// ÉTAPE 4: Créer idMapping SANS serverId
await db.idMappings.add({
  localId: localId,
  serverId: null,             // ❓ QUESTION 4: null ou undefined ou ne pas mettre ?
  entityType: 'actor',
  userId: currentUserId,
  syncedAt: null,             // Pas encore synchronisé
});
```

**❓ QUESTIONS :**

1. **Attribut "pas en ligne"** : Quel champ utilise-t-on ?
   - Option A : `isSynced: boolean`
   - Option B : `syncStatus: 'pending' | 'synced' | 'failed'`
   - Option C : Juste la présence/absence de `id` suffit ?

2. **Structure du tableau `conventions`** :
   ```typescript
   conventions: string[]              // Juste les IDs ?
   conventions: { id: string, code: string }[]  // Objets ?
   conventions: Convention[]          // Objets complets ?
   ```

3. **Structure du tableau `calendars`** :
   ```typescript
   calendars: string[]
   calendars: { id: string, code: string }[]
   calendars: Calendar[]
   ```

4. **IdMapping avec serverId null** :
   ```typescript
   // Option A
   { localId: "xxx", serverId: null }

   // Option B
   { localId: "xxx" }  // serverId absent
   ```

---

### 2️⃣ Création d'une Convention en Offline

```typescript
const conventionLocalId = uuid();

// ÉTAPE 1: Ajouter dans pendingOperations
await db.pendingOperations.add({
  entityId: conventionLocalId,
  entityType: 'convention',
  operation: 'create',
  payload: {
    localId: conventionLocalId,
    buyerExporterId: "actor-local-id-1",  // ❓ Peut être local ou serveur
    producersId: "actor-local-id-2",      // ❓ Peut être local ou serveur
    // ...
  },
  // ...
});

// ÉTAPE 2: Créer idMapping de la convention
await db.idMappings.add({
  localId: conventionLocalId,
  serverId: null,
  entityType: 'convention',
  userId: currentUserId,
  syncedAt: null,
});

// ÉTAPE 3: Rechercher les acteurs concernés
const buyerExporter = await db.offlineActors
  .where('localId')  // ❓ Ou 'id' ?
  .equals("actor-local-id-1")
  .first();

const producer = await db.offlineActors
  .where('localId')
  .equals("actor-local-id-2")
  .first();

// ÉTAPE 4: Mettre à jour le tableau conventions dans les acteurs
// ❓ QUESTION 5: Comment mettre à jour ?
await db.offlineActors
  .where('localId')
  .equals("actor-local-id-1")
  .modify(actor => {
    actor.conventions.push(conventionLocalId);  // Juste l'ID ?
    // OU
    actor.conventions.push({ id: conventionLocalId, code: "..." });  // Objet ?
  });

await db.offlineActors
  .where('localId')
  .equals("actor-local-id-2")
  .modify(actor => {
    actor.conventions.push(conventionLocalId);
  });
```

**❓ QUESTIONS :**

5. **Mise à jour du tableau conventions** :
   - Push juste le `localId` de la convention ?
   - Push un objet avec `{ localId, code, ... }` ?
   - Remplacer complètement le tableau ?

6. **Recherche des acteurs** :
   - Si `buyerExporterId` peut être local OU serveur, comment savoir sur quel champ chercher ?
   - Chercher d'abord sur `localId`, puis sur `id` si pas trouvé ?

---

### 3️⃣ Création d'un Calendrier en Offline

```typescript
const calendarLocalId = uuid();

// ÉTAPE 1: Ajouter dans pendingOperations
await db.pendingOperations.add({
  entityId: calendarLocalId,
  entityType: 'calendar',
  operation: 'create',
  payload: {
    localId: calendarLocalId,
    opaId: "opa-local-id",  // Référence à un OPA (PRODUCERS)
    // ...
  },
  // ...
});

// ÉTAPE 2: Créer idMapping
await db.idMappings.add({
  localId: calendarLocalId,
  serverId: null,
  entityType: 'calendar',
  userId: currentUserId,
  syncedAt: null,
});

// ÉTAPE 3: Rechercher l'OPA et mettre à jour son tableau calendars
const opa = await db.offlineActors
  .where('localId')  // ❓ Ou 'id' ?
  .equals("opa-local-id")
  .first();

await db.offlineActors
  .where('localId')
  .equals("opa-local-id")
  .modify(actor => {
    actor.calendars.push(calendarLocalId);  // ❓ Juste l'ID ou objet ?
  });
```

**❓ QUESTIONS :**

7. **Même question que pour les conventions** : Stocker juste l'ID ou un objet ?

---

### 4️⃣ Création d'une Transaction en Offline

```typescript
const transactionLocalId = uuid();

// ÉTAPE 1: Ajouter dans pendingOperations
await db.pendingOperations.add({
  entityId: transactionLocalId,
  entityType: 'transaction',
  operation: 'create',
  payload: {
    localId: transactionLocalId,
    sellerId: "seller-id",       // ❓ Peut être local ou serveur
    buyerId: "buyer-id",         // ❓ Peut être local ou serveur
    calendarId: "calendar-id",   // ❓ Peut être local ou serveur
    conventionId: "convention-id", // ❓ Peut être local ou serveur
    // ...
  },
  // ...
});

// ÉTAPE 2: Enregistrer dans OfflineTransactionData
await db.offlineTransactions.add({
  localId: transactionLocalId,
  id: undefined,
  sellerId: "seller-id",
  buyerId: "buyer-id",
  calendarId: "calendar-id",
  conventionId: "convention-id",
  // ...
});

// ÉTAPE 3: Créer idMapping (❓ Nécessaire ?)
await db.idMappings.add({
  localId: transactionLocalId,
  serverId: null,
  entityType: 'transaction',
  userId: currentUserId,
  syncedAt: null,
});
```

**❓ QUESTIONS CRITIQUES :**

8. **Différenciation localId vs serverId** :
   ```typescript
   // Quand on a sellerId = "abc-123-def-456"
   // Comment savoir si c'est un localId ou serverId ?

   // Option A: Convention de nommage
   if (sellerId.includes('-local-')) {
     // C'est un localId
   }

   // Option B: Vérifier dans idMappings
   const mapping = await db.idMappings
     .where('localId')
     .equals(sellerId)
     .first();
   if (mapping) {
     // C'est un localId
   }

   // Option C: Vérifier dans OfflineActorData
   const actorByLocalId = await db.offlineActors
     .where('localId')
     .equals(sellerId)
     .first();
   const actorByServerId = await db.offlineActors
     .where('id')
     .equals(sellerId)
     .first();
   if (actorByLocalId) {
     // C'est un localId
   } else if (actorByServerId) {
     // C'est un serverId
   }

   // ❓ Quelle option choisir ?
   ```

9. **IdMapping pour transaction** :
   - Est-ce vraiment nécessaire de créer un idMapping pour les transactions ?
   - Les transactions ne sont pas référencées par d'autres entités
   - Peut-on juste stocker dans `OfflineTransactionData` et supprimer après sync ?

---

### 5️⃣ Synchronisation en Ligne

#### Ordre de traitement proposé :
```
1. Convention
2. Calendrier
3. Acteur
4. Transaction
```

**❓ QUESTION CRITIQUE 10 : Problème de dépendance**

```
Scénario problématique :
1. Acteur A créé offline (localId = "actor-local-1")
2. Convention créée offline avec acteur A (buyerExporterId = "actor-local-1")

Ordre de sync proposé : Convention → Acteur
                                ⬆️
                            PROBLÈME !

La convention a besoin de l'acteur mais l'acteur n'est pas encore synchronisé !

❓ Comment gérer ce cas ?

Option A: Détecter les dépendances et réorganiser l'ordre
Option B: Synchroniser dans cet ordre mais résoudre les IDs :
  - Lors de la sync de convention, vérifier si buyerExporterId est un localId
  - Si oui, forcer la sync de l'acteur d'abord
  - Puis continuer avec la convention
Option C: Changer l'ordre : Acteur → Convention → Calendrier → Transaction
```

---

#### 5.1 Synchronisation d'une Convention

```typescript
async function handleConventionCreate(operation: PendingOperation) {
  const payload = operation.payload;
  const localId = payload.localId;

  // ÉTAPE 1: Résoudre les IDs des acteurs
  const resolvedBuyerExporterId = await resolveActorId(payload.buyerExporterId);
  const resolvedProducersId = await resolveActorId(payload.producersId);

  // ÉTAPE 2: Envoyer au serveur
  const response = await apiClient.post('/conventions', {
    ...payload,
    buyerExporterId: resolvedBuyerExporterId,
    producersId: resolvedProducersId,
  });

  const serverId = response.data.convention.id;

  // ÉTAPE 3: Mettre à jour idMapping
  await db.idMappings
    .where('localId')
    .equals(localId)
    .modify({
      serverId: serverId,
      syncedAt: Date.now(),
    });

  // ÉTAPE 4: Mettre à jour les acteurs qui ont cette convention
  // ❓ QUESTION 11: Comment mettre à jour ?

  // Option A: Chercher tous les acteurs qui ont ce localId dans leur tableau conventions
  const actors = await db.offlineActors.toArray();
  for (const actor of actors) {
    if (actor.conventions.includes(localId)) {
      await db.offlineActors
        .where('id')  // ❓ Ou 'localId' ?
        .equals(actor.id)
        .modify(a => {
          // Remplacer localId par serverId dans le tableau
          const index = a.conventions.indexOf(localId);
          a.conventions[index] = serverId;
        });
    }
  }

  // Option B: Utiliser les acteurs de la convention
  await db.offlineActors
    .where('id')
    .equals(resolvedBuyerExporterId)
    .modify(actor => {
      const index = actor.conventions.indexOf(localId);
      if (index !== -1) {
        actor.conventions[index] = serverId;
      }
    });

  // ❓ Quelle option ?
}

// Fonction helper
async function resolveActorId(actorId: string): Promise<string> {
  // ❓ QUESTION 12: Comment savoir si c'est un localId ou serverId ?

  // Vérifier dans idMappings
  const mapping = await db.idMappings
    .where(['localId', 'entityType'])
    .equals([actorId, 'actor'])
    .first();

  if (mapping && mapping.serverId) {
    return mapping.serverId;  // Acteur déjà synchronisé
  }

  // Si pas de mapping ou pas de serverId, c'est peut-être déjà un serverId
  return actorId;
}
```

**❓ QUESTIONS :**

11. **Mise à jour des acteurs après sync convention** :
    - Option A : Parcourir TOUS les acteurs et chercher ceux qui ont ce localId
    - Option B : Utiliser les acteurs référencés dans la convention
    - Quelle option est correcte ?

12. **Résolution des IDs** :
    - La fonction `resolveActorId` est-elle correcte ?
    - Que faire si l'acteur n'est pas encore synchronisé ?

13. **Mise à jour en ligne** :
    - Après avoir mis à jour l'acteur local (remplacer localId par serverId dans conventions[])
    - Faut-il aussi mettre à jour l'acteur côté serveur (API PATCH /actors/:id) ?

---

#### 5.2 Synchronisation d'un Calendrier

```typescript
async function handleCalendarCreate(operation: PendingOperation) {
  const payload = operation.payload;
  const localId = payload.localId;

  // ÉTAPE 1: Résoudre l'ID de l'OPA
  const resolvedOpaId = await resolveActorId(payload.opaId);

  // ÉTAPE 2: Envoyer au serveur
  const response = await apiClient.post('/calendars', {
    ...payload,
    opaId: resolvedOpaId,
  });

  const serverId = response.data.calendar.id;

  // ÉTAPE 3: Mettre à jour idMapping
  await db.idMappings
    .where('localId')
    .equals(localId)
    .modify({
      serverId: serverId,
      syncedAt: Date.now(),
    });

  // ÉTAPE 4: Mettre à jour l'OPA qui a ce calendrier
  await db.offlineActors
    .where('id')  // ❓ Ou 'localId' ?
    .equals(resolvedOpaId)
    .modify(actor => {
      const index = actor.calendars.indexOf(localId);
      if (index !== -1) {
        actor.calendars[index] = serverId;
      }
    });
}
```

**❓ QUESTIONS :**

14. **Même logique que convention** : Est-ce correct ?

---

#### 5.3 Synchronisation d'un Acteur

```typescript
async function handleActorCreate(operation: PendingOperation) {
  const payload = operation.payload;
  const localId = payload.localId;

  // ÉTAPE 1: Envoyer au serveur
  const response = await apiClient.post('/actors', payload);
  const serverId = response.data.actor.id;

  // ÉTAPE 2: Mettre à jour idMapping
  await db.idMappings
    .where('localId')
    .equals(localId)
    .modify({
      serverId: serverId,
      syncedAt: Date.now(),
    });

  // ÉTAPE 3: Mettre à jour OfflineActorData
  await db.offlineActors
    .where('localId')
    .equals(localId)
    .modify({
      id: serverId,        // ✅ Ajouter l'id serveur
      localId: undefined,  // ❓ QUESTION 15: Effacer le localId ?
      isSynced: true,      // ❓ Ou mettre à jour le statut
    });
}
```

**❓ QUESTIONS :**

15. **Effacement du localId** :
    - Faut-il effacer `localId` après synchronisation ?
    - Ou le garder pour traçabilité ?
    - Si on l'efface, comment chercher l'acteur après (par `id` uniquement) ?

16. **Tableaux conventions et calendars** :
    - Si l'acteur a été créé après les conventions/calendriers
    - Les tableaux `conventions` et `calendars` contiennent des localIds
    - Faut-il les résoudre aussi à cette étape ?

---

#### 5.4 Synchronisation d'une Transaction

```typescript
async function handleTransactionCreate(operation: PendingOperation) {
  const payload = operation.payload;
  const localId = payload.localId;

  // ÉTAPE 1: Résoudre TOUS les IDs de références
  const resolvedSellerId = await resolveActorId(payload.sellerId);
  const resolvedBuyerId = await resolveActorId(payload.buyerId);
  const resolvedCalendarId = await resolveId(payload.calendarId, 'calendar');
  const resolvedConventionId = await resolveId(payload.conventionId, 'convention');

  // ÉTAPE 2: Envoyer au serveur
  const response = await apiClient.post('/transactions', {
    ...payload,
    sellerId: resolvedSellerId,
    buyerId: resolvedBuyerId,
    calendarId: resolvedCalendarId,
    conventionId: resolvedConventionId,
  });

  const serverId = response.data.transaction.id;

  // ÉTAPE 3: Mettre à jour idMapping (si on le garde)
  if (/* on garde idMapping pour transactions */) {
    await db.idMappings
      .where('localId')
      .equals(localId)
      .modify({
        serverId: serverId,
        syncedAt: Date.now(),
      });
  }

  // ÉTAPE 4: Supprimer de OfflineTransactionData
  await db.offlineTransactions
    .where('localId')
    .equals(localId)
    .delete();

  // ❓ QUESTION 17: Pourquoi supprimer uniquement les transactions ?
}

// Fonction helper générique
async function resolveId(entityId: string, entityType: string): Promise<string> {
  const mapping = await db.idMappings
    .where(['localId', 'entityType'])
    .equals([entityId, entityType])
    .first();

  if (mapping && mapping.serverId) {
    return mapping.serverId;
  }

  return entityId;  // Déjà un serverId
}
```

**❓ QUESTIONS :**

17. **Suppression dans OfflineTransactionData** :
    - Pourquoi supprimer uniquement les transactions ?
    - Pourquoi garder les acteurs, conventions, calendriers dans IndexedDB ?
    - Est-ce pour consultation offline après sync ?

18. **IdMapping pour transactions** :
    - Si on supprime la transaction de `OfflineTransactionData`
    - Faut-il aussi supprimer son `idMapping` ?
    - Ou le garder pour historique ?

---

### 6️⃣ Nettoyage des idMappings

**❓ QUESTION PRINCIPALE 19 : Quand effacer les idMappings ?**

**Options possibles :**

**Option A : Effacer immédiatement après sync**
```typescript
// Après sync de chaque entité
await db.idMappings
  .where('localId')
  .equals(localId)
  .delete();
```
✅ Avantages : Pas d'accumulation de données
❌ Inconvénients : Perte de traçabilité

**Option B : Effacer après que toutes les entités dépendantes sont sync**
```typescript
// Pour un acteur, effacer son mapping seulement quand:
// - Toutes les conventions qui le référencent sont sync
// - Tous les calendriers qui le référencent sont sync
// - Toutes les transactions qui le référencent sont sync

async function canDeleteActorMapping(actorLocalId: string): Promise<boolean> {
  // Vérifier si des conventions pending référencent cet acteur
  const pendingConventions = await db.pendingOperations
    .where('entityType')
    .equals('convention')
    .toArray();

  for (const op of pendingConventions) {
    if (op.payload.buyerExporterId === actorLocalId ||
        op.payload.producersId === actorLocalId) {
      return false;  // Il reste des conventions à synchroniser
    }
  }

  // Idem pour calendriers et transactions
  // ...

  return true;  // On peut effacer
}
```
✅ Avantages : Sûr, pas de perte de référence
❌ Inconvénients : Complexe, peut garder longtemps

**Option C : Effacer après X jours**
```typescript
// Nettoyage périodique
async function cleanOldMappings() {
  const cutoffTime = Date.now() - 30 * 24 * 60 * 60 * 1000;  // 30 jours

  await db.idMappings
    .where('syncedAt')
    .below(cutoffTime)
    .delete();
}
```
✅ Avantages : Simple, automatique
❌ Inconvénients : Arbitraire

**Option D : Garder indéfiniment**
```typescript
// Ne jamais effacer, juste pour historique/debug
```
✅ Avantages : Traçabilité complète
❌ Inconvénients : Accumulation de données

**❓ Quelle option préférez-vous ?**

---

## 🔍 Points à Clarifier / Décisions à Prendre

### Priorité HAUTE (Bloquant)

1. **Structure OfflineActorData** :
   - [ ] Définir l'attribut pour "pas en ligne"
   - [ ] Structure exacte des tableaux `conventions` et `calendars`

2. **Différenciation localId vs serverId** :
   - [ ] Méthode de détection (convention, idMapping, recherche ?)
   - [ ] Fonction `resolveId()` à implémenter

3. **Ordre de synchronisation** :
   - [ ] Résoudre le problème de dépendance circulaire
   - [ ] Convention/Calendrier avant ou après Acteur ?

4. **Nettoyage idMappings** :
   - [ ] Quand effacer ?
   - [ ] Stratégie de nettoyage

### Priorité MOYENNE

5. **IdMapping initial** :
   - [ ] Avec `serverId: null` ou sans le champ ?

6. **IdMapping pour transactions** :
   - [ ] Nécessaire ou pas ?

7. **Mise à jour des acteurs** :
   - [ ] Après sync convention, mettre à jour acteur en local seulement ?
   - [ ] Ou aussi côté serveur ?

### Priorité BASSE

8. **Effacement localId** :
   - [ ] Effacer après sync ou garder pour historique ?

9. **Suppression entités** :
   - [ ] Pourquoi uniquement transactions ?
   - [ ] Stratégie pour autres entités ?

---

## 📊 Cas d'Usage à Valider

### Cas 1 : Acteur puis Transaction (Simple)

```
Offline:
1. Créer acteur A (localId: "actor-local-1")
2. Créer transaction avec seller = "actor-local-1"

Online:
1. Sync acteur → serverId = "actor-server-1"
2. Sync transaction → résoudre "actor-local-1" → "actor-server-1"

✅ Fonctionne si ordre : Acteur → Transaction
```

### Cas 2 : Acteur puis Convention puis Transaction (Complexe)

```
Offline:
1. Créer acteur A (localId: "actor-local-1")
2. Créer acteur B (localId: "actor-local-2")
3. Créer convention entre A et B (localId: "conv-local-1")
   - buyerExporterId = "actor-local-1"
   - producersId = "actor-local-2"
4. Créer transaction
   - sellerId = "actor-local-2"
   - buyerId = "actor-local-1"
   - conventionId = "conv-local-1"

Online (ordre proposé : Convention → Calendrier → Acteur → Transaction):
1. Sync convention → ❌ ERREUR : acteurs pas encore sync !

❓ Comment résoudre ce cas ?
```

### Cas 3 : Acteur online puis Transaction offline

```
Online:
1. Acteur A existe déjà (serverId: "actor-server-1")

Offline:
1. Créer transaction avec seller = "actor-server-1"

Online:
1. Sync transaction → "actor-server-1" déjà un serverId ✅

✅ Pas de problème si détection correcte
```

### Cas 4 : Convention puis Acteur (Ordre inverse)

```
Offline:
1. Créer convention (localId: "conv-local-1")
   - buyerExporterId = ??? (acteur pas encore créé)

❌ Impossible dans l'UI normale
❓ Mais que faire si ça arrive ?
```

---

## 🎯 Prochaines Étapes

### Avant implémentation :

1. **Répondre à toutes les questions** marquées ❓
2. **Valider les cas d'usage** complexes
3. **Choisir la stratégie de nettoyage** idMappings
4. **Définir l'ordre de sync final** (résoudre dépendances)
5. **Créer un prototype** pour tester la logique

### Après validation :

1. Modifier la structure `OfflineActorData`
2. Implémenter les fonctions de résolution d'IDs
3. Modifier les handlers de sync
4. Tests end-to-end

---

## 📝 Notes Importantes

- Cette approche est **différente** de l'architecture initiale proposée dans `ID-MAPPING-ARCHITECTURE.md`
- L'approche proposée ici est **plus complexe** mais potentiellement **plus flexible**
- Il faut bien **valider tous les cas d'usage** avant de commencer l'implémentation
- Le **problème de l'ordre de synchronisation** est critique et doit être résolu en priorité

---

**Document en cours d'analyse** - Attente de clarifications
