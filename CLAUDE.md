# CLAUDE.md

Guide principal pour Claude Code lors du développement dans ce repository.

---

## 🎯 Project Overview

**ONCC-V1** est une application web complète pour la gestion des chaînes d'approvisionnement du cacao et du café au Cameroun pour l'Office National du Cacao et du Café (ONCC). Elle intègre une architecture moderne avec capacités offline, Clean Architecture, et sécurité de niveau entreprise.

**Stack Principal**:
- **Frontend**: Next.js 15 + React 19 + Tailwind CSS v4 + TypeScript
- **Backend**: AdonisJS 6 + PostgreSQL 15 + Redis + Minio
- **Architecture**: Clean Architecture (Frontend) + MVC + Services (Backend)
- **Offline**: Dexie.js (IndexedDB) + Outbox Pattern

---

## 📖 Documentation Index

La documentation est organisée en fichiers thématiques pour faciliter la navigation.

### 🚀 Démarrage Rapide

1. **[QUICK-REFERENCE.md](./.claude/QUICK-REFERENCE.md)** ⭐ **COMMENCER ICI**
   - Commandes essentielles
   - Ports et URLs
   - Credentials de test
   - Import aliases
   - Patterns rapides
   - Règles d'or
   - Debug rapide

2. **[DEVELOPMENT-SETUP.md](./.claude/DEVELOPMENT-SETUP.md)** 🔧
   - Installation et configuration
   - Commandes fréquentes (Backend + Frontend)
   - Variables d'environnement
   - Troubleshooting
   - Testing

### 🏗️ Architecture

3. **[ARCHITECTURE-RULES.md](./.claude/ARCHITECTURE-RULES.md)** 📐
   - Clean Architecture Frontend (4 couches)
   - MVC + Services Backend
   - Règles strictes Frontend/Backend
   - Dependency Injection (tsyringe)
   - Repository Pattern
   - Store Zustand
   - Validation (Zod/VineJS)

4. **[FRONTEND.md](./.claude/FRONTEND.md)** ⚛️
   - Structure des répertoires
   - Clean Architecture détaillée
   - Patterns de développement
   - Feature `user` comme référence stricte

5. **[BACKEND.md](./.claude/BACKEND.md)** 🗄️
   - Structure des répertoires
   - Controllers, Services, Models
   - Validators VineJS
   - Middlewares
   - API Responses standardisées
   - Migrations
   - Audit Logs
   - `users_controller` comme référence stricte

### 🎨 Composants et Patterns

6. **[COMPONENTS-PATTERNS.md](./.claude/COMPONENTS-PATTERNS.md)** 🧩
   - Composants de base (EditForm, ViewContent, List)
   - Composants Form* (FormInput, FormSelect, FormDatePicker)
   - Layout patterns (disposition des champs)
   - Upload de documents (FormDocumentUploadWithOption)
   - Modals pattern

7. **[MULTI-STEP-FORMS.md](./.claude/MULTI-STEP-FORMS.md)** 📝
   - Architecture formulaires multi-étapes
   - Store Zustand avec persist
   - Hook de navigation
   - Schémas Zod
   - Auto-save pattern
   - Feature `actor` (Producer Add) comme référence stricte

### 🔐 Authentification et Sécurité

8. **[AUTHENTICATION.md](./.claude/AUTHENTICATION.md)** 🔒
   - Flux multi-facteur (Password + OTP)
   - Gestion sessions Redis
   - Initialisation compte
   - Réinitialisation mot de passe
   - Questions de sécurité
   - Protection des routes

### 🌍 Internationalisation

9. **[I18N-SETUP.md](./.claude/I18N-SETUP.md)** 🌐
   - Configuration i18next (FR/EN)
   - Hooks personnalisés (useLocale, useErrorTranslation)
   - Structure des traductions
   - Type-safety et autocomplétion
   - Support offline

9bis. **[I18N-ERROR-MIGRATION.md](./.claude/I18N-ERROR-MIGRATION.md)** 🔄 **MIGRATION i18n**
   - Guide de migration messages hardcodés → i18n
   - Pattern pour repositories et stores
   - Utilisation de `i18next.t()` dans les stores Zustand
   - Checklist de migration complète
   - Exemples de code avant/après

9ter. **[I18N-MIGRATION-REPORT.md](./.claude/I18N-MIGRATION-REPORT.md)** 📊
   - Rapport complet de la migration i18n (Nov 2025)
   - 4 repositories migrés avec succès
   - 40+ codes traduits (FR/EN)
   - Statistiques et métriques de succès

10. **[I18N-MODALS.md](./.claude/I18N-MODALS.md)** 🪟
    - Traduction complète d'une feature
    - Pattern de traduction des modals
    - Activation des namespaces
    - Architecture modals avec contexte
    - Comportement de fermeture

### 🔄 Workflows et Types

11. **[FEATURE-SIMPLE.md](./.claude/FEATURE-SIMPLE.md)** ⭐ **GUIDE COMPLET CRUD**
    - Guide exhaustif pour créer une feature CRUD simple
    - Checklist complète (8 phases : Backend + Frontend)
    - Code copier-coller pour chaque fichier
    - Exemples concrets avec feature `user` comme référence
    - **UTILISER EN PRIORITÉ pour toute nouvelle feature simple**

12. **[TYPES-AND-MAPPING.md](./.claude/TYPES-AND-MAPPING.md)** 🔄
    - Flux de transformation des données (Backend → API → Domain → UI)
    - Matrice de décision : quel type utiliser dans quel contexte
    - Exemples concrets de mapping complet
    - Erreurs courantes et solutions
    - Checklists de vérification

13. **[I18N-COMPLETE.md](./.claude/I18N-COMPLETE.md)** 🌐
    - Consolidation complète des règles i18n
    - Checklist traductions (FR + EN obligatoire)
    - Patterns d'utilisation dans composants
    - Hooks personnalisés détaillés
    - Exemples côte à côte FR/EN

14. **[RELATIONSHIPS.md](./.claude/RELATIONSHIPS.md)** 🔗
    - Guide complet relations entre entités (1:1, 1:N, N:N)
    - Migration, Models, Controllers
    - Sérialisation explicite des relations
    - Mapping frontend complet
    - Exemples réels du projet

15. **[WORKFLOWS.md](./.claude/WORKFLOWS.md)** 🔄
    - Vue d'ensemble des workflows
    - Référence vers guides spécialisés
    - Testing (backend et frontend)
    - Déploiement

16. **[TYPE-GENERATION.md](./.claude/TYPE-GENERATION.md)** 🔤
    - Synchronisation Backend → Frontend
    - Script de génération automatique
    - User Roles types
    - Value Object Pattern
    - Workflow d'ajout de nouveaux types

17. **[CI-CD-QUICKSTART.md](./CI-CD-QUICKSTART.md)** 🚀 **CI/CD & DÉPLOIEMENT**
    - Configuration GitHub Actions en 5 minutes
    - Build, test et dockerisation automatiques
    - Publication sur GitHub Container Registry (GHCR)
    - Déploiement sur Dokploy
    - Versioning avec tags

18. **[DEPLOYMENT.md](./DEPLOYMENT.md)** 🐳 **GUIDE COMPLET DÉPLOIEMENT**
    - Configuration complète GitHub Secrets
    - Docker Compose de production
    - Variables d'environnement détaillées
    - Reverse proxy Nginx
    - Monitoring et troubleshooting

19. **[LINT-FIX-SUMMARY.md](./LINT-FIX-SUMMARY.md)** 🔧 **QUALITÉ DU CODE**
    - Corrections lint et formatage
    - Règles ESLint et Prettier
    - Commandes de vérification
    - Workflow de formatage automatique

20. **[PWA.md](./.claude/PWA.md)** 📱 **PROGRESSIVE WEB APP**
    - Configuration PWA complète
    - Installation de l'application (desktop/mobile)
    - Mode offline total (142 routes précachées)
    - Service Worker intelligent
    - Synchronisation automatique
    - Guide de test et dépannage

### ⚠️ Pièges et Bonnes Pratiques

21. **[COMMON-PITFALLS.md](./.claude/COMMON-PITFALLS.md)** ⚠️ **LIRE EN PRIORITÉ**
    - Transactions database (db vs trx)
    - Sérialisation LucidORM des relations
    - Traductions backend/frontend manquantes
    - Mapping repository incomplet
    - Support des nouvelles actions audit
    - Checklist de débogage

---

## 🚀 Quick Start

### Démarrer le Projet

```bash
# Backend (Docker)
cd backend
npm run docker:dev          # Démarre API + PostgreSQL + Redis + Minio

# Frontend (nouveau terminal)
cd frontend
npm run dev                 # Port 3000
```

**Vérification**:
```bash
docker ps                   # Voir containers actifs
docker logs sifc_api_dev -f # Logs backend
```

### Credentials de Test

- **Username**: `b.efoo`
- **Password**: `12345678`
- **OTP**: `000000` (mode QA)
- **PIN Frontend**: `2354`

### URLs

- **Backend API**: http://localhost:3333
- **Frontend**: http://localhost:3000

---

## 🎯 Règles d'Or

### ✅ À FAIRE ABSOLUMENT

**Frontend**:
- ✅ Suivre strictement la feature `user` comme référence
- ✅ Clean Architecture (4 couches isolées)
- ✅ Routes au PLURIEL (`/users`, `/stores`, `/campaigns`)
- ✅ Un seul composant EditForm pour création ET modification
- ✅ Utiliser composants `Form*` (FormInput, FormSelect, FormDatePicker)
- ✅ Mapper TOUTES les propriétés de l'API dans le repository
- ✅ Traductions i18n (FR + EN, pas de texte en dur)

**Backend**:
- ✅ Suivre strictement `users_controller` et `user_service`
- ✅ UUID primary keys + Soft deletes
- ✅ **Utiliser `trx` dans les transactions** (jamais `db`)
- ✅ **Sérialiser explicitement** les relations: `.serialize({ relations: {...} })`
- ✅ Audit logs pour toutes les modifications
- ✅ ApiResponse standardisé
- ✅ Codes d'erreur centralisés

**Formulaires Multi-Étapes**:
- ✅ Suivre strictement la feature `actor` (Producer Add)
- ✅ Store Zustand avec persist
- ✅ Hook de navigation personnalisé
- ✅ Auto-save avec `form.watch()`
- ✅ Disposition: `lg:w-1/2` pour chaque champ
- ✅ `placeholder=""` (vide) sur tous les champs
- ✅ Pas de `required` sur FormDatePicker

### ❌ À NE JAMAIS FAIRE

**Frontend**:
- ❌ Appels API directs depuis les composants
- ❌ Routes au singulier
- ❌ Inputs HTML natifs (`<input>`, `<select>`)
- ❌ Texte en dur (utiliser i18n)
- ❌ Oublier de mapper des propriétés dans le repository

**Backend**:
- ❌ **Utiliser `db` au lieu de `trx` dans une transaction**
- ❌ **Oublier de sérialiser les relations** avant API response
- ❌ Logique métier dans les controllers
- ❌ Hard deletes
- ❌ Primary keys auto-increment

**Formulaires**:
- ❌ Utiliser des inputs HTML natifs
- ❌ Oublier `lg:w-1/2` sur les champs
- ❌ Mettre du texte dans les placeholders
- ❌ Ajouter `required` sur FormDatePicker

---

## 🔗 Import Aliases

### Frontend (`@/*`)

```typescript
import { useUserStore } from '@/features/user/infrastructure/store/userStore'
import { Button } from '@/components/ui/button'
import { DI_TOKENS } from '@/core/infrastructure/di/tokens'
import { USER_ROLES_ARRAY } from '@/core/domain/generated/user-roles.types'
```

### Backend (`#*`)

```typescript
import UsersController from '#controllers/users_controller'
import User from '#models/user'
import UserService from '#services/user_service'
import { ApiResponse } from '#utils/api_response'
```

---

## 📚 Fichiers de Référence

### Frontend

**Feature complète**: `frontend/src/features/user/`
- **Repository**: `user/infrastructure/repositories/UserRepository.ts`
- **Store**: `user/infrastructure/store/userStore.ts`
- **EditForm**: `user/presentation/components/UserEditForm.tsx`
- **ViewContent**: `user/presentation/components/UserViewContent.tsx`
- **List**: `user/presentation/components/UserList.tsx`

**Formulaires Multi-Étapes**: `frontend/src/features/actor/` (Producer Add)
- **Store**: `actor/infrastructure/store/producerAddFormStore.ts`
- **Hook Navigation**: `actor/presentation/hooks/useProducerAddFormNavigation.ts`
- **Step1**: `actor/presentation/components/Producer/ProducerAddStep1.tsx`
- **Page**: `app/(forms)/actors/producer/add/page.tsx`

### Backend

**Référence stricte**:
- **Controller**: `backend/app/controllers/users_controller.ts`
- **Service**: `backend/app/services/user_service.ts`
- **Model**: `backend/app/models/user.ts`
- **Validator**: `backend/app/validators/user_validator.ts`

---

## ⚠️ Pièges Critiques (Top 3)

**Voir [COMMON-PITFALLS.md](./.claude/COMMON-PITFALLS.md) pour la liste complète.**

1. **Transactions Database**
   - ❌ `await db.table('table').insert(...)` dans `db.transaction()` → Données perdues !
   - ✅ `await trx.table('table').insert(...)` → Correct

2. **Sérialisation LucidORM**
   - ❌ `return ApiResponse.success(response, code, actor)` → Relations perdues !
   - ✅ `return ApiResponse.success(response, code, actor.serialize({ relations: {...} }))` → Correct

3. **Mapping Repository**
   - ❌ Oublier `producers: response.producers` → Données perdues !
   - ✅ Mapper TOUS les champs incluant relations → Correct

---

## 🔍 Debug Rapide

### Backend ne démarre pas
```bash
cd backend
npm run docker:dev              # Démarre tout
docker logs sifc_api_dev -f     # Voir logs
```

### Frontend erreur 401
```typescript
// Vérifier token
localStorage.getItem('auth_token')
// Se reconnecter: b.efoo / 12345678 / OTP: 000000
```

### Migration échoue
```bash
docker exec -it sifc_api_dev node ace migration:rollback
# Corriger migration
docker exec -it sifc_api_dev node ace migration:run
```

**Pour plus de solutions**: [DEVELOPMENT-SETUP.md](./.claude/DEVELOPMENT-SETUP.md)

---

## 📋 Checklist Avant Commit

**Backend**:
- [ ] Transactions utilisent `trx` (pas `db`)
- [ ] Relations sérialisées explicitement
- [ ] Nouvelles actions audit traduites

**Frontend**:
- [ ] Mapping repository complet
- [ ] Traductions FR + EN présentes
- [ ] Composants `Form*` utilisés (pas d'inputs natifs)

**Formulaires Multi-Étapes**:
- [ ] Store avec persist
- [ ] Hook navigation implémenté
- [ ] Auto-save avec `form.watch()`
- [ ] Disposition `lg:w-1/2` ou grille

---

## 🆘 Support

Pour toute question:
1. Consulter cette documentation et les fichiers thématiques
2. Vérifier les fichiers de référence (`user` feature, `users_controller`)
3. Voir les logs dans `backend/logs/`

---

**📖 Pour plus de détails, consulter les fichiers de documentation dans `.claude/`**
