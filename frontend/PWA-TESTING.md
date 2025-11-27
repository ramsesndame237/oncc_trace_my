# 🔧 Guide de Test PWA

Ce guide explique comment tester le PWA (Progressive Web App) en développement et en production.

---

## 🎯 Modes de Test

### Mode 1 : Production (RECOMMANDÉ)

Le PWA fonctionne **toujours** en production.

```bash
# Build
npm run build

# Lancer
npm start

# Ouvrir
http://localhost:3000
```

✅ **Avantages** :
- Comportement identique à la production
- Tous les logs visibles dans DevTools
- Test complet du cache et offline

---

### Mode 2 : Développement avec PWA Activé

Pour tester le PWA en mode dev (hot reload).

#### Étape 1 : Activer le PWA

Éditer `.env.local` :

```bash
# Changer de false à true
NEXT_PUBLIC_ENABLE_PWA_DEV=true
```

#### Étape 2 : Lancer

```bash
npm run dev
```

#### Étape 3 : Vérifier

1. Ouvrir `http://localhost:3000`
2. DevTools → Application → Service Workers
3. Vous devriez voir le Service Worker activé

⚠️ **Important** : Remettre à `false` après les tests !

```bash
# Après les tests
NEXT_PUBLIC_ENABLE_PWA_DEV=false
```

---

## 📊 Inspecter le PWA

### Service Worker

**DevTools → Application → Service Workers**

✅ Vérifications :
- Status : "Activated and running"
- Source : `/sw.js`
- Scope : `/`

### Cache Storage

**DevTools → Application → Cache Storage**

Vous verrez plusieurs caches :
- `pages-rsc` : Pages React Server Components
- `pages` : Pages HTML (~175 pages)
- `static-js-assets` : Fichiers JavaScript
- `static-image-assets` : Images
- `next-image` : Images optimisées

### Logs du Service Worker

**Console Browser** :

```
[SW] 🎯 Service Worker installé avec 176 entrées précachées
[SW] ✅ Service Worker activé
```

En mode offline :
```
[SW] 📡 Requête offline: http://localhost:3000/actors/producer/create
```

---

## 🧪 Tester le Mode Offline

### Étape 1 : Charger l'Application

1. Ouvrir `http://localhost:3000`
2. Laisser le Service Worker s'installer (~10-20s)
3. Vérifier dans DevTools → Application → Service Workers

### Étape 2 : Activer le Mode Offline

**DevTools → Network → Offline** ✓

Ou cliquer sur "Update on reload" dans Service Workers (pour forcer la mise à jour)

### Étape 3 : Naviguer dans l'App

Tester les pages critiques :

✅ **Doivent fonctionner offline** :
- `/dashboard`
- `/quick-menu`
- `/actors`
- `/actors/producer/create`
- `/actors/producers/create`
- `/conventions/create`
- `/transactions/sale/create`
- Toutes les 175 pages précachées

✅ **Doivent afficher `/offline`** :
- Pages jamais visitées non précachées
- Pages de détail avec ID (`/actors/view?id=123`)

### Étape 4 : Tester la Création Offline

1. Aller sur `/actors/producer/create`
2. Remplir le formulaire
3. Soumettre
4. Vérifier que les données sont dans `pendingOperations`

**DevTools → Application → IndexedDB → SifcDatabase → pendingOperations**

### Étape 5 : Tester la Synchronisation

1. Se reconnecter (décocher "Offline")
2. Recharger la page
3. Les données dans `pendingOperations` doivent être synchronisées
4. Vérifier dans la console : `✅ SyncService: Opération #X réussie`

---

## 🐛 Debug & Troubleshooting

### Service Worker ne s'installe pas

**Vérification** :
```bash
# En production
cat public/sw.js | head -20

# Doit contenir le code du Service Worker
```

**Solution** :
```bash
# Rebuild
npm run build
npm start
```

### Cache ne se met pas à jour

**DevTools → Application → Service Workers → Update**

Ou :

**Console** :
```javascript
// Unregister service worker
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(reg => reg.unregister())
})

// Clear cache
caches.keys().then(keys => {
  keys.forEach(key => caches.delete(key))
})

// Recharger
location.reload()
```

### Page non disponible offline

**Vérifier** :
1. Est-elle dans la liste `getCriticalPages()` de `next.config.ts` ?
2. Le Service Worker a-t-il été reconstruit après l'ajout ?
3. Le cache est-il à jour ?

**Solution** :
- Ajouter la page dans `next.config.ts`
- Rebuild : `npm run build`

### Logs du Service Worker invisibles

**Activer les logs** :

`sw.ts` ligne 61-76 contient déjà les logs.

Pour plus de détails, ajouter :

```typescript
self.addEventListener("fetch", (event) => {
  console.log("[SW] Fetch:", event.request.url);
});
```

---

## 📋 Checklist de Test Complet

### Avant le Test

- [ ] `.env.local` configuré (dev) ou build fait (prod)
- [ ] Service Worker installé (DevTools → Application)
- [ ] Cache Storage contient ~175 pages

### Test Offline

- [ ] Mode offline activé (DevTools → Network → Offline)
- [ ] `/dashboard` fonctionne
- [ ] `/actors/producer/create` fonctionne
- [ ] Formulaires multi-étapes fonctionnent
- [ ] Page non précachée affiche `/offline`

### Test Création Offline

- [ ] Créer un producteur offline
- [ ] Données dans `pendingOperations` (IndexedDB)
- [ ] Reconnecter
- [ ] Synchronisation automatique réussie
- [ ] Données visibles dans l'app

### Test Fallback

- [ ] Visiter page jamais consultée
- [ ] Vérifier affichage de `/offline`
- [ ] Bouton "Retour à l'Accueil" fonctionne
- [ ] Reconnexion détectée automatiquement

---

## 🎯 Pages Précachées (175 total)

Voir `next.config.ts` fonction `getCriticalPages()` pour la liste complète.

**Catégories** :
- Auth & Navigation : 11 pages
- Listings : 20 pages
- Formulaires Création : 45 pages
- Formulaires Édition : 31 pages
- Pages Détail : 14 pages
- Actions Rapides : 4 pages

---

## 🚀 Déploiement Production

En production, le PWA est **automatiquement activé** :

```bash
# Build
npm run build

# Output
============================================================
🎯 PWA PRECACHE CONFIGURATION
============================================================
📦 Pages critiques précachées : 175
📏 Taille estimée du cache    : ~8.54 MB
============================================================
```

Le Service Worker est généré dans `public/sw.js`.

---

## 📞 Support

Pour toute question, consulter :
- Documentation Serwist : https://serwist.pages.dev/
- Guide PWA : https://web.dev/progressive-web-apps/
