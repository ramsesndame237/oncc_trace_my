# 🔐 Système d'Authentification SIFC

## Vue d'ensemble

Le système d'authentification SIFC implémente une authentification à deux facteurs (2FA) robuste avec :

- Authentification par pseudo/mot de passe
- Vérification par code OTP envoyé par email
- Gestion des rôles et permissions
- Récupération de compte via questions de sécurité
- Gestion des sessions sécurisées avec Redis

## Architecture

### Flux d'authentification

```mermaid
sequenceDiagram
    participant U as Utilisateur
    participant F as Frontend
    participant A as API
    participant R as Redis
    participant E as Email

    U->>F: Saisie pseudo/mot de passe
    F->>A: POST /api/v1/login
    A->>A: Vérification identifiants
    A->>R: Stockage OTP temporaire
    A->>E: Envoi code OTP
    A->>F: Réponse avec sessionKey

    U->>F: Saisie code OTP
    F->>A: POST /api/v1/verify-otp
    A->>R: Vérification OTP
    A->>A: Génération token JWT
    A->>F: Token d'accès + données utilisateur
```

### Composants principaux

1. **AuthController** : Gestion des endpoints d'authentification
2. **Session Model** : Gestion des sessions Redis
3. **User Model** : Modèle utilisateur avec authentification
4. **Middlewares** : Vérification des permissions
5. **Validators** : Validation des données d'entrée

## Endpoints d'authentification

### POST /api/v1/login

Première étape de l'authentification avec pseudo/mot de passe.

**Payload :**

```json
{
  "pseudo": "admin",
  "password": "Admin123!"
}
```

**Réponse succès :**

```json
{
  "success": true,
  "message": "Code de vérification envoyé par email",
  "requiresOtp": true,
  "mustChangePassword": false,
  "sessionKey": "auth_1_1703123456789"
}
```

### POST /api/v1/verify-otp

Vérification du code OTP et finalisation de la connexion.

**Payload :**

```json
{
  "otp": "123456",
  "sessionKey": "auth_1_1703123456789"
}
```

**Réponse succès :**

```json
{
  "success": true,
  "message": "Connexion réussie",
  "data": {
    "user": {
      "id": 1,
      "uuid": "550e8400-e29b-41d4-a716-446655440000",
      "pseudo": "admin",
      "nom": "Administrateur",
      "prenom": "Système",
      "email": "admin@oncc.cm",
      "role": "technical_admin",
      "langue": "fr",
      "mustChangePassword": false
    },
    "token": {
      "type": "Bearer",
      "value": "sifc_...",
      "expiresAt": "2024-01-30T10:00:00.000Z"
    }
  }
}
```

### POST /api/v1/logout

Déconnexion et révocation du token.

**Headers :**

```
Authorization: Bearer sifc_token_here
```

**Réponse :**

```json
{
  "success": true,
  "message": "Déconnexion réussie"
}
```

### POST /api/v1/change-password

Changement de mot de passe pour l'utilisateur connecté.

**Headers :**

```
Authorization: Bearer sifc_token_here
```

**Payload :**

```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewPassword123!",
  "confirmPassword": "NewPassword123!"
}
```

### POST /api/v1/forgot-password

Récupération de mot de passe via questions de sécurité.

**Payload :**

```json
{
  "pseudo": "admin"
}
```

**Réponse :**

```json
{
  "success": true,
  "data": {
    "securityQuestions": [
      {
        "id": 1,
        "question": "Quel est le nom de votre premier animal de compagnie ?"
      },
      {
        "id": 2,
        "question": "Dans quelle ville êtes-vous né(e) ?"
      },
      {
        "id": 3,
        "question": "Quel est le nom de jeune fille de votre mère ?"
      }
    ],
    "resetToken": "secure_reset_token_here"
  }
}
```

### POST /api/v1/reset-password

Réinitialisation du mot de passe après vérification des questions.

**Payload :**

```json
{
  "resetToken": "secure_reset_token_here",
  "answers": [
    {
      "id": 1,
      "answer": "Rex"
    },
    {
      "id": 2,
      "answer": "Douala"
    },
    {
      "id": 3,
      "answer": "Mballa"
    }
  ],
  "newPassword": "NewPassword123!",
  "confirmPassword": "NewPassword123!"
}
```

### GET /api/v1/me

Informations de l'utilisateur connecté.

**Headers :**

```
Authorization: Bearer sifc_token_here
```

## Sécurité

### Hachage des mots de passe

- Utilisation de **scrypt** (recommandé par AdonisJS)
- Salt automatique pour chaque mot de passe
- Vérification sécurisée avec protection contre les attaques temporelles

### Gestion des sessions

- Stockage des OTP dans Redis avec expiration (10 minutes)
- Tokens de réinitialisation sécurisés (30 minutes)
- Nettoyage automatique des sessions expirées

### Tokens JWT

- Expiration : 30 jours
- Préfixe : `sifc_`
- Stockage en base de données pour révocation
- Longueur du secret : 40 caractères

### Questions de sécurité

- 3 questions obligatoires par utilisateur
- Réponses hachées avec scrypt
- Normalisation (minuscules, trim) avant hachage

## Rôles et permissions

### Rôles disponibles

- **technical_admin** : Administrateur technique
- **bassin_admin** : Administrateur de bassin
- **field_agent** : Agent de terrain
- **gerant** : Gérant de magasin

### Middlewares de vérification

- `AuthMiddleware` : Vérification de l'authentification
- `RoleMiddleware` : Vérification des rôles spécifiques
- `TechnicalAdminMiddleware` : Accès administrateur technique uniquement

## Configuration

### Variables d'environnement

```env
# Clé de chiffrement de l'application
APP_KEY=your_32_character_secret_key

# Configuration Redis pour les sessions
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=
```

### Configuration des tokens

```typescript
// Dans User.ts
static accessTokens = DbAccessTokensProvider.forModel(User, {
  expiresIn: '30 days',
  prefix: 'sifc_',
  table: 'auth_access_tokens',
  type: 'auth_token',
  tokenSecretLength: 40,
})
```

## Tests

### Test de connexion

```bash
curl -X POST http://localhost:3333/api/v1/login \
  -H "Content-Type: application/json" \
  -d '{
    "pseudo": "admin",
    "password": "Admin123!"
  }'
```

### Test de vérification OTP

```bash
curl -X POST http://localhost:3333/api/v1/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "otp": "123456",
    "sessionKey": "auth_1_1703123456789"
  }'
```

### Test avec token

```bash
curl -X GET http://localhost:3333/api/v1/me \
  -H "Authorization: Bearer sifc_your_token_here"
```

## Dépannage

### Erreurs courantes

#### "Identifiants invalides"

- Vérifier le pseudo et le mot de passe
- S'assurer que le compte est actif

#### "Code de vérification invalide ou expiré"

- Vérifier que le code OTP est correct
- S'assurer qu'il n'a pas expiré (10 minutes)
- Vérifier la configuration email

#### "Token invalide"

- Vérifier que le token n'a pas expiré
- S'assurer que l'utilisateur n'a pas été déconnecté
- Vérifier le format du header Authorization

### Logs utiles

```bash
# Logs de l'application
tail -f logs/app.log

# Logs Redis (si configuré)
redis-cli monitor

# Vérification des sessions actives
redis-cli keys "auth_*"
```

## Maintenance

### Nettoyage des sessions expirées

Les sessions Redis sont automatiquement nettoyées grâce à l'expiration TTL.

### Révocation de tokens

```typescript
// Révoquer un token spécifique
await User.accessTokens.delete(user, tokenIdentifier)

// Révoquer tous les tokens d'un utilisateur
await User.accessTokens
  .all(user)
  .then((tokens) =>
    Promise.all(tokens.map((token) => User.accessTokens.delete(user, token.identifier)))
  )
```

### Monitoring

- Surveiller les tentatives de connexion échouées
- Monitorer l'utilisation de Redis
- Vérifier les logs d'erreur d'authentification

---

_Documentation mise à jour le : 2024-01-15_
