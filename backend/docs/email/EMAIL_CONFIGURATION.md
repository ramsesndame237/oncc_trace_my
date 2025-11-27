# Configuration Email SendGrid - SIFC

## Vue d'ensemble

Le système SIFC utilise SendGrid pour l'envoi d'emails automatisés, notamment :

- Codes OTP pour l'authentification 2FA
- Emails de bienvenue pour les nouveaux utilisateurs
- Notifications de changement de mot de passe
- Emails de récupération de compte

## Configuration

### 1. Variables d'environnement

Ajoutez ces variables à votre fichier `.env` :

```env
# Configuration SendGrid
SENDGRID_API_KEY=SG.your_actual_api_key_here
SENDGRID_FROM_EMAIL=noreply@oncc.cm
SENDGRID_FROM_NAME=SIFC - ONCC

# Configuration SMTP alternative (optionnel)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_app_password
```

### 2. Configuration SendGrid

#### Étape 1: Créer un compte SendGrid

1. Allez sur [SendGrid](https://sendgrid.com/)
2. Créez un compte (plan gratuit : 100 emails/jour)
3. Vérifiez votre email

#### Étape 2: Générer une clé API

1. Connectez-vous au tableau de bord SendGrid
2. Allez dans **Settings** > **API Keys**
3. Cliquez sur **Create API Key**
4. Nommez votre clé (ex: "SIFC-Production")
5. Choisissez **Restricted Access** et sélectionnez :
   - **Mail Send** : Full Access
   - **Template Engine** : Read Access (optionnel)
6. Copiez la clé générée

#### Étape 3: Authentification de l'expéditeur

1. Allez dans **Settings** > **Sender Authentication**
2. Choisissez une option :
   - **Single Sender Verification** (plus simple)
   - **Domain Authentication** (recommandé pour la production)

##### Option A: Single Sender Verification

1. Cliquez sur **Verify a Single Sender**
2. Remplissez le formulaire avec vos informations
3. Utilisez l'email vérifié dans `SENDGRID_FROM_EMAIL`

##### Option B: Domain Authentication (Recommandé)

1. Cliquez sur **Authenticate Your Domain**
2. Entrez votre domaine (ex: oncc.cm)
3. Suivez les instructions pour configurer les enregistrements DNS
4. Une fois vérifié, vous pouvez utiliser n'importe quelle adresse de ce domaine

## Architecture du service

### EmailService

Le service `EmailService` (`app/services/email_service.ts`) fournit les méthodes suivantes :

```typescript
// Envoi d'OTP
await EmailService.sendOTP(email, otpCode, userName)

// Email de bienvenue
await EmailService.sendWelcomeEmail(email, userName, tempPassword)

// Notification de changement de mot de passe
await EmailService.sendPasswordChangeNotification(email, userName)

// Test de configuration
await EmailService.testEmailConfiguration()
```

### Templates Email

Les templates sont situés dans `resources/views/emails/` :

- `otp.edge` : Code de vérification OTP
- `welcome.edge` : Email de bienvenue
- `password_changed.edge` : Notification de changement de mot de passe

## Tests

### 1. Test de configuration basique

```bash
node test_email_simple.js
```

### 2. Test complet via script

```bash
npm run test:email
```

### 3. Test via API

Démarrez le serveur et testez l'endpoint :

```bash
# Démarrer le serveur
npm run dev

# Tester la configuration
curl http://localhost:3333/api/v1/test-email
```

### 4. Test d'authentification réelle

Testez avec un utilisateur existant :

```bash
curl -X POST http://localhost:3333/api/v1/login \
  -H "Content-Type: application/json" \
  -d '{
    "pseudo": "admin",
    "password": "Admin123!"
  }'
```

## Dépannage

### Erreurs courantes

#### 1. "Unauthorized" (401)

- Vérifiez que votre clé API est correcte
- Assurez-vous qu'elle commence par "SG."
- Vérifiez les permissions de la clé API

#### 2. "Forbidden" (403)

- L'adresse expéditrice n'est pas vérifiée
- Configurez l'authentification de l'expéditeur dans SendGrid

#### 3. "Bad Request" (400)

- Vérifiez le format de l'adresse email
- Assurez-vous que tous les champs requis sont remplis

#### 4. Templates non trouvés

- Vérifiez que les fichiers `.edge` existent dans `resources/views/emails/`
- Redémarrez le serveur après modification des templates

### Logs de débogage

En mode développement, les codes OTP sont affichés dans les logs si l'envoi d'email échoue :

```
[DEV] Code OTP pour user@example.com: 123456
```

### Limites SendGrid

#### Plan gratuit

- 100 emails/jour
- Pas de support prioritaire
- Logo SendGrid dans les emails

#### Plans payants

- À partir de 14.95$/mois pour 40,000 emails
- Support prioritaire
- Pas de logo SendGrid
- Analytics avancées

## Sécurité

### Bonnes pratiques

1. **Clé API** :

   - Ne jamais commiter la clé API dans le code
   - Utiliser des clés avec permissions minimales
   - Régénérer les clés régulièrement

2. **Adresses email** :

   - Utiliser un domaine dédié (ex: noreply@oncc.cm)
   - Configurer SPF, DKIM et DMARC
   - Surveiller la réputation du domaine

3. **Contenu des emails** :
   - Ne jamais inclure de mots de passe en clair
   - Utiliser HTTPS pour tous les liens
   - Inclure des instructions de sécurité

## Monitoring

### Métriques à surveiller

1. **Taux de délivrance** : > 95%
2. **Taux d'ouverture** : Variable selon le type d'email
3. **Taux de bounce** : < 5%
4. **Taux de spam** : < 0.1%

### Tableau de bord SendGrid

Consultez régulièrement :

- **Activity** : Statut des emails envoyés
- **Stats** : Métriques de performance
- **Suppressions** : Emails bloqués ou désabonnés

## Support

### Ressources SendGrid

- [Documentation officielle](https://docs.sendgrid.com/)
- [Status page](https://status.sendgrid.com/)
- [Support SendGrid](https://support.sendgrid.com/)

### Support SIFC

- Vérifiez les logs du serveur
- Consultez cette documentation
- Contactez l'équipe de développement
