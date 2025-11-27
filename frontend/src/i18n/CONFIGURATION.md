# Configuration i18n - ONCC-V1

## ✅ Installation Terminée

Le système de traduction i18n est maintenant configuré dans ONCC-V1.

## 📦 Packages Installés

```json
{
  "i18next": "^25.5.3",
  "react-i18next": "^16.0.0",
  "i18next-browser-languagedetector": "^8.2.0"
}
```

## 📁 Structure Créée

```
frontend/src/i18n/
├── config.ts                    # Configuration i18next ✅
├── client.ts                    # Instance bundlée ✅
├── provider.tsx                 # Provider React ✅
├── types.d.ts                   # Types TypeScript ✅
├── index.ts                     # Exports publics ✅
├── README.md                    # Documentation complète ✅
├── CONFIGURATION.md             # Ce fichier ✅
│
├── locales/
│   ├── fr/                      # Français ✅
│   │   ├── common.json
│   │   ├── errors.json
│   │   ├── success.json
│   │   ├── ui.json
│   │   ├── validation.json
│   │   └── features/            # À remplir
│   │
│   └── en/                      # Anglais ✅
│       ├── common.json
│       ├── errors.json
│       ├── success.json
│       ├── ui.json
│       ├── validation.json
│       └── features/            # À remplir
│
└── utils/
    └── getErrorMessage.ts       # Helper codes d'erreur ✅

Hooks créés:
├── hooks/useLocale.ts           # Changer de langue ✅
├── hooks/useErrorTranslation.ts # Traduire codes erreur ✅
└── hooks/useDayjsLocale.ts      # Dates localisées ✅
```

## 🎯 Prochaines Étapes

### Étape 1: Intégrer dans le Layout (À FAIRE)

Éditer `frontend/src/app/layout.tsx`:

```tsx
import { I18nProvider } from '@/i18n';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <I18nProvider>
          {/* Reste de l'application */}
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
```

### Étape 2: Créer un Composant de Changement de Langue

Créer `components/LanguageSwitcher.tsx`:

```tsx
'use client';

import { useLocale } from '@/hooks/useLocale';

export function LanguageSwitcher() {
  const { currentLocale, changeLocale, isChanging } = useLocale();

  return (
    <div>
      <button
        onClick={() => changeLocale('fr')}
        disabled={isChanging || currentLocale === 'fr'}
      >
        Français
      </button>
      <button
        onClick={() => changeLocale('en')}
        disabled={isChanging || currentLocale === 'en'}
      >
        English
      </button>
    </div>
  );
}
```

### Étape 3: Remplir les Traductions Feature par Feature

Pour chaque feature (auth, user, etc.):

1. Créer `locales/fr/features/<feature>.json`
2. Créer `locales/en/features/<feature>.json`
3. Importer dans `client.ts`
4. Ajouter le type dans `types.d.ts`
5. Décommenter dans les ressources

**Exemple pour la feature user**:

```bash
# 1. Créer les fichiers
touch src/i18n/locales/fr/features/user.json
touch src/i18n/locales/en/features/user.json

# 2. Remplir le contenu (voir README.md pour exemples)

# 3. Importer dans client.ts
import userFr from './locales/fr/features/user.json';
import userEn from './locales/en/features/user.json';

# 4. Décommenter dans resources
const resources = {
  fr: { user: userFr, ... },
  en: { user: userEn, ... },
};

# 5. Décommenter dans types.d.ts
import type user from './locales/fr/features/user.json';
interface Resources { user: typeof user; }
```

### Étape 4: Migrer les Codes d'Erreur Backend

Copier les codes d'erreur depuis `backend/app/types/error_codes.ts` vers:
- `locales/fr/errors.json`
- `locales/en/errors.json`

**Format**:
```json
{
  "auth": {
    "AUTH_LOGIN_INVALID_CREDENTIALS": "Identifiants invalides",
    "AUTH_OTP_INVALID": "Code OTP invalide"
  },
  "user": {
    "USER_NOT_FOUND": "Utilisateur introuvable"
  }
}
```

### Étape 5: Migrer les Codes de Succès Backend

Copier depuis `backend/app/types/error_codes.ts` (section Success) vers:
- `locales/fr/success.json`
- `locales/en/success.json`

## 🔧 Utilisation de Base

### Dans un Composant

```tsx
'use client';

import { useTranslation } from 'react-i18next';

export function MyComponent() {
  const { t } = useTranslation('common');

  return (
    <div>
      <h1>{t('navigation.dashboard')}</h1>
      <button>{t('actions.save')}</button>
    </div>
  );
}
```

### Codes d'Erreur

```tsx
'use client';

import { useErrorTranslation } from '@/hooks/useErrorTranslation';

export function LoginForm() {
  const { translateError } = useErrorTranslation();

  const handleLogin = async () => {
    try {
      // ...
    } catch (err) {
      toast.error(translateError(err.code));
    }
  };
}
```

## 📚 Documentation

Voir `README.md` pour:
- Guide complet d'utilisation
- Exemples détaillés
- Bonnes pratiques
- Migration progressive

## ✨ Caractéristiques

✅ **100% Offline** - Traductions bundlées
✅ **Type-safe** - Autocomplétion TypeScript
✅ **Persistant** - localStorage
✅ **PWA Ready** - Fonctionne hors ligne
✅ **Performance** - Chargement instantané

## 🎨 Langues Supportées

- **Français (FR)** - Par défaut
- **Anglais (EN)**

## 📝 TODO

- [ ] Intégrer I18nProvider dans layout.tsx
- [ ] Créer composant LanguageSwitcher
- [ ] Remplir traductions feature auth
- [ ] Remplir traductions feature user
- [ ] Remplir traductions feature campaign
- [ ] Remplir traductions feature productionBasin
- [ ] Remplir traductions feature store
- [ ] Remplir traductions feature actor
- [ ] Remplir traductions feature parcel
- [ ] Remplir traductions feature document
- [ ] Remplir traductions feature auditLog
- [ ] Remplir traductions feature outbox
- [ ] Remplir traductions feature dashboard
- [ ] Remplir traductions feature location
- [ ] Remplir traductions feature pin
- [ ] Migrer tous les codes d'erreur backend
- [ ] Migrer tous les codes de succès backend
- [ ] Tester changement de langue
- [ ] Tester offline
- [ ] Tester traductions dans formulaires

---

**Configuration basée sur**: ProjectManagerGabon
**Adaptée pour**: ONCC-V1
**Date**: 22 octobre 2025
