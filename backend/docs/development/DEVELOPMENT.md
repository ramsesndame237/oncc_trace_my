# Guide de Développement - SIFC

## Vue d'ensemble

Ce guide détaille l'environnement de développement pour le système SIFC, incluant la configuration locale, les outils de développement, et les bonnes pratiques.

## Prérequis

### Logiciels requis

- **Node.js** : Version 18.x ou supérieure
- **npm** : Version 9.x ou supérieure
- **Docker** : Version 20.x ou supérieure
- **Docker Compose** : Version 2.x ou supérieure
- **Git** : Version 2.x ou supérieure

### Outils recommandés

- **VS Code** : Éditeur de code recommandé
- **Postman** ou **Insomnia** : Test des APIs
- **DBeaver** ou **pgAdmin** : Administration PostgreSQL
- **Redis Desktop Manager** : Administration Redis

## Configuration de l'environnement

### 1. Clonage du projet

```bash
# Cloner le repository
git clone https://github.com/oncc/sifc-backend.git
cd sifc-backend

# Installer les dépendances
npm install
```

### 2. Configuration des variables d'environnement

```bash
# Copier le fichier d'exemple
cp .env.example .env

# Éditer les variables d'environnement
nano .env
```

#### Variables d'environnement de développement

```env
# Application
NODE_ENV=development
PORT=3333
HOST=localhost
APP_KEY=your_32_character_app_key_here

# Base de données
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_DATABASE=sifc_dev

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Email (développement)
SENDGRID_API_KEY=SG.your_dev_sendgrid_key
SENDGRID_FROM_EMAIL=dev@oncc.cm
SENDGRID_FROM_NAME=SIFC Dev

# Logging
LOG_LEVEL=debug
LOG_PRETTY_PRINT=true

# CORS (développement)
CORS_ENABLED=true
CORS_ORIGIN=http://localhost:3000,http://localhost:5173
CORS_METHODS=GET,HEAD,PUT,PATCH,POST,DELETE
CORS_HEADERS=Content-Type,Authorization
```

### 3. Démarrage avec Docker

```bash
# Démarrer les services de développement
docker-compose -f docker-compose.dev.yml up -d

# Vérifier que les services sont démarrés
docker-compose -f docker-compose.dev.yml ps
```

### 4. Configuration de la base de données

```bash
# Exécuter les migrations
npm run migration:run

# Exécuter les seeders
npm run db:seed

# Vérifier la base de données
npm run db:check
```

## Structure du projet

```
backend/
├── app/                        # Code source principal
│   ├── controllers/           # Contrôleurs HTTP
│   ├── middleware/            # Middlewares
│   ├── models/               # Modèles Lucid
│   ├── services/             # Services métier
│   ├── validators/           # Validateurs de données
│   └── exceptions/           # Exceptions personnalisées
├── config/                    # Configuration
│   ├── app.ts               # Configuration application
│   ├── database.ts          # Configuration base de données
│   ├── mail.ts              # Configuration email
│   └── redis.ts             # Configuration Redis
├── database/                  # Base de données
│   ├── migrations/          # Migrations
│   └── seeders/             # Seeders
├── docs/                     # Documentation
├── resources/                # Ressources
│   └── views/               # Templates email
├── start/                    # Démarrage
│   ├── routes.ts            # Routes
│   └── kernel.ts            # Kernel HTTP
├── tests/                    # Tests
└── uploads/                  # Fichiers uploadés
```

## Commandes de développement

### Scripts npm principaux

```json
{
  "scripts": {
    "dev": "node ace serve --watch",
    "build": "node ace build",
    "start": "node build/bin/server.js",
    "test": "node ace test",
    "migration:run": "node ace migration:run",
    "migration:rollback": "node ace migration:rollback",
    "db:seed": "node ace db:seed",
    "db:check": "node ace db:check",
    "lint": "eslint . --ext=.ts",
    "lint:fix": "eslint . --ext=.ts --fix",
    "format": "prettier --write .",
    "type-check": "tsc --noEmit"
  }
}
```

### Commandes AdonisJS utiles

```bash
# Démarrer le serveur de développement
npm run dev

# Créer un contrôleur
node ace make:controller UserController

# Créer un modèle
node ace make:model User

# Créer une migration
node ace make:migration create_users_table

# Créer un seeder
node ace make:seeder UserSeeder

# Créer un middleware
node ace make:middleware AuthMiddleware

# Créer un validator
node ace make:validator CreateUserValidator

# Créer un service
node ace make:service EmailService

# Lancer la console interactive
node ace tinker

# Vérifier les routes
node ace list:routes
```

## Configuration des outils de développement

### VS Code

#### Extensions recommandées

```json
// .vscode/extensions.json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-json",
    "redhat.vscode-yaml",
    "ms-vscode-remote.remote-containers",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense"
  ]
}
```

#### Configuration workspace

```json
// .vscode/settings.json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "files.exclude": {
    "**/node_modules": true,
    "**/build": true,
    "**/.git": true
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/build": true
  }
}
```

#### Snippets personnalisés

```json
// .vscode/snippets.json
{
  "AdonisJS Controller": {
    "prefix": "adonis-controller",
    "body": [
      "import type { HttpContext } from '@adonisjs/core/http'",
      "",
      "export default class ${1:Name}Controller {",
      "  async index({ response }: HttpContext) {",
      "    return response.ok({ message: 'Hello from ${1:Name}Controller' })",
      "  }",
      "}"
    ],
    "description": "Créer un contrôleur AdonisJS"
  },
  "AdonisJS Model": {
    "prefix": "adonis-model",
    "body": [
      "import { DateTime } from 'luxon'",
      "import { BaseModel, column } from '@adonisjs/lucid/orm'",
      "",
      "export default class ${1:Name} extends BaseModel {",
      "  @column({ isPrimary: true })",
      "  declare id: number",
      "",
      "  @column.dateTime({ autoCreate: true })",
      "  declare createdAt: DateTime",
      "",
      "  @column.dateTime({ autoCreate: true, autoUpdate: true })",
      "  declare updatedAt: DateTime",
      "}"
    ],
    "description": "Créer un modèle AdonisJS"
  }
}
```

### ESLint Configuration

```javascript
// eslint.config.js
import { defineConfig } from '@adonisjs/eslint-config'

export default defineConfig({
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'prefer-const': 'error',
    'no-var': 'error',
    'object-shorthand': 'error',
    'prefer-template': 'error',
  },
})
```

### Prettier Configuration

```json
// .prettierrc
{
  "semi": false,
  "singleQuote": true,
  "useTabs": false,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "bracketSpacing": true,
  "arrowParens": "always"
}
```

## Base de données de développement

### Configuration Docker Compose

```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  postgres_dev:
    image: postgres:15-alpine
    container_name: sifc_postgres_dev
    restart: unless-stopped
    environment:
      POSTGRES_DB: sifc_dev
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - '5432:5432'
    volumes:
      - postgres_dev_data:/var/lib/postgresql/data
      - ./database/init:/docker-entrypoint-initdb.d

  redis_dev:
    image: redis:7-alpine
    container_name: sifc_redis_dev
    restart: unless-stopped
    ports:
      - '6379:6379'
    volumes:
      - redis_dev_data:/data

  mailhog:
    image: mailhog/mailhog:latest
    container_name: sifc_mailhog_dev
    restart: unless-stopped
    ports:
      - '1025:1025' # SMTP
      - '8025:8025' # Web UI

volumes:
  postgres_dev_data:
  redis_dev_data:
```

### Scripts de base de données

```bash
#!/bin/bash
# scripts/reset-db.sh

echo "🔄 Réinitialisation de la base de données de développement..."

# Arrêter l'application
docker-compose -f docker-compose.dev.yml stop

# Supprimer les volumes
docker-compose -f docker-compose.dev.yml down -v

# Redémarrer les services
docker-compose -f docker-compose.dev.yml up -d

# Attendre que PostgreSQL soit prêt
sleep 10

# Exécuter les migrations
npm run migration:run

# Exécuter les seeders
npm run db:seed

echo "✅ Base de données réinitialisée!"
```

## Tests en développement

### Configuration Jest

```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.spec.ts', '**/*.test.ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: ['app/**/*.ts', '!app/**/*.d.ts', '!app/**/index.ts'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
}
```

### Commandes de test

```bash
# Lancer tous les tests
npm test

# Tests en mode watch
npm run test:watch

# Tests avec couverture
npm run test:coverage

# Tests d'un fichier spécifique
npm test -- tests/unit/models/user.spec.ts

# Tests avec pattern
npm test -- --testNamePattern="should create user"
```

## Debugging

### Configuration VS Code Debugger

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug AdonisJS",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/ace",
      "args": ["serve", "--watch"],
      "env": {
        "NODE_ENV": "development"
      },
      "console": "integratedTerminal",
      "restart": true,
      "runtimeArgs": ["--inspect"]
    },
    {
      "name": "Debug Tests",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": ["--runInBand"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

### Logging en développement

```typescript
// app/services/logger_service.ts
import logger from '@adonisjs/core/services/logger'

export class LoggerService {
  static debug(message: string, data?: any) {
    logger.debug(message, data)
  }

  static info(message: string, data?: any) {
    logger.info(message, data)
  }

  static warn(message: string, data?: any) {
    logger.warn(message, data)
  }

  static error(message: string, error?: Error | any) {
    logger.error(message, error)
  }

  static logRequest(ctx: HttpContext) {
    logger.info(`${ctx.request.method()} ${ctx.request.url()}`, {
      ip: ctx.request.ip(),
      userAgent: ctx.request.header('user-agent'),
      userId: ctx.auth.user?.id,
    })
  }
}
```

## API Testing

### Configuration Postman

```json
// postman/environment.json
{
  "name": "SIFC Development",
  "values": [
    {
      "key": "base_url",
      "value": "http://localhost:3333",
      "enabled": true
    },
    {
      "key": "api_url",
      "value": "{{base_url}}/api/v1",
      "enabled": true
    },
    {
      "key": "auth_token",
      "value": "",
      "enabled": true
    }
  ]
}
```

### Scripts de test API

```bash
#!/bin/bash
# scripts/test-api.sh

BASE_URL="http://localhost:3333/api/v1"

echo "🧪 Test de l'API SIFC..."

# Test de santé
echo "1. Test de santé..."
curl -s "$BASE_URL/health" | jq .

# Test de login
echo "2. Test de login..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/login" \
  -H "Content-Type: application/json" \
  -d '{"pseudo":"admin","password":"Admin123!"}')

echo $LOGIN_RESPONSE | jq .

# Extraire le sessionKey
SESSION_KEY=$(echo $LOGIN_RESPONSE | jq -r '.sessionKey')

if [ "$SESSION_KEY" != "null" ]; then
  echo "3. Test de vérification OTP..."
  OTP_RESPONSE=$(curl -s -X POST "$BASE_URL/verify-otp" \
    -H "Content-Type: application/json" \
    -d "{\"sessionKey\":\"$SESSION_KEY\",\"otpCode\":\"123456\"}")

  echo $OTP_RESPONSE | jq .

  # Extraire le token
  TOKEN=$(echo $OTP_RESPONSE | jq -r '.token')

  if [ "$TOKEN" != "null" ]; then
    echo "4. Test d'accès authentifié..."
    curl -s "$BASE_URL/users" \
      -H "Authorization: Bearer $TOKEN" | jq .
  fi
fi

echo "✅ Tests API terminés!"
```

## Hot Reload et Watch Mode

### Configuration Nodemon

```json
// nodemon.json
{
  "watch": ["app", "config", "start"],
  "ext": "ts,js,json",
  "ignore": ["build", "node_modules", "tests"],
  "exec": "node ace serve",
  "env": {
    "NODE_ENV": "development"
  }
}
```

### Scripts de développement

```bash
# Démarrage avec hot reload
npm run dev

# Démarrage avec debug
npm run dev:debug

# Build et test
npm run build && npm test

# Linting et formatting
npm run lint:fix && npm run format
```

## Bonnes pratiques de développement

### 1. Structure du code

- Utiliser les conventions AdonisJS
- Séparer la logique métier dans des services
- Utiliser des validators pour la validation des données
- Implémenter une gestion d'erreurs cohérente

### 2. Base de données

- Toujours créer des migrations pour les changements de schéma
- Utiliser des seeders pour les données de test
- Tester les migrations en local avant de les déployer

### 3. Tests

- Écrire des tests pour chaque nouvelle fonctionnalité
- Maintenir une couverture de code > 80%
- Utiliser des factories pour les données de test

### 4. Git

- Utiliser des commits atomiques et descriptifs
- Créer des branches pour chaque fonctionnalité
- Faire des pull requests pour les revues de code

### 5. Performance

- Utiliser des index appropriés en base de données
- Implémenter la pagination pour les listes
- Utiliser Redis pour le cache quand approprié

## Dépannage

### Problèmes courants

#### Port déjà utilisé

```bash
# Trouver le processus utilisant le port 3333
lsof -i :3333

# Tuer le processus
kill -9 <PID>
```

#### Base de données inaccessible

```bash
# Vérifier que PostgreSQL est démarré
docker-compose -f docker-compose.dev.yml ps

# Redémarrer PostgreSQL
docker-compose -f docker-compose.dev.yml restart postgres_dev
```

#### Problèmes de cache

```bash
# Nettoyer le cache npm
npm cache clean --force

# Supprimer node_modules et réinstaller
rm -rf node_modules package-lock.json
npm install
```

#### Problèmes de migrations

```bash
# Vérifier l'état des migrations
npm run migration:status

# Rollback et re-run
npm run migration:rollback
npm run migration:run
```

---

_Documentation mise à jour le : 2024-01-15_
