# SIFC Frontend - Système d'Information de la Filière Cacao et Café

## 🚀 Technologies Utilisées

- **Next.js 15** - Framework React avec App Router
- **TypeScript** - Typage statique
- **TailwindCSS v4** - Framework CSS utilitaire
- **Shadcn/ui** - Composants UI modernes et accessibles
- **Zustand** - Gestion d'état légère et performante
- **next-pwa** - Configuration Progressive Web App
- **Lucide React** - Icônes modernes

## 📱 Fonctionnalités PWA

L'application est configurée comme une Progressive Web App (PWA) avec :

- ✅ **Installation sur mobile et desktop**
- ✅ **Mode hors-ligne** avec cache intelligent
- ✅ **Notifications push** (à implémenter)
- ✅ **Mise à jour automatique**
- ✅ **Optimisation des performances**

### Configuration PWA

- **Manifest** : `/public/manifest.json`
- **Service Worker** : Généré automatiquement par next-pwa
- **Cache Strategy** : NetworkFirst pour les APIs, CacheFirst pour les assets statiques

## 🏗️ Architecture

### Structure des dossiers

```
src/
├── app/                 # App Router de Next.js
│   ├── page.tsx        # Page d'accueil
│   ├── layout.tsx      # Layout principal
│   └── globals.css     # Styles globaux
├── components/         # Composants réutilisables
│   └── ui/            # Composants Shadcn/ui
├── lib/               # Utilitaires et configuration
│   ├── store.ts       # Stores Zustand
│   └── utils.ts       # Fonctions utilitaires
└── types/             # Types TypeScript (à créer)
```

### Gestion d'État avec Zustand

Trois stores principaux :

1. **`useAuthStore`** - Authentification et utilisateur
2. **`useUIStore`** - Interface utilisateur et notifications
3. **`useAppDataStore`** - Données de l'application

```typescript
// Exemple d'utilisation
import { useAuthStore } from "@/lib/store";

const { user, isAuthenticated, login, logout } = useAuthStore();
```

## 🎨 Design System

### Couleurs principales

- **Vert** : `#16a34a` (primary) - Représente la nature et l'agriculture
- **Ambre** : `#d97706` (secondary) - Évoque le café et le cacao
- **Bleu** : `#2563eb` (accent) - Pour les éléments informatifs

### Composants UI

Utilisation de Shadcn/ui pour une interface cohérente :

```tsx
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
```

## 🔧 Installation et Développement

### Prérequis

- Node.js 18+
- npm ou yarn

### Installation

```bash
# Installer les dépendances
npm install

# Démarrer le serveur de développement
npm run dev

# Build de production
npm run build

# Démarrer en production
npm start
```

### Scripts disponibles

```bash
npm run dev          # Serveur de développement
npm run build        # Build de production
npm run start        # Serveur de production
npm run lint         # Vérification ESLint
npm run type-check   # Vérification TypeScript
```

## 🌐 Configuration PWA

### Installation sur mobile

1. Ouvrir l'application dans le navigateur
2. Appuyer sur "Ajouter à l'écran d'accueil"
3. L'application s'installe comme une app native

### Mode hors-ligne

- Les pages visitées sont mises en cache
- Les données critiques sont stockées localement
- Synchronisation automatique lors de la reconnexion

## 🔐 Authentification

### Flux d'authentification

1. **Connexion** : Pseudo/mot de passe
2. **2FA** : Code OTP par email
3. **Session** : Token JWT stocké de manière sécurisée
4. **Rôles** : technical_admin, basin_admin, field_agent

### Gestion des rôles

```typescript
// Vérification des permissions
const { user } = useAuthStore();
const isAdmin = user?.role === "technical_admin";
```

## 📱 Responsive Design

L'interface est optimisée pour :

- **Mobile** : 320px - 768px
- **Tablet** : 768px - 1024px
- **Desktop** : 1024px+

### Breakpoints TailwindCSS

```css
sm: 640px   /* Petit mobile */
md: 768px   /* Tablet */
lg: 1024px  /* Desktop */
xl: 1280px  /* Grand écran */
```

## 🚀 Déploiement

### Variables d'environnement

```env
NEXT_PUBLIC_API_URL=http://localhost:3333
NEXT_PUBLIC_APP_NAME=SIFC
NEXT_PUBLIC_APP_VERSION=1.0.0
```

### Build et déploiement

```bash
# Build optimisé
npm run build

# Test du build
npm start

# Analyse du bundle
npm run analyze
```

## 🧪 Tests (À implémenter)

### Framework de tests recommandé

- **Playwright** - Tests e2e
- **Jest** - Tests unitaires
- **Testing Library** - Tests de composants

### Structure des tests

```
tests/
├── e2e/              # Tests end-to-end
├── unit/             # Tests unitaires
└── components/       # Tests de composants
```

## 📊 Performance

### Optimisations incluses

- ✅ **Code splitting** automatique
- ✅ **Lazy loading** des composants
- ✅ **Optimisation des images** avec Next.js Image
- ✅ **Cache intelligent** avec PWA
- ✅ **Bundle analysis** disponible

### Métriques cibles

- **First Contentful Paint** : < 1.5s
- **Largest Contentful Paint** : < 2.5s
- **Cumulative Layout Shift** : < 0.1
- **First Input Delay** : < 100ms

## 🔄 Intégration Backend

### Configuration API

```typescript
// Configuration de base
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333";

// Exemple d'appel API
const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify(data),
});
```

## 🐛 Debugging

### Outils de développement

- **React DevTools** - Inspection des composants
- **Zustand DevTools** - Debugging du state
- **Network Tab** - Monitoring des requêtes API

### Logs et monitoring

```typescript
// Activation des logs Zustand en développement
const store = create(
  devtools(
    // store configuration
    { name: "store-name" }
  )
);
```

## 📚 Ressources

- [Next.js Documentation](https://nextjs.org/docs)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
- [Shadcn/ui Components](https://ui.shadcn.com)
- [Zustand Documentation](https://zustand-demo.pmnd.rs)
- [PWA Documentation](https://web.dev/progressive-web-apps)

## 🤝 Contribution

### Standards de code

- **ESLint** : Configuration stricte
- **Prettier** : Formatage automatique
- **TypeScript** : Typage strict
- **Conventional Commits** : Messages de commit standardisés

### Workflow de développement

1. Créer une branche feature
2. Développer et tester
3. Créer une Pull Request
4. Review et merge

---

**Version** : 1.0.0  
**Dernière mise à jour** : Décembre 2024
