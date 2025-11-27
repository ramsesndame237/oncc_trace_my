# Système de Traduction i18n - ONCC-V1

## Vue d'ensemble

Ce dossier contient le système de traduction multi-langues pour ONCC-V1, basé sur **i18next** et **react-i18next**.

### Caractéristiques

✅ **100% Offline**: Toutes les traductions sont bundlées (pas de requêtes HTTP)
✅ **Type-safe**: Autocomplétion TypeScript complète
✅ **Persistant**: Langue sauvegardée dans localStorage
✅ **PWA Ready**: Fonctionne complètement hors ligne
✅ **Performance**: Chargement instantané après initialisation

## Langues Supportées

- **Français (FR)** - Langue par défaut
- **Anglais (EN)**

## Structure des Fichiers

```
src/i18n/
├── config.ts                    # Configuration i18next
├── client.ts                    # Instance i18next bundlée
├── provider.tsx                 # Provider React
├── types.d.ts                   # Types TypeScript
├── index.ts                     # Exports publics
├── README.md                    # Cette documentation
│
├── locales/                     # Fichiers de traduction
│   ├── fr/                      # Traductions françaises
│   │   ├── common.json          # Traductions communes
│   │   ├── errors.json          # Codes d'erreur
│   │   ├── success.json         # Codes de succès
│   │   ├── ui.json              # Composants UI
│   │   ├── validation.json      # Messages de validation
│   │   └── features/            # Traductions par feature
│   │       ├── auth.json
│   │       ├── user.json
│   │       ├── campaign.json
│   │       └── ...
│   │
│   └── en/                      # Traductions anglaises (structure identique)
│
└── utils/
    └── getErrorMessage.ts       # Helper traduction codes d'erreur
```

## Namespaces

### Génériques

- **common**: Actions, navigation, statuts
- **errors**: Codes d'erreur génériques
- **success**: Messages de succès
- **ui**: Composants UI génériques
- **validation**: Messages de validation

### Features

- **auth**: Authentification
- **user**: Utilisateurs
- **auditLog**: Journaux d'audit
- **dashboard**: Tableau de bord
- **document**: Documents
- **location**: Localisation
- **outbox**: Synchronisation offline
- **campaign**: Campagnes
- **productionBasin**: Bassins de production
- **store**: Magasins/Points de vente
- **actor**: Acteurs (producteurs)
- **parcel**: Parcelles
- **pin**: Code PIN

## Utilisation

### 1. Hook de base: `useTranslation`

```tsx
'use client';

import { useTranslation } from 'react-i18next';

export function MyComponent() {
  const { t } = useTranslation('user');

  return (
    <div>
      <h1>{t('form.editUser')}</h1>
      <button>{t('common:actions.save')}</button>
    </div>
  );
}
```

**Rendu FR**: "Modifier l'utilisateur" / "Enregistrer"
**Rendu EN**: "Edit user" / "Save"

### 2. Hook `useLocale`: Changer de langue

```tsx
'use client';

import { useLocale } from '@/hooks/useLocale';

export function LanguageSwitcher() {
  const { currentLocale, changeLocale, isChanging } = useLocale();

  return (
    <div>
      <p>Langue actuelle: {currentLocale}</p>
      <button
        onClick={() => changeLocale('fr')}
        disabled={isChanging}
      >
        Français
      </button>
      <button
        onClick={() => changeLocale('en')}
        disabled={isChanging}
      >
        English
      </button>
    </div>
  );
}
```

✅ La langue est automatiquement persistée dans localStorage

### 3. Hook `useErrorTranslation`: Codes d'erreur/succès

```tsx
'use client';

import { useErrorTranslation } from '@/hooks/useErrorTranslation';

export function LoginForm() {
  const { translateError, translateSuccess } = useErrorTranslation();

  const handleLogin = async (credentials) => {
    try {
      const result = await loginAPI(credentials);
      toast.success(translateSuccess('AUTH_LOGIN_SUCCESS'));
      // FR: "Connexion réussie"
      // EN: "Login successful"
    } catch (err) {
      toast.error(translateError(err.code, 'Une erreur est survenue'));
      // FR: "Identifiants invalides"
      // EN: "Invalid credentials"
    }
  };

  return <form onSubmit={handleLogin}>...</form>;
}
```

### 4. Hook `useDayjsLocale`: Dates localisées

```tsx
'use client';

import { useDayjsLocale } from '@/hooks/useDayjsLocale';

export function DateDisplay() {
  const dayjs = useDayjsLocale();

  return (
    <div>
      <p>{dayjs().format('LL')}</p>
      {/* FR: "22 octobre 2025" */}
      {/* EN: "October 22, 2025" */}

      <p>{dayjs().fromNow()}</p>
      {/* FR: "il y a 2 heures" */}
      {/* EN: "2 hours ago" */}
    </div>
  );
}
```

### 5. Interpolation de variables

```tsx
const { t } = useTranslation('common');

// Traduction: "Affichage de {{from}} à {{to}} sur {{total}} éléments"
<p>{t('table.showing', { from: 1, to: 10, total: 50 })}</p>

// Rendu FR: "Affichage de 1 à 10 sur 50 éléments"
// Rendu EN: "Showing 1 to 10 of 50 items"
```

### 6. Utilisation dans les schémas de validation

```tsx
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

export function UserForm() {
  const { t } = useTranslation(['user', 'validation']);

  const schema = z.object({
    email: z.string()
      .email(t('validation:messages.emailInvalid'))
      .min(1, t('common:validation.required')),
    password: z.string()
      .min(8, t('validation:messages.passwordMinLength', { min: 8 })),
  });

  // ...
}
```

## Ajouter une Nouvelle Traduction

### Étape 1: Créer les fichiers JSON

```bash
# Créer le fichier français
touch src/i18n/locales/fr/features/myFeature.json

# Créer le fichier anglais
touch src/i18n/locales/en/features/myFeature.json
```

### Étape 2: Ajouter le contenu

**`locales/fr/features/myFeature.json`**:
```json
{
  "form": {
    "title": "Mon titre",
    "description": "Ma description"
  },
  "messages": {
    "success": "Opération réussie"
  }
}
```

**`locales/en/features/myFeature.json`**:
```json
{
  "form": {
    "title": "My title",
    "description": "My description"
  },
  "messages": {
    "success": "Operation successful"
  }
}
```

### Étape 3: Ajouter le namespace dans `config.ts`

```typescript
export const namespaces = [
  // ... autres namespaces
  'myFeature',  // ✅ Ajouter ici
] as const;
```

### Étape 4: Importer dans `client.ts`

```typescript
// Français
import myFeatureFr from './locales/fr/features/myFeature.json';

// Anglais
import myFeatureEn from './locales/en/features/myFeature.json';

const resources = {
  fr: {
    // ...
    myFeature: myFeatureFr,
  },
  en: {
    // ...
    myFeature: myFeatureEn,
  },
};
```

### Étape 5: Ajouter le type dans `types.d.ts`

```typescript
import type myFeature from './locales/fr/features/myFeature.json';

interface Resources {
  // ...
  myFeature: typeof myFeature;
}
```

### Étape 6: Utiliser

```tsx
'use client';

import { useTranslation } from 'react-i18next';

export function MyComponent() {
  const { t } = useTranslation('myFeature');

  return <h1>{t('form.title')}</h1>;
}
```

## Ajouter des Codes d'Erreur/Succès

### 1. Ajouter dans `locales/fr/errors.json`

```json
{
  "user": {
    "USER_NOT_FOUND": "Utilisateur introuvable",
    "USER_CREATE_EMAIL_EXISTS": "Un utilisateur avec cet email existe déjà"
  }
}
```

### 2. Ajouter dans `locales/en/errors.json`

```json
{
  "user": {
    "USER_NOT_FOUND": "User not found",
    "USER_CREATE_EMAIL_EXISTS": "A user with this email already exists"
  }
}
```

### 3. Ajouter le préfixe dans `utils/getErrorMessage.ts`

```typescript
export function getErrorTranslationKey(errorCode: string): string {
  // ...

  if (errorCode.startsWith('USER_')) {
    return `errors:user.${errorCode}`;
  }

  // ...
}
```

### 4. Utiliser

```tsx
const { translateError } = useErrorTranslation();
const message = translateError('USER_NOT_FOUND');
// FR: "Utilisateur introuvable"
// EN: "User not found"
```

## Bonnes Pratiques

### 1. Organisation Hiérarchique

✅ **BON**:
```json
{
  "form": {
    "email": "Adresse email",
    "password": "Mot de passe"
  },
  "table": {
    "noUsers": "Aucun utilisateur"
  }
}
```

❌ **MAUVAIS**:
```json
{
  "email": "Adresse email",
  "password": "Mot de passe",
  "noUsers": "Aucun utilisateur"
}
```

### 2. Nommage Descriptif

✅ **BON**: `auth:form.username`
❌ **MAUVAIS**: `auth:user1`

### 3. Utiliser `translateError` avec Constantes

✅ **BON**:
```tsx
const message = translateError('AUTH_LOGIN_INVALID_CREDENTIALS');
```

❌ **MAUVAIS**:
```tsx
const message = "Identifiants invalides";
```

### 4. Toujours Fournir des Fallback

```tsx
const message = translateError(err.code, 'Une erreur est survenue');
```

### 5. Grouper par Feature

- Créer un fichier par feature dans `locales/{lang}/features/`
- Garder `common.json` pour les traductions génériques

## Offline & PWA

✅ **Toutes les traductions sont bundlées** - Pas de requête HTTP
✅ **Langue persistée** dans localStorage (`i18nextLng`)
✅ **Fonctionne 100% offline** après le premier chargement
✅ **Détection automatique** de la langue du navigateur au premier démarrage

## Intégration dans l'Application

Le `I18nProvider` doit être placé au niveau racine dans `app/layout.tsx`:

```tsx
import { I18nProvider } from '@/i18n';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <I18nProvider>
          {/* Reste de l'app */}
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
```

## Debug

### Vérifier la langue actuelle

```tsx
const { i18n } = useTranslation();
console.log('Langue:', i18n.language); // ex: "fr"
```

### Vérifier le localStorage

```javascript
localStorage.getItem('i18nextLng'); // "fr" ou "en"
```

### Forcer une langue

```tsx
await i18n.changeLanguage('en');
```

## Migration Progressive

Les fichiers de traduction peuvent être ajoutés progressivement :

1. Commencer avec `common.json`, `errors.json`, `success.json`
2. Ajouter les features une par une
3. Décommenter les imports dans `client.ts` et `types.d.ts` au fur et à mesure

---

**Note**: Ce système est basé sur le projet ProjectManagerGabon et adapté pour ONCC-V1.
