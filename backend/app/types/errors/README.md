# Système de Codes d'Erreur Modulaire

## Structure

Le système de codes d'erreur a été réorganisé en modules séparés par domaine fonctionnel :

```
backend/app/types/errors/
├── auth.ts              # Codes d'authentification
├── user.ts              # Codes des utilisateurs
├── validation.ts        # Codes de validation
├── system.ts            # Codes système
├── production_basin.ts  # Codes des bassins de production
├── index.ts            # Exports unifiés et compatibilité
└── README.md           # Cette documentation
```

## Utilisation

### Nouveaux développements (recommandé)

Pour les nouveaux développements, utilisez les imports spécifiques par domaine :

```typescript
// Import spécifique pour l'authentification
import { AuthErrorCodes, AuthSuccessCodes, AuthErrorMessages } from '#types/errors/auth'

// Import spécifique pour les utilisateurs
import { UserErrorCodes, UserSuccessCodes, UserErrorMessages } from '#types/errors/user'

// Import spécifique pour les bassins de production
import {
  ProductionBasinErrorCodes,
  ProductionBasinSuccessCodes,
} from '#types/errors/production_basin'
```

### Compatibilité avec l'ancien système

L'ancien système continue de fonctionner sans modification :

```typescript
// Import unifié (compatibilité)
import { ErrorCodes, SuccessCodes, ErrorMessages } from '#types/error_codes'
```

## Avantages de la nouvelle structure

1. **Séparation des responsabilités** : Chaque domaine a ses propres codes
2. **Meilleure maintenabilité** : Plus facile d'ajouter/modifier des codes spécifiques
3. **Imports optimisés** : Import seulement ce qui est nécessaire
4. **Type safety améliorée** : Types plus spécifiques par domaine
5. **Compatibilité préservée** : Aucun impact sur le code existant

## Domaines disponibles

### AuthErrorCodes / AuthSuccessCodes

- Connexion, OTP, mots de passe
- Questions de sécurité, initialisation
- Sessions et tokens

### UserErrorCodes / UserSuccessCodes

- Création, mise à jour, suppression
- Récupération et listing
- Gestion des statuts

### ValidationErrorCodes

- Validation des formats
- Champs obligatoires
- Validation des tokens et OTP

### SystemErrorCodes

- Erreurs serveur et base de données
- Permissions et accès
- Configuration et services

### ProductionBasinErrorCodes / ProductionBasinSuccessCodes

- CRUD des bassins de production
- Assignation/désassignation des utilisateurs
- Autorisations spécifiques

## Migration progressive

1. **Phase 1** (actuelle) : Nouveau système disponible, ancien maintenu
2. **Phase 2** : Migration progressive des contrôleurs vers les imports spécifiques
3. **Phase 3** : Dépréciation de l'ancien système (optionnel)

## Exemple de migration

Avant :

```typescript
import { ErrorCodes, SuccessCodes } from '#types/error_codes'

// Utilisation
ErrorCodes.AUTH_LOGIN_FAILED
SuccessCodes.USER_CREATED
```

Après :

```typescript
import { AuthErrorCodes } from '#types/errors/auth'
import { UserSuccessCodes } from '#types/errors/user'

// Utilisation
AuthErrorCodes.LOGIN_FAILED
UserSuccessCodes.CREATED
```
