# 📧 MailHog - Capture d'emails en développement

MailHog est un outil de capture d'emails pour l'environnement de développement. Il permet de tester l'envoi d'emails sans envoyer de vrais emails et de visualiser les emails dans une interface web.

---

## 🚀 Démarrage

MailHog est automatiquement démarré avec Docker Compose en mode développement.

```bash
cd backend
npm run docker:dev
```

---

## 🌐 Accès à l'interface web

Une fois les containers démarrés, accédez à l'interface web de MailHog :

**URL** : http://localhost:8025

L'interface affiche tous les emails capturés avec :

- L'expéditeur
- Le destinataire
- Le sujet
- Le contenu HTML et texte
- Les en-têtes complets

---

## 🔧 Configuration

### Configuration automatique (docker-compose.dev.yml)

MailHog est configuré automatiquement avec :

- **SMTP Server** : `mailhog:1025` (interne au réseau Docker)
- **Web UI** : `localhost:8025` (accessible depuis votre navigateur)

### Variables d'environnement (.env)

```env
# Configuration SMTP pour MailHog (développement)
SMTP_HOST=mailhog
SMTP_PORT=1025
```

---

## 📨 Tester l'envoi d'emails

### 1. Via l'application

Utilisez normalement les fonctionnalités qui envoient des emails :

- Création d'un compte utilisateur
- Réinitialisation de mot de passe
- Code OTP pour l'authentification
- etc.

Tous les emails seront capturés par MailHog et visibles dans l'interface web.

### 2. Via la fonction de test

Vous pouvez tester la configuration email avec :

```typescript
import { EmailService } from '#services/email_service'

// Envoie un email de test
await EmailService.testEmailConfiguration()
```

Ou via un endpoint API (si créé).

---

## 🎯 Fonctionnalités de l'interface web

### Visualisation des emails

- **Liste** : Tous les emails reçus
- **Détails** : Cliquez sur un email pour voir son contenu complet
- **HTML** : Prévisualisation du rendu HTML
- **Source** : Code source de l'email
- **Headers** : En-têtes SMTP complets

### Actions disponibles

- **Delete** : Supprimer un email spécifique
- **Delete all** : Supprimer tous les emails
- **Download** : Télécharger l'email au format .eml

### Recherche

- Recherche par expéditeur, destinataire, ou sujet
- Filtrage en temps réel

---

## 🔄 Basculer entre MailHog et SendGrid

### Développement (MailHog)

Dans votre `.env` :

```env
MAIL_MAILER=smtp
SMTP_HOST=mailhog
SMTP_PORT=1025
```

### Production (SendGrid)

Dans votre `.env` de production :

```env
MAIL_MAILER=sendgrid
SENDGRID_API_KEY=votre_clé_api_sendgrid
SENDGRID_FROM_EMAIL=noreply@oncc.cm
SENDGRID_FROM_NAME=ONCC TRACE
```

---

## 🐛 Dépannage

### MailHog ne capture pas les emails

1. **Vérifier que le container est démarré** :

   ```bash
   docker ps | grep mailhog
   ```

2. **Vérifier les logs** :

   ```bash
   docker logs sifc_mailhog_dev
   ```

3. **Vérifier la configuration SMTP** :

   - SMTP_HOST doit être `mailhog` (nom du service Docker)
   - SMTP_PORT doit être `1025`

4. **Redémarrer le container** :
   ```bash
   docker restart sifc_mailhog_dev
   ```

### L'interface web ne se charge pas

1. **Vérifier que le port 8025 est disponible** :

   ```bash
   lsof -i :8025
   ```

2. **Accéder via l'IP du container** :
   ```bash
   docker inspect sifc_mailhog_dev | grep IPAddress
   # Puis accéder à http://<IP>:8025
   ```

### Les emails ne s'affichent pas correctement

1. **Vérifier les templates Edge** dans `resources/views/emails/`
2. **Vérifier les variables passées** au template
3. **Voir les logs de l'API** :
   ```bash
   docker logs sifc_api_dev -f
   ```

---

## 📚 Emails disponibles dans l'application

| Email                  | Fonction                                  | Template                     |
| ---------------------- | ----------------------------------------- | ---------------------------- |
| Code OTP               | `sendOTP()`                               | `otp.edge`                   |
| Mot de passe modifié   | `sendPasswordChangeNotification()`        | `password_changed.edge`      |
| Bienvenue              | `sendWelcomeEmail()`                      | `welcome.edge`               |
| Compte initialisé      | `sendAccountInitializationNotification()` | `account_initialized.edge`   |
| Récupération pseudo    | `sendUserNameRecoveryEmail()`             | `pseudo_recovery.edge`       |
| Lien réinitialisation  | `sendPasswordResetLinkEmail()`            | `password_reset_link.edge`   |
| Compte activé          | `sendAccountActivatedEmail()`             | `account_activated.edge`     |
| Compte désactivé       | `sendAccountDeactivatedEmail()`           | `account_deactivated.edge`   |
| Réinitialisation admin | `sendAdminPasswordResetEmail()`           | `admin_password_reset.edge`  |
| Bienvenue gestionnaire | `sendActorManagerWelcomeEmail()`          | `actor_manager_welcome.edge` |

---

## 🎨 Aperçu de l'interface MailHog

```
┌─────────────────────────────────────────────────────────┐
│  MailHog                                         🔍      │
├─────────────────────────────────────────────────────────┤
│  Messages (5)                            Delete all     │
├─────────────────────────────────────────────────────────┤
│  ✉ Code de vérification ONCC TRACE                      │
│     From: noreply@oncc.cm  To: user@example.com        │
│     2024-01-15 14:30:25                                 │
├─────────────────────────────────────────────────────────┤
│  ✉ Bienvenue - Votre compte a été créé - ONCC TRACE    │
│     From: noreply@oncc.cm  To: newuser@example.com     │
│     2024-01-15 14:25:10                                 │
├─────────────────────────────────────────────────────────┤
│  ...                                                     │
└─────────────────────────────────────────────────────────┘
```

---

## 📖 Ressources

- **Documentation officielle** : https://github.com/mailhog/MailHog
- **API MailHog** : http://localhost:8025/api/v2/messages
- **Configuration AdonisJS Mail** : `config/mail.ts`
- **Service Email** : `app/services/email_service.ts`

---

## ✅ Checklist de vérification

- [ ] MailHog est démarré (`docker ps`)
- [ ] Interface web accessible sur http://localhost:8025
- [ ] Variables d'environnement configurées (SMTP_HOST, SMTP_PORT)
- [ ] Emails de test capturés et visibles
- [ ] Rendu HTML correct des templates
- [ ] Variables dynamiques affichées correctement (appName, supportEmail, etc.)

---

**Note** : MailHog est uniquement pour le développement. En production, utilisez SendGrid ou un autre service SMTP professionnel.
