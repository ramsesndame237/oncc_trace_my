# Configuration Redis - SIFC

## Vue d'ensemble

Redis est utilisé dans le système SIFC pour :

- Stockage des sessions d'authentification temporaires
- Cache des codes OTP avec expiration automatique
- Gestion des tokens de réinitialisation de mot de passe
- Cache des données fréquemment consultées

## Installation et Configuration

### 1. Installation Redis

#### Via Docker (Recommandé pour le développement)

```bash
# Démarrer Redis avec Docker
docker run -d \
  --name sifc_redis \
  -p 6379:6379 \
  redis:7-alpine \
  redis-server --appendonly yes

# Ou utiliser docker-compose
version: '3.8'
services:
  redis:
    image: redis:7-alpine
    container_name: sifc_redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes

volumes:
  redis_data:
```

#### Installation native (Ubuntu/Debian)

```bash
# Installer Redis
sudo apt update
sudo apt install redis-server

# Démarrer Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Vérifier l'installation
redis-cli ping
# Réponse attendue: PONG
```

### 2. Configuration AdonisJS

#### Variables d'environnement

```env
# Configuration Redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Configuration pour la production
REDIS_HOST=redis.example.com
REDIS_PORT=6379
REDIS_PASSWORD=your_secure_password
REDIS_DB=0
```

#### Configuration dans `config/redis.ts`

```typescript
import { defineConfig } from '@adonisjs/redis'
import env from '#start/env'

const redisConfig = defineConfig({
  connection: 'main',
  connections: {
    main: {
      host: env.get('REDIS_HOST'),
      port: env.get('REDIS_PORT'),
      password: env.get('REDIS_PASSWORD', ''),
      db: env.get('REDIS_DB', 0),
      keyPrefix: 'sifc:',
      retryDelayOnFailover: 100,
      retryDelayOnClusterDown: 300,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
    },
  },
})

export default redisConfig
```

## Utilisation dans SIFC

### 1. Gestion des sessions d'authentification

#### Stockage des codes OTP

```typescript
import redis from '@adonisjs/redis/services/main'

// Stocker un code OTP avec expiration (10 minutes)
const sessionKey = `auth_${userId}_${Date.now()}`
const otpData = {
  userId: user.id,
  otpCode: '123456',
  expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
  attempts: 0,
  type: 'auth',
}

await redis.setex(sessionKey, 600, JSON.stringify(otpData)) // 600 secondes = 10 minutes
```

#### Vérification des codes OTP

```typescript
// Récupérer et vérifier un code OTP
const sessionData = await redis.get(sessionKey)
if (!sessionData) {
  throw new Error('Session expirée ou invalide')
}

const session = JSON.parse(sessionData)
if (session.otpCode !== providedOtp) {
  // Incrémenter les tentatives
  session.attempts += 1
  if (session.attempts >= 3) {
    await redis.del(sessionKey) // Supprimer après 3 tentatives
    throw new Error('Trop de tentatives échouées')
  }
  await redis.setex(sessionKey, 600, JSON.stringify(session))
  throw new Error('Code OTP invalide')
}

// Code valide, supprimer la session
await redis.del(sessionKey)
```

### 2. Tokens de réinitialisation de mot de passe

```typescript
// Générer un token de réinitialisation
const resetToken = crypto.randomBytes(32).toString('hex')
const resetData = {
  userId: user.id,
  token: resetToken,
  expiresAt: Date.now() + 30 * 60 * 1000, // 30 minutes
  used: false,
}

await redis.setex(`reset_${resetToken}`, 1800, JSON.stringify(resetData)) // 30 minutes
```

### 3. Cache des données

```typescript
// Cache des utilisateurs fréquemment consultés
const cacheKey = `user_${userId}`
let user = await redis.get(cacheKey)

if (!user) {
  user = await User.find(userId)
  await redis.setex(cacheKey, 3600, JSON.stringify(user)) // Cache 1 heure
} else {
  user = JSON.parse(user)
}
```

## Modèle Session

### Structure du modèle Session

```typescript
// app/models/session.ts
import redis from '@adonisjs/redis/services/main'

export interface SessionData {
  userId: number
  otpCode: string
  expiresAt: number
  attempts: number
  type: 'auth' | 'reset'
}

export class Session {
  static async create(key: string, data: SessionData, ttl: number = 600): Promise<void> {
    await redis.setex(key, ttl, JSON.stringify(data))
  }

  static async get(key: string): Promise<SessionData | null> {
    const data = await redis.get(key)
    return data ? JSON.parse(data) : null
  }

  static async update(key: string, data: SessionData, ttl: number = 600): Promise<void> {
    await redis.setex(key, ttl, JSON.stringify(data))
  }

  static async delete(key: string): Promise<void> {
    await redis.del(key)
  }

  static async exists(key: string): Promise<boolean> {
    return (await redis.exists(key)) === 1
  }

  static async getTTL(key: string): Promise<number> {
    return await redis.ttl(key)
  }

  static generateKey(prefix: string, userId: number): string {
    return `${prefix}_${userId}_${Date.now()}`
  }
}
```

## Commandes Redis utiles

### Surveillance et débogage

```bash
# Se connecter à Redis CLI
redis-cli

# Lister toutes les clés SIFC
redis-cli keys "sifc:*"

# Voir les sessions d'authentification actives
redis-cli keys "sifc:auth_*"

# Voir le contenu d'une clé
redis-cli get "sifc:auth_1_1703123456789"

# Voir le TTL d'une clé
redis-cli ttl "sifc:auth_1_1703123456789"

# Supprimer toutes les clés SIFC (ATTENTION: Développement uniquement)
redis-cli eval "return redis.call('del', unpack(redis.call('keys', 'sifc:*')))" 0

# Surveiller les commandes en temps réel
redis-cli monitor

# Statistiques Redis
redis-cli info stats
```

### Nettoyage et maintenance

```bash
# Supprimer les clés expirées manuellement
redis-cli eval "
  local keys = redis.call('keys', 'sifc:auth_*')
  local deleted = 0
  for i=1,#keys do
    if redis.call('ttl', keys[i]) == -1 then
      redis.call('del', keys[i])
      deleted = deleted + 1
    end
  end
  return deleted
" 0

# Vider complètement Redis (ATTENTION: Développement uniquement)
redis-cli flushall
```

## Performance et optimisation

### Configuration de production

```bash
# Dans redis.conf
maxmemory 256mb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
appendonly yes
appendfsync everysec
```

### Monitoring

```typescript
// Service de monitoring Redis
export class RedisMonitor {
  static async getStats() {
    const info = await redis.info('stats')
    return {
      totalConnections: info.total_connections_received,
      totalCommands: info.total_commands_processed,
      keyspaceHits: info.keyspace_hits,
      keyspaceMisses: info.keyspace_misses,
      usedMemory: info.used_memory_human,
    }
  }

  static async getActiveSessionsCount(): Promise<number> {
    const keys = await redis.keys('sifc:auth_*')
    return keys.length
  }

  static async cleanExpiredSessions(): Promise<number> {
    const keys = await redis.keys('sifc:auth_*')
    let cleaned = 0

    for (const key of keys) {
      const ttl = await redis.ttl(key)
      if (ttl === -1) {
        // Clé sans expiration
        await redis.del(key)
        cleaned++
      }
    }

    return cleaned
  }
}
```

## Sécurité

### Bonnes pratiques

1. **Authentification** :

   - Utiliser un mot de passe fort en production
   - Configurer Redis pour n'écouter que sur localhost en développement
   - Utiliser TLS en production

2. **Isolation** :

   - Utiliser des préfixes pour les clés (`sifc:`)
   - Séparer les environnements avec des bases Redis différentes
   - Limiter les connexions simultanées

3. **Données sensibles** :
   - Ne jamais stocker de mots de passe en clair
   - Chiffrer les données sensibles avant stockage
   - Utiliser des TTL appropriés pour les données temporaires

### Configuration sécurisée

```bash
# Dans redis.conf pour la production
bind 127.0.0.1
requirepass your_secure_password
maxclients 100
timeout 300
tcp-keepalive 60
```

## Dépannage

### Erreurs courantes

#### Connexion refusée

```
Error: Redis connection to 127.0.0.1:6379 failed - connect ECONNREFUSED
```

- Vérifier que Redis est démarré
- Vérifier l'adresse et le port
- Vérifier les règles de firewall

#### Authentification échouée

```
Error: NOAUTH Authentication required
```

- Vérifier le mot de passe Redis
- Mettre à jour la variable `REDIS_PASSWORD`

#### Mémoire insuffisante

```
Error: OOM command not allowed when used memory > 'maxmemory'
```

- Augmenter la limite `maxmemory`
- Configurer une politique d'éviction appropriée
- Nettoyer les clés expirées

### Logs et monitoring

```bash
# Logs Redis (Ubuntu/Debian)
tail -f /var/log/redis/redis-server.log

# Logs Docker
docker logs sifc_redis -f

# Monitoring en temps réel
redis-cli --latency
redis-cli --stat
```

## Tests

### Test de connexion

```typescript
// Test simple de connexion Redis
import redis from '@adonisjs/redis/services/main'

try {
  await redis.ping()
  console.log('✅ Redis connecté avec succès')
} catch (error) {
  console.error('❌ Erreur de connexion Redis:', error.message)
}
```

### Test des sessions

```typescript
// Test complet des sessions
const testSession = async () => {
  const sessionKey = 'test_session_123'
  const sessionData = {
    userId: 1,
    otpCode: '123456',
    expiresAt: Date.now() + 600000,
    attempts: 0,
    type: 'auth' as const,
  }

  // Créer
  await Session.create(sessionKey, sessionData, 60)
  console.log('✅ Session créée')

  // Lire
  const retrieved = await Session.get(sessionKey)
  console.log('✅ Session récupérée:', retrieved)

  // Supprimer
  await Session.delete(sessionKey)
  console.log('✅ Session supprimée')
}
```

---

_Documentation mise à jour le : 2024-01-15_
