# Codes d'erreur et de succès API ONCC

Ce document décrit le système de codes d'erreur et de succès standardisé de l'API ONCC.

## Format des réponses

### Réponse de succès

```json
{
  "success": true,
  "message": "Message de succès en français",
  "successCode": "CODE_DE_SUCCES",
  "data": {}, // Données optionnelles
  "timestamp": "2024-01-15T10:30:00.000Z",
  "requestId": "req_1705320600000_abc123def"
}
```

### Réponse d'erreur

```json
{
  "success": false,
  "message": "Message d'erreur en français",
  "errorCode": "CODE_D_ERREUR",
  "details": {}, // Détails optionnels (en développement)
  "timestamp": "2024-01-15T10:30:00.000Z",
  "requestId": "req_1705320600000_abc123def"
}
```

### Réponse d'erreur de validation

```json
{
  "success": false,
  "message": "Données de validation invalides",
  "errorCode": "VALIDATION_INVALID_FORMAT",
  "validationErrors": [
    {
      "field": "email",
      "message": "Le format d'email est invalide",
      "value": "email-invalide"
    }
  ],
  "timestamp": "2024-01-15T10:30:00.000Z",
  "requestId": "req_1705320600000_abc123def"
}
```

## Codes d'erreur par catégorie

### 🔐 Authentification

#### Connexion

| Code                             | Message                                                            | Description                                     |
| -------------------------------- | ------------------------------------------------------------------ | ----------------------------------------------- |
| `AUTH_LOGIN_INVALID_CREDENTIALS` | Identifiants invalides                                             | Pseudo ou mot de passe incorrect                |
| `AUTH_LOGIN_ACCOUNT_INACTIVE`    | Compte inactif ou bloqué                                           | Le compte utilisateur n'est pas actif           |
| `AUTH_LOGIN_ACCOUNT_BLOCKED`     | Compte bloqué. Contactez un administrateur                         | Compte explicitement bloqué                     |
| `AUTH_LOGIN_DEFAULT_PASSWORD`    | Mot de passe par défaut utilisé, veuillez initialiser votre compte | Première connexion avec mot de passe temporaire |
| `AUTH_LOGIN_FAILED`              | Erreur lors de la connexion                                        | Erreur technique générale                       |

#### OTP (Code de vérification)

| Code                       | Message                                        | Description                      |
| -------------------------- | ---------------------------------------------- | -------------------------------- |
| `AUTH_OTP_INVALID`         | Code de vérification invalide                  | Code OTP incorrect               |
| `AUTH_OTP_EXPIRED`         | Code de vérification expiré                    | Code OTP expiré                  |
| `AUTH_OTP_SESSION_INVALID` | Session invalide, veuillez vous reconnecter    | Clé de session invalide          |
| `AUTH_OTP_SEND_FAILED`     | Erreur lors de l'envoi du code de vérification | Échec envoi email                |
| `AUTH_OTP_VERIFY_FAILED`   | Erreur lors de la vérification du code         | Erreur technique de vérification |

#### Mot de passe

| Code                                   | Message                                            | Description                          |
| -------------------------------------- | -------------------------------------------------- | ------------------------------------ |
| `AUTH_PASSWORD_CHANGE_CURRENT_INVALID` | Mot de passe actuel incorrect                      | Mot de passe actuel fourni incorrect |
| `AUTH_PASSWORD_CHANGE_FAILED`          | Erreur lors du changement de mot de passe          | Erreur technique                     |
| `AUTH_PASSWORD_RESET_TOKEN_INVALID`    | Token de réinitialisation invalide                 | Token invalide ou expiré             |
| `AUTH_PASSWORD_RESET_FAILED`           | Erreur lors de la réinitialisation du mot de passe | Erreur technique                     |
| `AUTH_PASSWORD_FORGOT_EMAIL_NOT_FOUND` | Aucun compte associé à cette adresse email         | Email non trouvé                     |
| `AUTH_PASSWORD_FORGOT_SEND_FAILED`     | Erreur lors de l'envoi de l'email de récupération  | Échec envoi email                    |

#### Questions de sécurité

| Code                                      | Message                                                   | Description                  |
| ----------------------------------------- | --------------------------------------------------------- | ---------------------------- |
| `AUTH_SECURITY_QUESTIONS_INVALID_ANSWERS` | Réponses aux questions de sécurité incorrectes            | Réponses incorrectes         |
| `AUTH_SECURITY_QUESTIONS_NOT_FOUND`       | Questions de sécurité non trouvées                        | Pas de questions configurées |
| `AUTH_SECURITY_QUESTIONS_SETUP_FAILED`    | Erreur lors de la configuration des questions de sécurité | Erreur technique             |

#### Session et tokens

| Code                   | Message                                    | Description      |
| ---------------------- | ------------------------------------------ | ---------------- |
| `AUTH_SESSION_EXPIRED` | Session expirée, veuillez vous reconnecter | Session expirée  |
| `AUTH_TOKEN_INVALID`   | Token d'accès invalide                     | Token malformé   |
| `AUTH_TOKEN_EXPIRED`   | Token d'accès expiré                       | Token expiré     |
| `AUTH_LOGOUT_FAILED`   | Erreur lors de la déconnexion              | Erreur technique |

### 👥 Utilisateurs

#### Création

| Code                           | Message                                     | Description         |
| ------------------------------ | ------------------------------------------- | ------------------- |
| `USER_CREATE_EMAIL_EXISTS`     | Un utilisateur avec cet email existe déjà   | Email déjà utilisé  |
| `USER_CREATE_PSEUDO_EXISTS`    | Un utilisateur avec ce pseudo existe déjà   | Pseudo déjà utilisé |
| `USER_CREATE_BASSIN_NOT_FOUND` | Bassin de production introuvable            | ID bassin invalide  |
| `USER_CREATE_FAILED`           | Erreur lors de la création de l'utilisateur | Erreur technique    |

#### Récupération

| Code               | Message                                         | Description             |
| ------------------ | ----------------------------------------------- | ----------------------- |
| `USER_NOT_FOUND`   | Utilisateur introuvable                         | ID utilisateur invalide |
| `USER_LIST_FAILED` | Erreur lors de la récupération des utilisateurs | Erreur technique        |

#### Mise à jour

| Code                        | Message                                        | Description       |
| --------------------------- | ---------------------------------------------- | ----------------- |
| `USER_UPDATE_EMAIL_EXISTS`  | Un autre utilisateur utilise déjà cet email    | Email en conflit  |
| `USER_UPDATE_PSEUDO_EXISTS` | Un autre utilisateur utilise déjà ce pseudo    | Pseudo en conflit |
| `USER_UPDATE_FAILED`        | Erreur lors de la mise à jour de l'utilisateur | Erreur technique  |

### ✅ Validation

| Code                                 | Message                                                                                                               | Description                 |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| `VALIDATION_REQUIRED_FIELD_MISSING`  | Champ obligatoire manquant                                                                                            | Champ requis absent         |
| `VALIDATION_INVALID_FORMAT`          | Format invalide                                                                                                       | Format de données incorrect |
| `VALIDATION_INVALID_EMAIL`           | Format d'email invalide                                                                                               | Email malformé              |
| `VALIDATION_INVALID_PASSWORD_FORMAT` | Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial | Mot de passe faible         |
| `VALIDATION_INVALID_OTP_FORMAT`      | Le code OTP doit contenir exactement 6 chiffres                                                                       | Format OTP incorrect        |

### ⚙️ Système

| Code                    | Message                   | Description            |
| ----------------------- | ------------------------- | ---------------------- |
| `SYSTEM_INTERNAL_ERROR` | Erreur interne du serveur | Erreur non gérée       |
| `SYSTEM_UNAUTHORIZED`   | Non autorisé              | Pas d'authentification |
| `SYSTEM_FORBIDDEN`      | Accès interdit            | Pas d'autorisation     |

## Codes de succès

### 🔐 Authentification

| Code                          | Message                                 |
| ----------------------------- | --------------------------------------- |
| `AUTH_LOGIN_SUCCESS`          | Connexion réussie                       |
| `AUTH_LOGIN_OTP_SENT`         | Code de vérification envoyé par email   |
| `AUTH_OTP_VERIFIED`           | Code de vérification validé avec succès |
| `AUTH_LOGOUT_SUCCESS`         | Déconnexion réussie                     |
| `AUTH_PASSWORD_CHANGED`       | Mot de passe modifié avec succès        |
| `AUTH_PASSWORD_RESET_SUCCESS` | Mot de passe réinitialisé avec succès   |
| `AUTH_ACCOUNT_INITIALIZED`    | Compte initialisé avec succès           |

### 👥 Utilisateurs

| Code                   | Message                                        |
| ---------------------- | ---------------------------------------------- |
| `USER_CREATED`         | Utilisateur créé avec succès                   |
| `USER_UPDATED`         | Utilisateur mis à jour avec succès             |
| `USER_DELETED`         | Utilisateur supprimé avec succès               |
| `USER_LIST_SUCCESS`    | Liste des utilisateurs récupérée avec succès   |
| `USER_DETAILS_SUCCESS` | Détails de l'utilisateur récupérés avec succès |

## Gestion des erreurs côté frontend

### Exemple de traitement générique

```typescript
interface ApiResponse<T = any> {
  success: boolean
  message: string
  errorCode?: string
  successCode?: string
  data?: T
  validationErrors?: Array<{
    field: string
    message: string
    value?: any
  }>
  timestamp: string
  requestId: string
}

async function handleApiCall<T>(apiCall: () => Promise<ApiResponse<T>>) {
  try {
    const response = await apiCall()

    if (response.success) {
      // Traiter le succès
      console.log(`Succès: ${response.message}`)
      return response.data
    } else {
      // Traiter l'erreur
      handleError(response)
      return null
    }
  } catch (error) {
    console.error('Erreur réseau:', error)
    throw error
  }
}

function handleError(response: ApiResponse) {
  switch (response.errorCode) {
    case 'AUTH_LOGIN_INVALID_CREDENTIALS':
      showError('Identifiants incorrects')
      break
    case 'USER_CREATE_EMAIL_EXISTS':
      showFieldError('email', 'Cette adresse email est déjà utilisée')
      break
    case 'VALIDATION_INVALID_FORMAT':
      if (response.validationErrors) {
        response.validationErrors.forEach((error) => {
          showFieldError(error.field, error.message)
        })
      }
      break
    default:
      showError(response.message)
  }
}
```

### Codes d'erreur spécifiques à traiter

#### Connexion

- `AUTH_LOGIN_INVALID_CREDENTIALS` → Afficher erreur sur le formulaire
- `AUTH_LOGIN_DEFAULT_PASSWORD` → Rediriger vers initialisation
- `AUTH_OTP_INVALID` → Afficher erreur sur le champ OTP

#### Création d'utilisateur

- `USER_CREATE_EMAIL_EXISTS` → Erreur sur le champ email
- `USER_CREATE_PSEUDO_EXISTS` → Erreur sur le champ pseudo
- `VALIDATION_INVALID_PASSWORD_FORMAT` → Erreur sur le champ mot de passe

#### Gestion d'état

- `AUTH_TOKEN_EXPIRED` → Rediriger vers login
- `SYSTEM_UNAUTHORIZED` → Rediriger vers login
- `USER_NOT_FOUND` → Afficher page 404

## Bonnes pratiques

1. **Toujours vérifier `success`** avant de traiter `data`
2. **Utiliser `errorCode`** pour la logique conditionnelle
3. **Afficher `message`** à l'utilisateur (déjà en français)
4. **Logger `requestId`** pour le debugging
5. **Traiter les `validationErrors`** pour les erreurs de formulaire
6. **Gérer les timeouts et erreurs réseau** séparément

## Statuts HTTP

| Statut | Usage                | Exemples de codes                               |
| ------ | -------------------- | ----------------------------------------------- |
| 200    | Succès               | Tous les codes de succès                        |
| 201    | Création réussie     | `USER_CREATED`                                  |
| 400    | Erreur client        | Codes de validation, `USER_CREATE_EMAIL_EXISTS` |
| 401    | Non authentifié      | Codes `AUTH_*`                                  |
| 403    | Interdit             | `SYSTEM_FORBIDDEN`                              |
| 404    | Non trouvé           | `USER_NOT_FOUND`                                |
| 422    | Erreur de validation | `VALIDATION_*` avec `validationErrors`          |
| 500    | Erreur serveur       | `SYSTEM_INTERNAL_ERROR`                         |
