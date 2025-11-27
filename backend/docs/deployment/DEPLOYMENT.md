# Guide de Déploiement - SIFC

## Vue d'ensemble

Ce guide détaille les procédures de déploiement du système SIFC en environnement de production, incluant la configuration Docker, les variables d'environnement, et les bonnes pratiques de sécurité.

## Architecture de déploiement

### Composants principaux

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Load Balancer │    │     Frontend    │    │     Backend     │
│    (Nginx)      │────│   (React/Vue)   │────│   (AdonisJS)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                       │
                       ┌─────────────────┐    ┌─────────────────┐
                       │      Redis      │    │   PostgreSQL    │
                       │    (Sessions)   │    │   (Database)    │
                       └─────────────────┘    └─────────────────┘
```

### Services requis

1. **Application AdonisJS** : Backend API
2. **PostgreSQL** : Base de données principale
3. **Redis** : Cache et sessions
4. **Nginx** : Reverse proxy et load balancer
5. **Minio** (optionnel) : Stockage de fichiers

## Configuration Docker

### Docker Compose de production

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  # Application Backend
  sifc_backend:
    build:
      context: .
      dockerfile: Dockerfile.prod
    container_name: sifc_backend_prod
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - PORT=3333
      - HOST=0.0.0.0
    env_file:
      - .env.production
    depends_on:
      - postgres
      - redis
    networks:
      - sifc_network
    volumes:
      - ./uploads:/app/uploads
      - ./logs:/app/logs

  # Base de données PostgreSQL
  postgres:
    image: postgres:15-alpine
    container_name: sifc_postgres_prod
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${DB_DATABASE}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/init:/docker-entrypoint-initdb.d
    networks:
      - sifc_network
    ports:
      - '5432:5432'

  # Redis pour cache et sessions
  redis:
    image: redis:7-alpine
    container_name: sifc_redis_prod
    restart: unless-stopped
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    networks:
      - sifc_network
    ports:
      - '6379:6379'

  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    container_name: sifc_nginx_prod
    restart: unless-stopped
    ports:
      - '80:80'
      - '443:443'
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/sites-available:/etc/nginx/sites-available
      - ./ssl:/etc/nginx/ssl
      - ./logs/nginx:/var/log/nginx
    depends_on:
      - sifc_backend
    networks:
      - sifc_network

  # Minio pour stockage de fichiers (optionnel)
  minio:
    image: minio/minio:latest
    container_name: sifc_minio_prod
    restart: unless-stopped
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_ACCESS_KEY}
      MINIO_ROOT_PASSWORD: ${MINIO_SECRET_KEY}
    volumes:
      - minio_data:/data
    ports:
      - '9000:9000'
      - '9001:9001'
    networks:
      - sifc_network

volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local
  minio_data:
    driver: local

networks:
  sifc_network:
    driver: bridge
```

### Dockerfile de production

```dockerfile
# Dockerfile.prod
FROM node:18-alpine AS builder

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./
COPY tsconfig.json ./

# Installer les dépendances
RUN npm ci --only=production

# Copier le code source
COPY . .

# Build de l'application
RUN npm run build

# Image de production
FROM node:18-alpine AS production

WORKDIR /app

# Installer dumb-init pour la gestion des signaux
RUN apk add --no-cache dumb-init

# Créer un utilisateur non-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S adonisjs -u 1001

# Copier les fichiers buildés
COPY --from=builder --chown=adonisjs:nodejs /app/build ./build
COPY --from=builder --chown=adonisjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=adonisjs:nodejs /app/package*.json ./

# Créer les dossiers nécessaires
RUN mkdir -p uploads logs && chown -R adonisjs:nodejs uploads logs

# Changer vers l'utilisateur non-root
USER adonisjs

# Exposer le port
EXPOSE 3333

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node ace healthcheck || exit 1

# Commande de démarrage
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "build/bin/server.js"]
```

## Configuration Nginx

### Configuration principale

```nginx
# nginx/nginx.conf
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    # Performance
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=1r/s;

    # Include site configurations
    include /etc/nginx/sites-available/*;
}
```

### Configuration du site SIFC

```nginx
# nginx/sites-available/sifc.conf
upstream sifc_backend {
    server sifc_backend:3333;
    keepalive 32;
}

# Redirection HTTP vers HTTPS
server {
    listen 80;
    server_name sifc.oncc.cm www.sifc.oncc.cm;
    return 301 https://$server_name$request_uri;
}

# Configuration HTTPS
server {
    listen 443 ssl http2;
    server_name sifc.oncc.cm www.sifc.oncc.cm;

    # SSL Configuration
    ssl_certificate /etc/nginx/ssl/sifc.oncc.cm.crt;
    ssl_certificate_key /etc/nginx/ssl/sifc.oncc.cm.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Client max body size (pour les uploads)
    client_max_body_size 50M;

    # API Backend
    location /api/ {
        # Rate limiting pour l'API
        limit_req zone=api burst=20 nodelay;

        proxy_pass http://sifc_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Rate limiting spécial pour le login
    location /api/v1/login {
        limit_req zone=login burst=5 nodelay;

        proxy_pass http://sifc_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Fichiers statiques (si servis par Nginx)
    location /uploads/ {
        alias /app/uploads/;
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Frontend (si servi par Nginx)
    location / {
        root /var/www/sifc-frontend;
        index index.html;
        try_files $uri $uri/ /index.html;

        # Cache pour les assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
            access_log off;
        }
    }

    # Health check
    location /health {
        proxy_pass http://sifc_backend/health;
        access_log off;
    }
}
```

## Variables d'environnement de production

### Fichier .env.production

```env
# Application
NODE_ENV=production
PORT=3333
HOST=0.0.0.0
APP_KEY=your_32_character_app_key_here

# Base de données
DB_HOST=postgres
DB_PORT=5432
DB_USER=sifc_user
DB_PASSWORD=your_secure_db_password
DB_DATABASE=sifc_production

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=your_secure_redis_password
REDIS_DB=0

# Email (SendGrid)
SENDGRID_API_KEY=SG.your_production_sendgrid_key
SENDGRID_FROM_EMAIL=noreply@oncc.cm
SENDGRID_FROM_NAME=SIFC - ONCC

# Minio (optionnel)
MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_ACCESS_KEY=your_minio_access_key
MINIO_SECRET_KEY=your_minio_secret_key
MINIO_BUCKET=sifc-documents

# Logging
LOG_LEVEL=info
LOG_PRETTY_PRINT=false

# Security
SESSION_DRIVER=redis
HASH_DRIVER=scrypt

# CORS
CORS_ENABLED=true
CORS_ORIGIN=https://sifc.oncc.cm,https://www.sifc.oncc.cm
CORS_METHODS=GET,HEAD,PUT,PATCH,POST,DELETE
CORS_HEADERS=Content-Type,Authorization

# Rate limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000
```

## Procédures de déploiement

### 1. Déploiement initial

```bash
#!/bin/bash
# scripts/deploy-initial.sh

set -e

echo "🚀 Déploiement initial SIFC..."

# 1. Cloner le repository
git clone https://github.com/oncc/sifc-backend.git /opt/sifc
cd /opt/sifc

# 2. Copier les fichiers de configuration
cp .env.production.example .env.production
echo "⚠️  Veuillez configurer les variables d'environnement dans .env.production"
read -p "Appuyez sur Entrée quand c'est fait..."

# 3. Créer les dossiers nécessaires
mkdir -p uploads logs ssl

# 4. Générer les certificats SSL (Let's Encrypt)
./scripts/setup-ssl.sh

# 5. Build et démarrage des services
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# 6. Attendre que les services soient prêts
echo "⏳ Attente du démarrage des services..."
sleep 30

# 7. Exécuter les migrations
docker-compose -f docker-compose.prod.yml exec sifc_backend node ace migration:run --force

# 8. Exécuter les seeders
docker-compose -f docker-compose.prod.yml exec sifc_backend node ace db:seed --force

# 9. Vérifier le déploiement
./scripts/health-check.sh

echo "✅ Déploiement initial terminé!"
```

### 2. Déploiement de mise à jour

```bash
#!/bin/bash
# scripts/deploy-update.sh

set -e

echo "🔄 Mise à jour SIFC..."

cd /opt/sifc

# 1. Backup de la base de données
./scripts/backup-db.sh

# 2. Pull des dernières modifications
git pull origin main

# 3. Build de la nouvelle image
docker-compose -f docker-compose.prod.yml build sifc_backend

# 4. Arrêt gracieux de l'application
docker-compose -f docker-compose.prod.yml stop sifc_backend

# 5. Exécution des migrations
docker-compose -f docker-compose.prod.yml run --rm sifc_backend node ace migration:run --force

# 6. Redémarrage de l'application
docker-compose -f docker-compose.prod.yml up -d sifc_backend

# 7. Vérification de la santé
./scripts/health-check.sh

# 8. Nettoyage des anciennes images
docker image prune -f

echo "✅ Mise à jour terminée!"
```

### 3. Script de health check

```bash
#!/bin/bash
# scripts/health-check.sh

set -e

echo "🔍 Vérification de la santé du système..."

# Vérifier que les services sont en cours d'exécution
services=("sifc_backend_prod" "sifc_postgres_prod" "sifc_redis_prod" "sifc_nginx_prod")

for service in "${services[@]}"; do
    if docker ps | grep -q $service; then
        echo "✅ $service est en cours d'exécution"
    else
        echo "❌ $service n'est pas en cours d'exécution"
        exit 1
    fi
done

# Vérifier la connectivité de la base de données
if docker-compose -f docker-compose.prod.yml exec -T postgres pg_isready -U sifc_user; then
    echo "✅ PostgreSQL est accessible"
else
    echo "❌ PostgreSQL n'est pas accessible"
    exit 1
fi

# Vérifier Redis
if docker-compose -f docker-compose.prod.yml exec -T redis redis-cli ping | grep -q PONG; then
    echo "✅ Redis est accessible"
else
    echo "❌ Redis n'est pas accessible"
    exit 1
fi

# Vérifier l'API
if curl -f -s https://sifc.oncc.cm/health > /dev/null; then
    echo "✅ API est accessible"
else
    echo "❌ API n'est pas accessible"
    exit 1
fi

echo "✅ Tous les services sont opérationnels!"
```

## Monitoring et logs

### Configuration de logging

```typescript
// config/logger.ts (production)
import { defineConfig } from '@adonisjs/logger'

export default defineConfig({
  default: 'app',
  loggers: {
    app: {
      enabled: true,
      name: 'sifc-backend',
      level: env.get('LOG_LEVEL', 'info'),
      transport: {
        targets: [
          {
            target: 'pino/file',
            options: {
              destination: './logs/app.log',
            },
            level: 'info',
          },
          {
            target: 'pino/file',
            options: {
              destination: './logs/error.log',
            },
            level: 'error',
          },
        ],
      },
    },
  },
})
```

### Script de monitoring

```bash
#!/bin/bash
# scripts/monitor.sh

# Monitoring des ressources
echo "=== Utilisation des ressources ==="
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}"

echo -e "\n=== Logs récents ==="
docker-compose -f docker-compose.prod.yml logs --tail=50 sifc_backend

echo -e "\n=== Espace disque ==="
df -h

echo -e "\n=== Connexions actives ==="
docker-compose -f docker-compose.prod.yml exec postgres psql -U sifc_user -d sifc_production -c "SELECT count(*) as active_connections FROM pg_stat_activity WHERE state = 'active';"
```

## Backup et restauration

### Script de backup

```bash
#!/bin/bash
# scripts/backup-db.sh

set -e

BACKUP_DIR="/opt/sifc/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="sifc_backup_$DATE.sql"

mkdir -p $BACKUP_DIR

echo "📦 Création du backup de la base de données..."

# Backup de la base de données
docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump -U sifc_user sifc_production > $BACKUP_DIR/$BACKUP_FILE

# Compression
gzip $BACKUP_DIR/$BACKUP_FILE

# Nettoyage des anciens backups (garder 30 jours)
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "✅ Backup créé: $BACKUP_DIR/$BACKUP_FILE.gz"
```

### Script de restauration

```bash
#!/bin/bash
# scripts/restore-db.sh

set -e

if [ -z "$1" ]; then
    echo "Usage: $0 <backup_file.sql.gz>"
    exit 1
fi

BACKUP_FILE=$1

echo "⚠️  ATTENTION: Cette opération va remplacer la base de données actuelle!"
read -p "Êtes-vous sûr? (y/N): " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Opération annulée."
    exit 1
fi

echo "🔄 Restauration de la base de données..."

# Arrêter l'application
docker-compose -f docker-compose.prod.yml stop sifc_backend

# Restaurer la base de données
gunzip -c $BACKUP_FILE | docker-compose -f docker-compose.prod.yml exec -T postgres psql -U sifc_user -d sifc_production

# Redémarrer l'application
docker-compose -f docker-compose.prod.yml start sifc_backend

echo "✅ Restauration terminée!"
```

## Sécurité

### Configuration SSL avec Let's Encrypt

```bash
#!/bin/bash
# scripts/setup-ssl.sh

set -e

DOMAIN="sifc.oncc.cm"
EMAIL="admin@oncc.cm"

echo "🔒 Configuration SSL pour $DOMAIN..."

# Installer Certbot
apt-get update
apt-get install -y certbot

# Obtenir le certificat
certbot certonly --standalone \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    -d $DOMAIN \
    -d www.$DOMAIN

# Copier les certificats
cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem /opt/sifc/ssl/$DOMAIN.crt
cp /etc/letsencrypt/live/$DOMAIN/privkey.pem /opt/sifc/ssl/$DOMAIN.key

# Configuration du renouvellement automatique
echo "0 12 * * * /usr/bin/certbot renew --quiet && /opt/sifc/scripts/reload-nginx.sh" | crontab -

echo "✅ SSL configuré pour $DOMAIN"
```

### Hardening du serveur

```bash
#!/bin/bash
# scripts/server-hardening.sh

set -e

echo "🔐 Hardening du serveur..."

# Mise à jour du système
apt-get update && apt-get upgrade -y

# Configuration du firewall
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# Désactiver l'accès root SSH
sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
systemctl restart ssh

# Configuration de fail2ban
apt-get install -y fail2ban
cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local

# Limites système
echo "* soft nofile 65536" >> /etc/security/limits.conf
echo "* hard nofile 65536" >> /etc/security/limits.conf

echo "✅ Hardening terminé"
```

## Maintenance

### Tâches de maintenance automatisées

```bash
#!/bin/bash
# scripts/maintenance.sh

set -e

echo "🔧 Maintenance automatique..."

# Nettoyage des logs anciens
find /opt/sifc/logs -name "*.log" -mtime +7 -delete

# Nettoyage des images Docker inutilisées
docker image prune -f

# Nettoyage des volumes Docker orphelins
docker volume prune -f

# Optimisation de la base de données
docker-compose -f docker-compose.prod.yml exec postgres psql -U sifc_user -d sifc_production -c "VACUUM ANALYZE;"

# Nettoyage des sessions Redis expirées
docker-compose -f docker-compose.prod.yml exec redis redis-cli FLUSHDB

echo "✅ Maintenance terminée"
```

### Crontab de maintenance

```bash
# Ajouter au crontab du serveur
# crontab -e

# Backup quotidien à 2h du matin
0 2 * * * /opt/sifc/scripts/backup-db.sh

# Maintenance hebdomadaire le dimanche à 3h
0 3 * * 0 /opt/sifc/scripts/maintenance.sh

# Monitoring toutes les 5 minutes
*/5 * * * * /opt/sifc/scripts/health-check.sh > /dev/null 2>&1 || /opt/sifc/scripts/alert.sh

# Renouvellement SSL mensuel
0 0 1 * * /opt/sifc/scripts/renew-ssl.sh
```

---

_Documentation mise à jour le : 2024-01-15_
