# 📚 Documentation SIFC Backend

Bienvenue dans la documentation du backend du Système d'Information de la Filière Cacao et Café (SIFC) de l'Office National du Cacao et du Café (ONCC).

## 🏗️ Architecture et Configuration

### Infrastructure

- [🐳 **Déploiement**](./deployment/DEPLOYMENT.md) - Guide de déploiement Docker et production
- [🔧 **Développement**](./development/DEVELOPMENT.md) - Configuration de l'environnement de développement
- [🗄️ **Base de données**](./database/DATABASE.md) - Schéma et configuration PostgreSQL
- [🔴 **Redis**](./redis/REDIS_SETUP.md) - Configuration et utilisation de Redis

### Sécurité et Authentification

- [🔐 **Authentification**](./auth/AUTHENTICATION.md) - Système d'authentification 2FA complet
- [👥 **Rôles et Permissions**](./auth/USER_ROLES.md) - Gestion des rôles utilisateurs
- [🔑 **Sessions Redis**](./auth/REDIS_AUTH.md) - Gestion des sessions et tokens

### Communication

- [📧 **Configuration Email**](./email/EMAIL_CONFIGURATION.md) - Configuration SendGrid et templates
- [✉️ **Setup SendGrid**](./email/SENDGRID_SETUP.md) - Guide de configuration SendGrid

## 🚀 Guides de Démarrage Rapide

### Pour les Développeurs

1. [Configuration de l'environnement](./development/DEVELOPMENT.md)
2. [Configuration de la base de données](./database/DATABASE.md)
3. [Configuration Redis](./redis/REDIS_SETUP.md)
4. [Configuration des emails](./email/EMAIL_CONFIGURATION.md)

### Pour les Administrateurs

1. [Guide de déploiement](./deployment/DEPLOYMENT.md)
2. [Gestion des utilisateurs](./auth/USER_ROLES.md)
3. [Monitoring et maintenance](./monitoring/MONITORING.md)

## 📖 Références Techniques

### API et Endpoints

- [🔌 **API Reference**](./api/API_REFERENCE.md) - Documentation complète des endpoints
- [🧪 **Tests**](./testing/TESTING.md) - Guide des tests et validation

### Base de Données

- [📊 **Schéma de données**](./database/SCHEMA.md) - Structure détaillée des tables
- [🔄 **Migrations**](./database/MIGRATIONS.md) - Historique et gestion des migrations

### Sécurité

- [🛡️ **Sécurité**](./security/SECURITY.md) - Bonnes pratiques et configuration
- [🔍 **Audit**](./security/AUDIT.md) - Système de logs d'audit

## 🔧 Maintenance et Dépannage

### Guides de Dépannage

- [🚨 **Dépannage Redis**](./troubleshooting/REDIS_TROUBLESHOOTING.md)
- [📧 **Dépannage Email**](./troubleshooting/EMAIL_TROUBLESHOOTING.md)
- [🔐 **Dépannage Auth**](./troubleshooting/AUTH_TROUBLESHOOTING.md)

### Maintenance

- [🧹 **Nettoyage Redis**](./maintenance/REDIS_CLEANUP.md)
- [📊 **Monitoring**](./monitoring/MONITORING.md)
- [🔄 **Backup**](./maintenance/BACKUP.md)

## 📋 Historique des Changements

### Mises à jour Récentes

- [📝 **Changelog**](./changelog/CHANGELOG.md) - Historique des versions
- [🔄 **Migrations Summary**](./changelog/MIGRATION_SUMMARY.md) - Résumé des migrations
- [👥 **User Roles Update**](./changelog/USER_ROLES_UPDATE.md) - Mise à jour du système de rôles

## 🆘 Support et Contribution

### Support

- **Email** : support@oncc.cm
- **Documentation** : Cette documentation
- **Issues** : Système de tickets interne

### Contribution

- [📝 **Guide de contribution**](./contributing/CONTRIBUTING.md)
- [🎨 **Standards de code**](./contributing/CODE_STANDARDS.md)
- [📖 **Documentation**](./contributing/DOCUMENTATION.md)

## 🏷️ Versions

- **Version actuelle** : 1.0.0
- **AdonisJS** : v6
- **Node.js** : >= 18.x
- **PostgreSQL** : >= 14.x
- **Redis** : >= 6.x

---

_Cette documentation est maintenue par l'équipe de développement SIFC/ONCC._
