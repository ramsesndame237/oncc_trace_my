# Récupération de Pseudo et Mot de Passe

## Vue d'ensemble

Le système SIFC propose deux mécanismes de récupération pour les utilisateurs qui ont oublié leurs identifiants :

1. **Récupération de pseudo** : Envoi du pseudo par email
2. **Récupération de mot de passe** : Lien de réinitialisation avec questions de sécurité

## 1. Récupération de Pseudo

### Processus

1. L'utilisateur saisit son adresse email
2. Le système vérifie l'existence du compte
3. Si le compte existe, le pseudo est envoyé par email
4. L'utilisateur peut utiliser le pseudo pour se connecter

### Endpoint

**POST** `/api/v1/forgot-pseudo`

**Payload** :

```json
{
  "email": "utilisateur@example.com"
}
```

**Réponse** :

```json
{
  "success": true,
  "message": "Si ce compte existe, le pseudo a été envoyé par email"
}
```

### Sécurité

- Le système ne révèle jamais si un email existe ou non dans la base
- Même réponse pour les emails existants et non-existants
- Email envoyé uniquement si le compte existe réellement

## 2. Récupération de Mot de Passe

### Processus

1. **Demande de réinitialisation** : L'utilisateur saisit son email
2. **Envoi du lien** : Un lien sécurisé est envoyé par email (valide 30 minutes)
3. **Accès aux questions** : Le frontend utilise le token pour récupérer les questions de sécurité
4. **Vérification** : L'utilisateur répond aux questions et définit un nouveau mot de passe
5. **Confirmation** : Email de confirmation envoyé

### Endpoints

#### 2.1 Demande de réinitialisation

**POST** `/api/v1/forgot-password`

**Payload** :

```json
{
  "email": "utilisateur@example.com"
}
```

**Réponse** :

```json
{
  "success": true,
  "message": "Si ce compte existe, un lien de réinitialisation a été envoyé par email"
}
```

#### 2.2 Récupération des questions de sécurité

**GET** `/api/v1/security-questions?resetToken=<token>`

**Réponse** :

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
      }
    ],
    "userInfo": {
      "pseudo": "jdupont",
      "email": "jean.dupont@example.com",
      "nom": "Dupont",
      "prenom": "Jean"
    }
  }
}
```

#### 2.3 Réinitialisation du mot de passe

**POST** `/api/v1/reset-password`

**Payload** :

```json
{
  "resetToken": "token_de_reinitialisation",
  "answers": [
    {
      "id": 1,
      "answer": "Rex"
    },
    {
      "id": 2,
      "answer": "Paris"
    }
  ],
  "newPassword": "NouveauMotDePasse123!",
  "newPassword_confirmation": "NouveauMotDePasse123!"
}
```

**Réponse** :

```json
{
  "success": true,
  "message": "Mot de passe réinitialisé avec succès"
}
```

## 3. Prérequis

### Questions de Sécurité

- L'utilisateur doit avoir configuré au moins 2 questions de sécurité lors de l'initialisation de son compte
- Les réponses sont stockées de manière hachée et insensibles à la casse
- Si aucune question n'est configurée, la réinitialisation est impossible

### Configuration Frontend

La variable d'environnement `FRONTEND_URL` doit être configurée pour générer les liens corrects :

```env
FRONTEND_URL=https://sifc.oncc.cm
```

Le lien généré sera : `https://sifc.oncc.cm/reset-password?token=<resetToken>`

## 4. Templates Email

### Récupération de Pseudo

**Template** : `emails/pseudo_recovery.edge`

**Variables** :

- `userName` : Nom complet de l'utilisateur
- `pseudo` : Pseudo de l'utilisateur
- `supportEmail` : Email de support
- `year` : Année courante

### Lien de Réinitialisation

**Template** : `emails/password_reset_link.edge`

**Variables** :

- `userName` : Nom complet de l'utilisateur
- `resetUrl` : URL complète de réinitialisation
- `resetToken` : Token de sécurité
- `expirationMinutes` : Durée de validité (30 minutes)
- `supportEmail` : Email de support
- `year` : Année courante

## 5. Sécurité

### Tokens de Réinitialisation

- **Génération** : Tokens cryptographiquement sécurisés de 32 caractères
- **Stockage** : Redis avec expiration automatique (30 minutes)
- **Usage unique** : Le token est supprimé après utilisation
- **Validation** : Vérification de l'existence et de la validité avant usage

### Protection contre les Attaques

- **Énumération d'emails** : Réponses identiques pour emails existants/inexistants
- **Brute force** : Limitation par l'expiration des tokens
- **Réutilisation** : Tokens à usage unique
- **Timing attacks** : Temps de réponse constants

### Validation des Réponses

- **Normalisation** : Conversion en minuscules et suppression des espaces
- **Hachage** : Stockage sécurisé des réponses
- **Comparaison** : Vérification via hash.verify()

## 6. Gestion d'Erreurs

### Erreurs Communes

| Code | Message                                    | Cause                               |
| ---- | ------------------------------------------ | ----------------------------------- |
| 400  | Adresse email requise                      | Email manquant ou invalide          |
| 400  | Ce compte n'a pas de questions de sécurité | Questions non configurées           |
| 401  | Token invalide ou expiré                   | Token Redis expiré/inexistant       |
| 401  | Réponses incorrectes                       | Questions de sécurité mal répondues |
| 500  | Erreur d'envoi d'email                     | Problème SendGrid/SMTP              |

### Logs

- **Succès** : Envois d'emails réussis
- **Erreurs** : Échecs d'envoi et erreurs de validation
- **Sécurité** : Tentatives de réinitialisation avec tokens invalides

## 7. Tests

### Scénarios de Test

1. **Récupération de pseudo valide**
2. **Récupération de pseudo avec email inexistant**
3. **Réinitialisation complète avec questions correctes**
4. **Réinitialisation avec questions incorrectes**
5. **Utilisation de token expiré**
6. **Réutilisation de token**
7. **Compte sans questions de sécurité**

### Variables d'Environnement de Test

```env
DEFAULT_PASSWORD=123456
FRONTEND_URL=http://localhost:3000
SENDGRID_FROM_EMAIL=test@oncc.cm
SENDGRID_FROM_NAME=SIFC Test
```

## 8. Intégration Frontend

### Page de Récupération de Pseudo

```typescript
const forgotPseudo = async (email: string) => {
  const response = await fetch('/api/v1/forgot-pseudo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  return response.json()
}
```

### Page de Réinitialisation de Mot de Passe

```typescript
// 1. Demander la réinitialisation
const forgotPassword = async (email: string) => {
  const response = await fetch('/api/v1/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  return response.json()
}

// 2. Récupérer les questions (depuis le lien email)
const getSecurityQuestions = async (resetToken: string) => {
  const response = await fetch(`/api/v1/security-questions?resetToken=${resetToken}`)
  return response.json()
}

// 3. Réinitialiser le mot de passe
const resetPassword = async (data: ResetPasswordData) => {
  const response = await fetch('/api/v1/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return response.json()
}
```

## 9. Maintenance

### Nettoyage Redis

Les tokens expirés sont automatiquement supprimés par Redis. Aucune maintenance manuelle requise.

### Monitoring

- Surveiller les taux d'échec d'envoi d'emails
- Monitorer les tentatives de réinitialisation avec tokens invalides
- Vérifier les performances des requêtes de validation

---

_Cette documentation couvre l'ensemble du processus de récupération d'identifiants pour le système SIFC._
