# Système de Génération de Types

Ce document explique le système de génération automatique des types depuis le backend vers le frontend.

## 📋 Vue d'ensemble

Le projet utilise **deux approches** pour générer les types :

1. **Approche simple** : Scripts dédiés pour chaque type (recommandée)
2. **Approche générique** : Script configurable pour plusieurs types (avancée)

## 🎯 Approche Simple (Recommandée)

### Scripts disponibles

- `generate-types-roles.ts` : Génère les types de rôles utilisateur
- `generate-types-base.ts` : Génère les types de base

### Avantages

✅ **Simplicité** : Un script = Un type, facile à comprendre
✅ **Lisibilité** : Code clair, pas de configuration complexe
✅ **Maintenabilité** : Facile à modifier pour un cas spécifique
✅ **Isolation** : Chaque script est indépendant

### Utilisation

```bash
# Générer les rôles uniquement
npm run generate:types:roles

# Générer les types de base uniquement
npm run generate:types:base

# Générer tous les types
npm run generate:types
```

### Ajouter un nouveau type (Approche Simple)

**Exemple : Créer un générateur pour les statuts de document**

1. **Copier un script existant**

```bash
cp scripts/generate-types-base.ts scripts/generate-types-document-statuses.ts
```

2. **Modifier les constantes**

```typescript
// Dans generate-types-document-statuses.ts
const BACKEND_TYPES_PATH = path.join(BACKEND_ROOT, 'app', 'types', 'document_types.ts')
const FRONTEND_OUTPUT_PATH = path.join(FRONTEND_GENERATED_DIR, 'document-statuses.types.ts')
const CACHE_FILE = path.join(CACHE_DIR, 'document-statuses-metadata.json')
const API_ENDPOINT = `${BACKEND_URL}/api/v1/sync/metadata/document-statuses`
```

3. **Modifier les regex d'extraction**

```typescript
// Remplacer BASE_TYPES par DOCUMENT_STATUSES
const typesMatch = content.match(/export const DOCUMENT_STATUSES = \[([\s\S]*?)\] as const/)
const namesMatch = content.match(
  /export const DOCUMENT_STATUS_NAMES: Record<DocumentStatus, string> = \{([\s\S]*?)\}/
)
// etc.
```

4. **Mettre à jour les noms de types**

```typescript
function generateTypeScriptContent(metadata: DocumentStatusesMetadata): string {
  // ...
  content += `export type DocumentStatus = ${typesUnion};`
  content += `export const DOCUMENT_STATUSES = [${typesArray}] as const;`
  content += `export const DOCUMENT_STATUS_CONSTANTS = {`
  // etc.
}
```

5. **Ajouter la commande dans package.json**

```json
{
  "scripts": {
    "generate:types:document-statuses": "tsx scripts/generate-types-document-statuses.ts",
    "generate:types": "npm run generate:types:roles && npm run generate:types:base && npm run generate:types:document-statuses"
  }
}
```

## 🔧 Approche Générique (Avancée)

### Script disponible

- `generate-types.ts` : Script configurable via `types-config.ts`

### Avantages

✅ **DRY** : Code réutilisable
✅ **Centralisation** : Configuration dans un seul fichier
✅ **Extensibilité** : Facile d'ajouter des types similaires

### Inconvénients

❌ **Complexité** : Plus difficile à comprendre
❌ **Configuration** : Nécessite de maîtriser `types-config.ts`
❌ **Rigidité** : Tous les types doivent suivre la même structure

### Utilisation

```bash
# Générer tous les types configurés
npm run generate:types

# Générer un type spécifique
tsx scripts/generate-types.ts base-types
```

### Configuration

Modifier `scripts/types-config.ts` :

```typescript
export const TYPE_CONFIGS: TypeConfig[] = [
  {
    name: 'base-types',
    apiEndpoint: 'sync/metadata/base-types',
    backendFilePath: 'app/types/base_types.ts',
    outputFileName: 'base-types.types',
    typeName: 'BaseType',
    constantName: 'BASE_TYPES',
    backendConstantName: 'BASE_TYPES',
    constantPrefix: 'BASE_TYPE',
    description: 'Types de base du système',
    extractFromBackend: extractBaseTypesFromBackend,
  },
]
```

## 🔄 Quelle approche choisir ?

### Utiliser l'approche **Simple** si :

- Vous ajoutez un nouveau type qui a une structure **différente** des autres
- Vous voulez un **contrôle total** sur la génération
- Vous préférez la **lisibilité** à la réutilisation
- Le type nécessite une **logique spécifique**

### Utiliser l'approche **Générique** si :

- Vous ajoutez plusieurs types qui suivent **exactement la même structure**
- Vous voulez **centraliser** la configuration
- Vous êtes à l'aise avec **l'abstraction**
- Les types ont des noms/descriptions dans le backend

## 📁 Structure des fichiers

```
frontend/
├── scripts/
│   ├── generate-types-roles.ts         # Simple : Rôles
│   ├── generate-types-base.ts          # Simple : Types de base
│   ├── generate-types.ts               # Générique : Configurable
│   ├── types-config.ts                 # Config pour approche générique
│   ├── README.md                       # Documentation complète
│   ├── TYPES_GENERATION.md             # Ce fichier
│   └── EXAMPLE_USAGE.md                # Exemples d'utilisation
├── src/core/domain/
│   ├── generated/
│   │   ├── user-roles.types.ts         # Généré (gitignored)
│   │   ├── base-types.types.ts         # Généré (gitignored)
│   │   ├── .gitignore
│   │   └── README.md
│   ├── user.types.ts                   # Wrapper user-roles
│   └── base.types.ts                   # Wrapper base-types
└── .cache/
    ├── roles-metadata.json             # Cache 24h
    └── base-types-metadata.json        # Cache 24h
```

## 🚀 Workflow recommandé

### Pour un nouveau type similaire aux existants

1. **Copier** `generate-types-base.ts`
2. **Renommer** en `generate-types-{votre-type}.ts`
3. **Chercher/Remplacer** :
   - `BASE_TYPE` → `VOTRE_TYPE`
   - `BaseType` → `VotreType`
   - `base-types` → `votre-type`
   - `base_types.ts` → `votre_type.ts`
4. **Tester** : `tsx scripts/generate-types-{votre-type}.ts`
5. **Ajouter** la commande dans `package.json`
6. **Créer** le wrapper dans `src/core/domain/votre-type.types.ts`

### Pour un type avec structure différente

1. **Copier** `generate-types-base.ts`
2. **Adapter** les fonctions d'extraction selon la structure
3. **Personnaliser** la génération du contenu TypeScript
4. **Tester** et valider

## 📊 Comparaison

| Critère | Simple | Générique |
|---------|--------|-----------|
| Facilité de compréhension | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| Facilité de modification | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| Réutilisabilité du code | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| Flexibilité | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| Maintenabilité | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Courbe d'apprentissage | ⭐⭐⭐⭐⭐ | ⭐⭐ |

## ✨ Bonnes pratiques

### ✅ À faire

- Préférer l'approche **simple** par défaut
- Créer un **wrapper** pour chaque type généré
- Toujours **tester** après génération
- Documenter les **particularités** de chaque type
- Utiliser le **cache** en développement

### ❌ À éviter

- Ne **pas mélanger** les deux approches pour le même type
- Ne **pas modifier** les fichiers générés manuellement
- Ne **pas commiter** les fichiers générés (`.gitignore`)
- Ne **pas commiter** le cache

## 🔍 Debug

### Le script ne trouve pas le fichier backend

```bash
# Vérifier le chemin
ls backend/app/types/base_types.ts

# Ajuster BACKEND_TYPES_PATH si nécessaire
```

### L'API échoue mais le fallback fonctionne

```bash
# C'est normal ! Le fallback est conçu pour ça
# Vérifier que le backend tourne pour utiliser l'API
cd backend && npm run dev
```

### Les types générés sont vides

```bash
# Vérifier les regex d'extraction
# Ajouter des logs dans readFromBackendFile()
console.log('Content:', content)
console.log('Match:', typesMatch)
```

## 📚 Ressources

- **Documentation complète** : `scripts/README.md`
- **Exemples d'utilisation** : `scripts/EXAMPLE_USAGE.md`
- **Backend types** : `backend/app/types/`
- **Contrôleur sync** : `backend/app/controllers/sync_controller.ts`

---

**Recommandation finale** : Utilisez l'**approche simple** sauf si vous avez une raison spécifique d'utiliser l'approche générique. La simplicité prime sur la réutilisation dans ce contexte.
