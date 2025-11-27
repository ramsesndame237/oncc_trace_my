# Tests - SIFC

## Vue d'ensemble

Le système SIFC utilise une stratégie de tests complète incluant des tests unitaires, d'intégration et de bout en bout pour assurer la qualité et la fiabilité du code.

## Architecture des tests

### Structure des dossiers

```
tests/
├── unit/                    # Tests unitaires
│   ├── models/             # Tests des modèles Lucid
│   ├── services/           # Tests des services
│   ├── validators/         # Tests des validateurs
│   └── utils/              # Tests des utilitaires
├── functional/             # Tests fonctionnels/d'intégration
│   ├── auth/              # Tests d'authentification
│   ├── api/               # Tests des endpoints API
│   └── middleware/        # Tests des middlewares
├── e2e/                   # Tests de bout en bout
│   ├── scenarios/         # Scénarios complets
│   └── fixtures/          # Données de test
└── support/               # Utilitaires de test
    ├── factories/         # Factories pour les modèles
    ├── helpers/           # Fonctions d'aide
    └── setup/             # Configuration des tests
```

## Configuration des tests

### Framework de test

Le projet utilise **Japa** (framework de test d'AdonisJS) avec les plugins suivants :

- `@japa/runner` : Exécuteur de tests
- `@japa/assert` : Assertions
- `@japa/api-client` : Tests d'API
- `@japa/browser-client` : Tests de navigateur (E2E)

### Configuration (`tests/bootstrap.ts`)

```typescript
import { configure, processCLIArgs, run } from '@japa/runner'
import { assert } from '@japa/assert'
import { apiClient } from '@japa/api-client'
import { pluginAdonisJS } from '@japa/plugin-adonisjs'

processCLIArgs(process.argv.splice(2))

configure({
  files: ['tests/unit/**/*.spec.ts', 'tests/functional/**/*.spec.ts', 'tests/e2e/**/*.spec.ts'],
  plugins: [assert(), apiClient(), pluginAdonisJS()],
  reporters: {
    activated: ['spec'],
    list: ['spec', 'dot', 'json'],
  },
  forceExit: false,
  timeout: 30000,
})

run()
```

## Tests unitaires

### Tests des modèles

#### Exemple : Test du modèle User

```typescript
// tests/unit/models/user.spec.ts
import { test } from '@japa/runner'
import User from '#models/user'
import { v4 as uuidv4 } from 'uuid'

test.group('User Model', (group) => {
  group.each.setup(async () => {
    // Setup avant chaque test
  })

  group.each.teardown(async () => {
    // Nettoyage après chaque test
  })

  test('should create a user with valid data', async ({ assert }) => {
    const userData = {
      uuid: uuidv4(),
      pseudo: 'test_user',
      nom: 'Test',
      prenom: 'User',
      email: 'test@example.com',
      password: 'Password123!',
      role: 'field_agent',
      langue: 'fr',
      mustChangePassword: false,
      securityQuestion1: 'Question 1?',
      securityAnswer1: 'Answer 1',
      securityQuestion2: 'Question 2?',
      securityAnswer2: 'Answer 2',
      securityQuestion3: 'Question 3?',
      securityAnswer3: 'Answer 3',
    }

    const user = await User.create(userData)

    assert.exists(user.id)
    assert.equal(user.pseudo, 'test_user')
    assert.equal(user.email, 'test@example.com')
    assert.equal(user.role, 'field_agent')
    assert.notEqual(user.password, 'Password123!') // Doit être hashé
  })

  test('should validate role methods', async ({ assert }) => {
    const user = new User()
    user.role = 'technical_admin'

    assert.isTrue(user.isTechnicalAdmin)
    assert.isFalse(user.isFieldAgent)
    assert.isTrue(user.hasRole('technical_admin'))
    assert.isTrue(user.hasAnyRole(['technical_admin', 'bassin_admin']))
  })

  test('should hash password before saving', async ({ assert }) => {
    const user = new User()
    user.password = 'PlainPassword123!'

    await user.save()

    assert.notEqual(user.password, 'PlainPassword123!')
    assert.isTrue(user.password.length > 50) // Hash bcrypt
  })
})
```

### Tests des services

#### Exemple : Test du service Email

```typescript
// tests/unit/services/email_service.spec.ts
import { test } from '@japa/runner'
import EmailService from '#services/email_service'
import User from '#models/user'

test.group('Email Service', (group) => {
  let user: User

  group.setup(async () => {
    user = await User.factory().create()
  })

  group.teardown(async () => {
    await user.delete()
  })

  test('should send OTP email successfully', async ({ assert }) => {
    const otpCode = '123456'

    const result = await EmailService.sendOTP(user.email, otpCode, user.nom, user.prenom)

    assert.isTrue(result.success)
    assert.exists(result.messageId)
  })

  test('should send welcome email with temporary password', async ({ assert }) => {
    const tempPassword = 'TempPass123!'

    const result = await EmailService.sendWelcomeEmail(
      user.email,
      user.nom,
      user.prenom,
      user.pseudo,
      tempPassword
    )

    assert.isTrue(result.success)
    assert.exists(result.messageId)
  })

  test('should handle email sending errors gracefully', async ({ assert }) => {
    // Test avec email invalide
    const result = await EmailService.sendOTP('invalid-email', '123456', 'Test', 'User')

    assert.isFalse(result.success)
    assert.exists(result.error)
  })
})
```

## Tests fonctionnels

### Tests d'authentification

```typescript
// tests/functional/auth/authentication.spec.ts
import { test } from '@japa/runner'
import { ApiClient } from '@japa/api-client'
import User from '#models/user'

test.group('Authentication API', (group) => {
  let user: User

  group.setup(async () => {
    user = await User.factory().create({
      pseudo: 'test_auth',
      email: 'auth@test.com',
      password: 'Password123!',
      role: 'field_agent',
    })
  })

  group.teardown(async () => {
    await user.delete()
  })

  test('should login with valid credentials', async ({ client, assert }) => {
    const response = await client.post('/api/v1/login').json({
      pseudo: 'test_auth',
      password: 'Password123!',
    })

    response.assertStatus(200)
    response.assertBodyContains({
      success: true,
      sessionKey: (value: string) => assert.isString(value),
    })
  })

  test('should reject invalid credentials', async ({ client }) => {
    const response = await client.post('/api/v1/login').json({
      pseudo: 'test_auth',
      password: 'WrongPassword',
    })

    response.assertStatus(401)
    response.assertBodyContains({
      success: false,
      message: 'Identifiants invalides',
    })
  })

  test('should verify OTP and complete authentication', async ({ client, assert }) => {
    // Étape 1: Login initial
    const loginResponse = await client.post('/api/v1/login').json({
      pseudo: 'test_auth',
      password: 'Password123!',
    })

    const { sessionKey } = loginResponse.body()

    // Étape 2: Simuler la vérification OTP
    // Note: En test, on peut mocker le service Redis ou utiliser un code fixe
    const otpResponse = await client.post('/api/v1/verify-otp').json({
      sessionKey,
      otpCode: '123456', // Code de test
    })

    otpResponse.assertStatus(200)
    otpResponse.assertBodyContains({
      success: true,
      token: (value: string) => assert.isString(value),
      user: {
        pseudo: 'test_auth',
        role: 'field_agent',
      },
    })
  })
})
```

### Tests des endpoints API

```typescript
// tests/functional/api/users.spec.ts
import { test } from '@japa/runner'
import User from '#models/user'

test.group('Users API', (group) => {
  let adminUser: User
  let authToken: string

  group.setup(async () => {
    adminUser = await User.factory().create({
      role: 'technical_admin',
    })

    // Obtenir un token d'authentification
    authToken = await adminUser.accessTokens.create(adminUser)
  })

  group.teardown(async () => {
    await adminUser.delete()
  })

  test('should create a new user', async ({ client }) => {
    const userData = {
      pseudo: 'new_user',
      nom: 'Nouveau',
      prenom: 'Utilisateur',
      email: 'nouveau@test.com',
      role: 'field_agent',
      securityQuestion1: 'Question 1?',
      securityAnswer1: 'Réponse 1',
      securityQuestion2: 'Question 2?',
      securityAnswer2: 'Réponse 2',
      securityQuestion3: 'Question 3?',
      securityAnswer3: 'Réponse 3',
    }

    const response = await client
      .post('/api/v1/users')
      .header('Authorization', `Bearer ${authToken}`)
      .json(userData)

    response.assertStatus(201)
    response.assertBodyContains({
      success: true,
      user: {
        pseudo: 'new_user',
        email: 'nouveau@test.com',
        role: 'field_agent',
      },
    })
  })

  test('should require authentication for user creation', async ({ client }) => {
    const response = await client.post('/api/v1/users').json({
      pseudo: 'test',
      email: 'test@test.com',
    })

    response.assertStatus(401)
  })

  test('should validate required fields', async ({ client }) => {
    const response = await client
      .post('/api/v1/users')
      .header('Authorization', `Bearer ${authToken}`)
      .json({
        pseudo: 'incomplete',
        // Champs manquants
      })

    response.assertStatus(422)
    response.assertBodyContains({
      errors: (errors: any[]) => errors.length > 0,
    })
  })
})
```

## Tests de bout en bout (E2E)

### Configuration Playwright

```typescript
// tests/e2e/setup.ts
import { chromium, Browser, Page } from 'playwright'

export class E2ETestSetup {
  private browser: Browser
  private page: Page

  async setup() {
    this.browser = await chromium.launch({
      headless: process.env.CI === 'true',
    })

    this.page = await this.browser.newPage()

    // Configuration de base
    await this.page.setViewportSize({ width: 1280, height: 720 })

    return this.page
  }

  async teardown() {
    await this.page?.close()
    await this.browser?.close()
  }

  async login(pseudo: string, password: string, otpCode: string = '123456') {
    await this.page.goto('/login')

    await this.page.fill('[data-testid="pseudo"]', pseudo)
    await this.page.fill('[data-testid="password"]', password)
    await this.page.click('[data-testid="login-button"]')

    // Attendre la page OTP
    await this.page.waitForSelector('[data-testid="otp-input"]')
    await this.page.fill('[data-testid="otp-input"]', otpCode)
    await this.page.click('[data-testid="verify-otp-button"]')

    // Attendre la redirection vers le dashboard
    await this.page.waitForURL('/dashboard')
  }
}
```

### Scénario E2E complet

```typescript
// tests/e2e/scenarios/user_management.spec.ts
import { test } from '@japa/runner'
import { E2ETestSetup } from '../setup'
import User from '#models/user'

test.group('User Management E2E', (group) => {
  let setup: E2ETestSetup
  let adminUser: User

  group.setup(async () => {
    setup = new E2ETestSetup()
    await setup.setup()

    adminUser = await User.factory().create({
      pseudo: 'admin_e2e',
      role: 'technical_admin',
      password: 'AdminPass123!',
    })
  })

  group.teardown(async () => {
    await setup.teardown()
    await adminUser.delete()
  })

  test('should complete user creation workflow', async ({ assert }) => {
    const page = await setup.setup()

    // 1. Login en tant qu'admin
    await setup.login('admin_e2e', 'AdminPass123!')

    // 2. Naviguer vers la gestion des utilisateurs
    await page.click('[data-testid="users-menu"]')
    await page.waitForURL('/users')

    // 3. Cliquer sur "Créer un utilisateur"
    await page.click('[data-testid="create-user-button"]')

    // 4. Remplir le formulaire
    await page.fill('[data-testid="pseudo"]', 'nouveau_user_e2e')
    await page.fill('[data-testid="nom"]', 'Nouveau')
    await page.fill('[data-testid="prenom"]', 'User')
    await page.fill('[data-testid="email"]', 'nouveau.user@test.com')
    await page.selectOption('[data-testid="role"]', 'field_agent')

    // Questions de sécurité
    await page.fill('[data-testid="security-question-1"]', 'Question 1?')
    await page.fill('[data-testid="security-answer-1"]', 'Réponse 1')
    await page.fill('[data-testid="security-question-2"]', 'Question 2?')
    await page.fill('[data-testid="security-answer-2"]', 'Réponse 2')
    await page.fill('[data-testid="security-question-3"]', 'Question 3?')
    await page.fill('[data-testid="security-answer-3"]', 'Réponse 3')

    // 5. Soumettre le formulaire
    await page.click('[data-testid="submit-user"]')

    // 6. Vérifier la création
    await page.waitForSelector('[data-testid="success-message"]')

    const successMessage = await page.textContent('[data-testid="success-message"]')
    assert.include(successMessage, 'Utilisateur créé avec succès')

    // 7. Vérifier que l'utilisateur apparaît dans la liste
    await page.goto('/users')
    await page.waitForSelector('[data-testid="users-table"]')

    const userRow = page.locator('[data-testid="user-row"]', { hasText: 'nouveau_user_e2e' })
    await assert.isTrue(await userRow.isVisible())
  })
})
```

## Factories et fixtures

### Factory pour le modèle User

```typescript
// tests/support/factories/user_factory.ts
import Factory from '@adonisjs/lucid/factories'
import User from '#models/user'
import { v4 as uuidv4 } from 'uuid'

export const UserFactory = Factory.define(User, ({ faker }) => {
  return {
    uuid: uuidv4(),
    pseudo: faker.internet.userName(),
    nom: faker.person.lastName(),
    prenom: faker.person.firstName(),
    email: faker.internet.email(),
    password: 'Password123!',
    role: faker.helpers.arrayElement(['technical_admin', 'bassin_admin', 'field_agent', 'gerant']),
    langue: 'fr',
    mustChangePassword: false,
    securityQuestion1: 'Quel est le nom de votre premier animal de compagnie ?',
    securityAnswer1: faker.animal.dog(),
    securityQuestion2: 'Dans quelle ville êtes-vous né(e) ?',
    securityAnswer2: faker.location.city(),
    securityQuestion3: 'Quel est le nom de jeune fille de votre mère ?',
    securityAnswer3: faker.person.lastName(),
  }
})
  .state('technicalAdmin', (user) => (user.role = 'technical_admin'))
  .state('bassinAdmin', (user) => (user.role = 'bassin_admin'))
  .state('fieldAgent', (user) => (user.role = 'field_agent'))
  .state('gerant', (user) => (user.role = 'gerant'))
```

## Helpers de test

### Helper pour l'authentification

```typescript
// tests/support/helpers/auth_helper.ts
import User from '#models/user'
import { ApiClient } from '@japa/api-client'

export class AuthHelper {
  static async createAuthenticatedUser(
    role: string = 'field_agent'
  ): Promise<{ user: User; token: string }> {
    const user = await User.factory().create({ role })
    const token = await user.accessTokens.create(user)

    return { user, token }
  }

  static async loginUser(client: ApiClient, pseudo: string, password: string): Promise<string> {
    const loginResponse = await client.post('/api/v1/login').json({ pseudo, password })

    const { sessionKey } = loginResponse.body()

    const otpResponse = await client.post('/api/v1/verify-otp').json({
      sessionKey,
      otpCode: '123456', // Code de test
    })

    return otpResponse.body().token
  }

  static getAuthHeaders(token: string): Record<string, string> {
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  }
}
```

### Helper pour Redis

```typescript
// tests/support/helpers/redis_helper.ts
import redis from '@adonisjs/redis/services/main'

export class RedisHelper {
  static async clearTestData(): Promise<void> {
    const keys = await redis.keys('test:*')
    if (keys.length > 0) {
      await redis.del(...keys)
    }
  }

  static async setTestSession(userId: number, otpCode: string): Promise<string> {
    const sessionKey = `test:auth_${userId}_${Date.now()}`
    const sessionData = {
      userId,
      otpCode,
      expiresAt: Date.now() + 10 * 60 * 1000,
      attempts: 0,
      type: 'auth',
    }

    await redis.setex(sessionKey, 600, JSON.stringify(sessionData))
    return sessionKey
  }
}
```

## Configuration des environnements de test

### Variables d'environnement de test

```env
# .env.test
NODE_ENV=test
PORT=3334
HOST=localhost
LOG_LEVEL=silent

# Base de données de test
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_DATABASE=sifc_test

# Redis de test
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=1

# Email de test (utilise un service de test)
SENDGRID_API_KEY=test_key
SENDGRID_FROM_EMAIL=test@example.com
SENDGRID_FROM_NAME=SIFC Test

# Désactiver les emails en test
MAIL_MAILER=smtp
SMTP_HOST=localhost
SMTP_PORT=1025
```

### Setup de base de données de test

```typescript
// tests/support/setup/database.ts
import { BaseCommand } from '@adonisjs/core/ace'
import Application from '@ioc:Adonis/Core/Application'

export class DatabaseTestSetup {
  static async setup(): Promise<void> {
    // Créer la base de données de test si elle n'existe pas
    await this.createTestDatabase()

    // Exécuter les migrations
    await this.runMigrations()

    // Exécuter les seeders de base
    await this.runSeeders()
  }

  static async teardown(): Promise<void> {
    // Nettoyer la base de données
    await this.cleanDatabase()
  }

  private static async createTestDatabase(): Promise<void> {
    // Logique pour créer la DB de test
  }

  private static async runMigrations(): Promise<void> {
    const ace = await Application.container.make('Adonis/Core/Ace')
    await ace.exec('migration:run', [])
  }

  private static async runSeeders(): Promise<void> {
    const ace = await Application.container.make('Adonis/Core/Ace')
    await ace.exec('db:seed', [])
  }

  private static async cleanDatabase(): Promise<void> {
    const ace = await Application.container.make('Adonis/Core/Ace')
    await ace.exec('migration:rollback', ['--batch=0'])
  }
}
```

## Commandes de test

### Scripts package.json

```json
{
  "scripts": {
    "test": "node ace test",
    "test:unit": "node ace test tests/unit",
    "test:functional": "node ace test tests/functional",
    "test:e2e": "node ace test tests/e2e",
    "test:watch": "node ace test --watch",
    "test:coverage": "c8 node ace test",
    "test:ci": "node ace test --reporter=json"
  }
}
```

### Configuration de couverture de code

```json
// .c8rc.json
{
  "reporter": ["text", "html", "lcov"],
  "exclude": ["tests/**", "build/**", "coverage/**", "node_modules/**"],
  "all": true,
  "check-coverage": true,
  "lines": 80,
  "functions": 80,
  "branches": 80,
  "statements": 80
}
```

## Bonnes pratiques

### 1. Organisation des tests

- Un fichier de test par module/service
- Grouper les tests par fonctionnalité
- Utiliser des noms descriptifs pour les tests

### 2. Isolation des tests

- Chaque test doit être indépendant
- Nettoyer les données après chaque test
- Utiliser des transactions pour les tests de base de données

### 3. Données de test

- Utiliser des factories pour créer des données cohérentes
- Éviter les données hardcodées
- Utiliser des fixtures pour les scénarios complexes

### 4. Mocking

- Mocker les services externes (email, API tierces)
- Utiliser des stubs pour les dépendances
- Tester les cas d'erreur

### 5. Performance

- Paralléliser les tests quand possible
- Utiliser des bases de données en mémoire pour les tests rapides
- Optimiser les fixtures et factories

---

_Documentation mise à jour le : 2024-01-15_
