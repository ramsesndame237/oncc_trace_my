# 🚀 Guide de Déploiement - ONCC-V1

Guide complet pour déployer l'application ONCC-V1 en utilisant GitHub Actions et Dokploy.

---

## 📋 Table des Matières

1. [Architecture CI/CD](#architecture-cicd)
2. [Configuration GitHub](#configuration-github)
3. [Déploiement sur Dokploy](#déploiement-sur-dokploy)
4. [Variables d'Environnement](#variables-denvironnement)
5. [Commandes Utiles](#commandes-utiles)
6. [Troubleshooting](#troubleshooting)

---

## 🏗️ Architecture CI/CD

Le workflow GitHub Actions (`ci-cd.yml`) effectue automatiquement :

### 1. **Tests Backend**
- Linting (ESLint)
- Type checking (TypeScript)
- Tests unitaires/intégration
- Base de données PostgreSQL (service)
- Redis (service)

### 2. **Tests Frontend**
- Génération des types TypeScript
- Linting (ESLint)
- Build Next.js

### 3. **Build & Push Docker Images**
- Build multi-architecture (amd64, arm64)
- Push vers GitHub Container Registry (GHCR)
- Cache optimisé pour builds rapides
- Tagging automatique (latest, version, branch, SHA)

### 4. **Déploiement**
- Images disponibles sur GHCR
- Récupération facile sur Dokploy

---

## ⚙️ Configuration GitHub

### 1. Activer GitHub Packages

Les images sont automatiquement publiées sur **GitHub Container Registry (GHCR)**.

**Permissions requises** :
- Le workflow utilise `GITHUB_TOKEN` (fourni automatiquement)
- Aucune configuration supplémentaire requise pour GHCR

### 2. Configurer les GitHub Secrets

Allez dans **Settings > Secrets and variables > Actions** de votre repository GitHub.

#### **Secrets pour le Frontend**

| Secret | Description | Exemple |
|--------|-------------|---------|
| `NEXT_PUBLIC_APP_NAME` | Nom de l'application | `ONCC-V1` |
| `NEXT_PUBLIC_APP_DESCRIPTION` | Description | `Gestion des chaînes d'approvisionnement` |
| `NEXT_PUBLIC_API_URL` | URL de l'API backend | `https://api.votre-domaine.com` |
| `NEXT_PUBLIC_API_VERSION` | Version de l'API | `v1` |
| `NEXT_PUBLIC_INDEXEDDB_NAME` | Nom de la base IndexedDB | `oncc_db` |
| `NEXTAUTH_URL` | URL de l'application | `https://votre-domaine.com` |
| `NEXTAUTH_SECRET` | Secret pour NextAuth | `générez avec: openssl rand -base64 32` |

#### **Générer NEXTAUTH_SECRET**

```bash
openssl rand -base64 32
```

### 3. Visibilité des Images

Par défaut, les images sont **privées**. Pour les rendre publiques :

1. Allez sur **Packages** de votre repository GitHub
2. Cliquez sur l'image (backend ou frontend)
3. **Package settings** > **Change visibility** > **Public**

---

## 🐳 Déploiement sur Dokploy

### 1. Connexion au Registry GHCR

Sur votre serveur Dokploy, connectez-vous au GitHub Container Registry :

```bash
# Créer un Personal Access Token (PAT) GitHub
# Settings > Developer settings > Personal access tokens > Tokens (classic)
# Permissions: read:packages

# Se connecter au registry
docker login ghcr.io -u VOTRE_USERNAME_GITHUB
# Password: Votre PAT
```

### 2. Récupérer les Images

```bash
# Backend
docker pull ghcr.io/VOTRE_ORG/VOTRE_REPO/backend:latest

# Frontend
docker pull ghcr.io/VOTRE_ORG/VOTRE_REPO/frontend:latest
```

**Exemple** : Si votre repo est `github.com/stdigital/oncc-v1` :

```bash
docker pull ghcr.io/stdigital/oncc-v1/backend:latest
docker pull ghcr.io/stdigital/oncc-v1/frontend:latest
```

### 3. Configuration Dokploy

#### **Option A : Utiliser Docker Compose**

Créez un fichier `docker-compose.prod.yml` sur votre serveur :

```yaml
version: '3.8'

services:
  # Base de données PostgreSQL
  postgres:
    image: postgres:15-alpine
    container_name: oncc_postgres
    environment:
      POSTGRES_DB: ${DB_DATABASE}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    networks:
      - oncc_network
    restart: unless-stopped

  # Redis Cache
  redis:
    image: redis:7-alpine
    container_name: oncc_redis
    ports:
      - "6379:6379"
    networks:
      - oncc_network
    restart: unless-stopped

  # MinIO Object Storage
  minio:
    image: minio/minio:latest
    container_name: oncc_minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD}
    volumes:
      - minio_data:/data
    ports:
      - "9000:9000"
      - "9001:9001"
    networks:
      - oncc_network
    restart: unless-stopped

  # Backend API
  backend:
    image: ghcr.io/VOTRE_ORG/VOTRE_REPO/backend:latest
    container_name: oncc_backend
    environment:
      NODE_ENV: production
      PORT: 3333
      DB_HOST: postgres
      DB_PORT: 5432
      DB_USER: ${DB_USER}
      DB_PASSWORD: ${DB_PASSWORD}
      DB_DATABASE: ${DB_DATABASE}
      REDIS_HOST: redis
      REDIS_PORT: 6379
      MINIO_ENDPOINT: minio
      MINIO_PORT: 9000
      MINIO_USE_SSL: "false"
      MINIO_ACCESS_KEY: ${MINIO_ROOT_USER}
      MINIO_SECRET_KEY: ${MINIO_ROOT_PASSWORD}
      MINIO_BUCKET: ${MINIO_BUCKET}
      APP_KEY: ${APP_KEY}
      SESSION_DRIVER: redis
    ports:
      - "3333:3333"
    depends_on:
      - postgres
      - redis
      - minio
    networks:
      - oncc_network
    restart: unless-stopped

  # Frontend Next.js
  frontend:
    image: ghcr.io/VOTRE_ORG/VOTRE_REPO/frontend:latest
    container_name: oncc_frontend
    environment:
      NODE_ENV: production
      PORT: 3000
      NEXT_PUBLIC_APP_NAME: ${NEXT_PUBLIC_APP_NAME}
      NEXT_PUBLIC_APP_DESCRIPTION: ${NEXT_PUBLIC_APP_DESCRIPTION}
      NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL}
      NEXT_PUBLIC_API_VERSION: v1
      NEXT_PUBLIC_INDEXEDDB_NAME: oncc_db
      NEXTAUTH_URL: ${NEXTAUTH_URL}
      NEXTAUTH_SECRET: ${NEXTAUTH_SECRET}
    ports:
      - "3000:3000"
    depends_on:
      - backend
    networks:
      - oncc_network
    restart: unless-stopped

volumes:
  postgres_data:
  minio_data:

networks:
  oncc_network:
    driver: bridge
```

**Démarrer les services** :

```bash
docker-compose -f docker-compose.prod.yml up -d
```

#### **Option B : Configuration Dokploy UI**

1. **Créer un nouveau projet** dans Dokploy
2. **Ajouter un service** pour chaque composant :
   - **Backend** : Image `ghcr.io/VOTRE_ORG/VOTRE_REPO/backend:latest`
   - **Frontend** : Image `ghcr.io/VOTRE_ORG/VOTRE_REPO/frontend:latest`
3. **Configurer les variables d'environnement** (voir section suivante)
4. **Configurer les volumes** :
   - PostgreSQL : `/var/lib/postgresql/data`
   - MinIO : `/data`
5. **Configurer le réseau** pour permettre la communication entre services

### 4. Initialiser la Base de Données

```bash
# Se connecter au container backend
docker exec -it oncc_backend sh

# Lancer les migrations
node ace migration:run

# Seeder les données initiales
node ace db:seed

# Sortir du container
exit
```

---

## 🔐 Variables d'Environnement

### Backend (`.env`)

```bash
# Application
NODE_ENV=production
PORT=3333
HOST=0.0.0.0
LOG_LEVEL=info
APP_KEY=GENERER_AVEC_node_ace_generate:key

# Database PostgreSQL
DB_HOST=postgres
DB_PORT=5432
DB_USER=oncc_user
DB_PASSWORD=VOTRE_MOT_DE_PASSE_SECURISE
DB_DATABASE=oncc_production

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=
SESSION_DRIVER=redis

# MinIO Object Storage
MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minio_admin
MINIO_SECRET_KEY=VOTRE_MOT_DE_PASSE_MINIO_SECURISE
MINIO_BUCKET=oncc-uploads

# Email (SMTP)
SMTP_HOST=smtp.votre-provider.com
SMTP_PORT=587
SMTP_USERNAME=votre-email@domaine.com
SMTP_PASSWORD=VOTRE_MOT_DE_PASSE_EMAIL
MAIL_FROM_ADDRESS=noreply@votre-domaine.com
MAIL_FROM_NAME=ONCC

# Security
ALLOWED_ORIGINS=https://votre-domaine.com,https://www.votre-domaine.com
```

### Frontend (`.env.production`)

```bash
# Application
NODE_ENV=production
PORT=3000

# API
NEXT_PUBLIC_APP_NAME=ONCC-V1
NEXT_PUBLIC_APP_DESCRIPTION=Gestion des chaînes d'approvisionnement du cacao et du café
NEXT_PUBLIC_API_URL=https://api.votre-domaine.com
NEXT_PUBLIC_API_VERSION=v1
NEXT_PUBLIC_INDEXEDDB_NAME=oncc_db

# NextAuth
NEXTAUTH_URL=https://votre-domaine.com
NEXTAUTH_SECRET=GENERER_AVEC_openssl_rand_-base64_32
```

---

## 🛠️ Commandes Utiles

### Logs

```bash
# Voir les logs du backend
docker logs -f oncc_backend

# Voir les logs du frontend
docker logs -f oncc_frontend

# Voir les logs de tous les services
docker-compose -f docker-compose.prod.yml logs -f
```

### Redémarrage

```bash
# Redémarrer un service spécifique
docker restart oncc_backend
docker restart oncc_frontend

# Redémarrer tous les services
docker-compose -f docker-compose.prod.yml restart
```

### Mise à jour des Images

```bash
# Pull les nouvelles versions
docker pull ghcr.io/VOTRE_ORG/VOTRE_REPO/backend:latest
docker pull ghcr.io/VOTRE_ORG/VOTRE_REPO/frontend:latest

# Recréer les containers avec les nouvelles images
docker-compose -f docker-compose.prod.yml up -d --force-recreate
```

### Backup Base de Données

```bash
# Créer un backup
docker exec oncc_postgres pg_dump -U oncc_user oncc_production > backup_$(date +%Y%m%d_%H%M%S).sql

# Restaurer un backup
cat backup_20250127_120000.sql | docker exec -i oncc_postgres psql -U oncc_user oncc_production
```

---

## 🔧 Troubleshooting

### 1. **Erreur 401 lors du pull d'image**

```bash
# Vérifier que vous êtes connecté
docker login ghcr.io

# Vérifier les permissions de votre PAT
# Il doit avoir la permission "read:packages"
```

### 2. **Frontend ne se connecte pas au Backend**

- Vérifier que `NEXT_PUBLIC_API_URL` pointe vers l'URL publique du backend
- Vérifier que les containers sont sur le même réseau Docker
- Vérifier les CORS dans le backend (`config/cors.ts`)

### 3. **Migrations échouent**

```bash
# Se connecter au backend
docker exec -it oncc_backend sh

# Vérifier la connexion à PostgreSQL
node ace db:ping

# Rollback et relancer
node ace migration:rollback
node ace migration:run
```

### 4. **MinIO ne stocke pas les fichiers**

```bash
# Vérifier que le bucket existe
docker exec -it oncc_backend sh
# Créer le bucket manuellement si nécessaire
```

### 5. **Images ne se mettent pas à jour**

```bash
# Forcer le pull sans cache
docker-compose -f docker-compose.prod.yml pull --no-cache

# Recréer complètement les containers
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --force-recreate
```

---

## 🔄 Workflow de Déploiement Complet

### 1. **Développement**

```bash
# Travailler sur une branche feature
git checkout -b feature/nouvelle-fonctionnalite

# Commiter les changements
git add .
git commit -m "feat: nouvelle fonctionnalité"
git push origin feature/nouvelle-fonctionnalite
```

### 2. **Tests Automatiques**

- Le workflow GitHub Actions se lance automatiquement
- Tests backend et frontend
- Si succès → Build des images Docker

### 3. **Merge vers Master**

```bash
# Créer une Pull Request sur GitHub
# Après review et merge
git checkout master
git pull origin master
```

### 4. **Déploiement Automatique**

- Le workflow se relance sur master
- Build et push des images vers GHCR avec tag `latest`

### 5. **Mise à jour sur Dokploy**

```bash
# Se connecter au serveur
ssh user@votre-serveur.com

# Pull les nouvelles images
docker pull ghcr.io/VOTRE_ORG/VOTRE_REPO/backend:latest
docker pull ghcr.io/VOTRE_ORG/VOTRE_REPO/frontend:latest

# Recréer les containers
docker-compose -f docker-compose.prod.yml up -d --force-recreate

# Vérifier les logs
docker-compose -f docker-compose.prod.yml logs -f
```

---

## 📝 Checklist de Déploiement Initial

- [ ] Créer les GitHub Secrets pour le frontend
- [ ] Configurer la visibilité des images GHCR (public/private)
- [ ] Créer un Personal Access Token GitHub avec `read:packages`
- [ ] Se connecter à GHCR sur le serveur Dokploy
- [ ] Créer le fichier `docker-compose.prod.yml`
- [ ] Créer le fichier `.env` avec toutes les variables
- [ ] Générer `APP_KEY` pour le backend
- [ ] Générer `NEXTAUTH_SECRET` pour le frontend
- [ ] Configurer les mots de passe sécurisés (DB, MinIO, etc.)
- [ ] Pull des images depuis GHCR
- [ ] Démarrer les services avec Docker Compose
- [ ] Lancer les migrations de base de données
- [ ] Seeder les données initiales
- [ ] Vérifier les logs de tous les services
- [ ] Tester l'accès à l'application
- [ ] Configurer le reverse proxy (Nginx/Traefik) si nécessaire
- [ ] Configurer les certificats SSL (Let's Encrypt)

---

## 🌐 Configuration Reverse Proxy (Nginx)

Exemple de configuration Nginx pour exposer l'application :

```nginx
# /etc/nginx/sites-available/oncc

server {
    listen 80;
    server_name votre-domaine.com www.votre-domaine.com;

    # Redirection HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name votre-domaine.com www.votre-domaine.com;

    # Certificats SSL
    ssl_certificate /etc/letsencrypt/live/votre-domaine.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/votre-domaine.com/privkey.pem;

    # Frontend Next.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3333;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Activer le site :

```bash
sudo ln -s /etc/nginx/sites-available/oncc /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 📊 Monitoring

### Health Checks

Les deux services ont des endpoints de health check :

- **Backend** : `http://localhost:3333/api/v1/health`
- **Frontend** : `http://localhost:3000/api/health`

### Surveillance des Containers

```bash
# Statut des containers
docker ps

# Stats en temps réel
docker stats

# Health check manuel
docker inspect --format='{{json .State.Health}}' oncc_backend
docker inspect --format='{{json .State.Health}}' oncc_frontend
```

---

**Pour toute question ou problème, consulter les logs et la documentation technique du projet.**
