import { DateTime } from 'luxon'
import redis from 'redis'

// Configuration Redis basée sur les variables d'environnement
const redisClient = redis.createClient({
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: Number.parseInt(process.env.REDIS_PORT || '6379'),
  },
  password: process.env.REDIS_PASSWORD || undefined,
  database: Number.parseInt(process.env.REDIS_DB || '0'),
})

// Connexion Redis avec gestion d'erreurs
redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err)
})

redisClient.on('connect', () => {
  console.log('Redis Client Connected')
})

// Assurer la connexion
if (!redisClient.isOpen) {
  redisClient.connect().catch(console.error)
}

// Interface Redis simplifiée
class RedisService {
  static async setex(key: string, seconds: number, value: string): Promise<void> {
    try {
      await redisClient.setEx(`sifc:${key}`, seconds, value)
    } catch (error) {
      console.error('Redis SETEX Error:', error)
      throw error
    }
  }

  static async get(key: string): Promise<string | null> {
    try {
      return await redisClient.get(`sifc:${key}`)
    } catch (error) {
      console.error('Redis GET Error:', error)
      return null
    }
  }

  static async del(...keys: string[]): Promise<void> {
    try {
      const prefixedKeys = keys.map((key) => `sifc:${key}`)
      await redisClient.del(prefixedKeys)
    } catch (error) {
      console.error('Redis DEL Error:', error)
      throw error
    }
  }

  static async keys(pattern: string): Promise<string[]> {
    try {
      const keys = await redisClient.keys(`sifc:${pattern}`)
      return keys.map((key) => key.replace('sifc:', ''))
    } catch (error) {
      console.error('Redis KEYS Error:', error)
      return []
    }
  }
}

export default class Session {
  /**
   * Stocke un token de réinitialisation de mot de passe dans Redis
   */
  static async storePasswordResetToken(
    token: string,
    userId: string,
    expiresInMinutes: number = 15
  ): Promise<void> {
    const key = `password-reset:${token}`
    const data = JSON.stringify({
      userId,
      createdAt: DateTime.now().toISO(),
    })

    // Stocke avec expiration automatique
    await RedisService.setex(key, expiresInMinutes * 60, data)
  }

  /**
   * Récupère et valide un token de réinitialisation de mot de passe
   */
  static async getPasswordResetToken(
    token: string
  ): Promise<{ userId: string; createdAt: DateTime } | null> {
    const key = `password-reset:${token}`
    const data = await RedisService.get(key)

    if (!data) {
      return null
    }

    try {
      const parsed = JSON.parse(data)
      return {
        userId: parsed.userId,
        createdAt: DateTime.fromISO(parsed.createdAt),
      }
    } catch {
      return null
    }
  }

  /**
   * Supprime un token de réinitialisation de mot de passe (après utilisation)
   */
  static async deletePasswordResetToken(token: string): Promise<void> {
    const key = `password-reset:${token}`
    await RedisService.del(key)
  }

  /**
   * Supprime un code OTP (en cas d'annulation ou d'expiration manuelle)
   */
  static async deleteOtpToken(userId: string): Promise<void> {
    const key = `otp:${userId}`
    await RedisService.del(key)
  }

  /**
   * Stocke des métadonnées de session pour audit (optionnel)
   */
  static async storeSessionMetadata(
    userId: string,
    metadata: {
      ipAddress?: string
      userAgent?: string
      loginAt?: DateTime
    },
    expiresInMinutes: number = 30
  ): Promise<void> {
    const key = `session-meta:${userId}`
    const data = JSON.stringify({
      ...metadata,
      loginAt: metadata.loginAt?.toISO() || DateTime.now().toISO(),
    })

    // Stocke pour 30 jours (même durée que les access tokens)
    await RedisService.setex(key, expiresInMinutes * 60, data)
  }

  /**
   * Récupère les métadonnées de session d'un utilisateur
   */
  static async getSessionMetadata(userId: string): Promise<{
    ipAddress?: string
    userAgent?: string
    loginAt?: DateTime
  } | null> {
    const key = `session-meta:${userId}`
    const data = await RedisService.get(key)

    if (!data) {
      return null
    }

    try {
      const parsed = JSON.parse(data)
      return {
        ...parsed,
        loginAt: parsed.loginAt ? DateTime.fromISO(parsed.loginAt) : undefined,
      }
    } catch {
      return null
    }
  }

  /**
   * Nettoie toutes les données de session d'un utilisateur (déconnexion complète)
   */
  static async clearUserSessions(userUuid: string): Promise<void> {
    const keys = [`otp:${userUuid}`, `session-meta:${userUuid}`]

    // Recherche aussi les tokens de réinitialisation (plus complexe car le token est dans la clé)
    const resetKeys = await RedisService.keys('password-reset:*')
    for (const key of resetKeys) {
      const data = await RedisService.get(key)
      if (data) {
        try {
          const parsed = JSON.parse(data)
          if (parsed.userUuid === userUuid) {
            keys.push(key)
          }
        } catch {
          // Ignore les erreurs de parsing
        }
      }
    }

    if (keys.length > 0) {
      await RedisService.del(...keys)
    }
  }

  /**
   * Test de connexion Redis
   */
  static async testConnection(): Promise<boolean> {
    try {
      await RedisService.setex('test:connection', 10, 'test')
      const result = await RedisService.get('test:connection')
      await RedisService.del('test:connection')
      return result === 'test'
    } catch (error) {
      console.error('Redis connection test failed:', error)
      return false
    }
  }

  /**
   * Génère un token sécurisé
   */
  static generateSecureToken(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  /**
   * Génère un code OTP numérique et stocke dans Redis
   */
  static async generateOtpCode(
    userUuid: string,
    expiresInMinutes: number = 5,
    length: number = 6
  ): Promise<string> {
    // En mode QA, utiliser le code OTP par défaut configurable
    const isQaMode = process.env.DEPLOY_MODE === 'qa'
    const code = isQaMode
      ? process.env.QA_DEFAULT_OTP || '000000'
      : Math.floor(
          Math.random() * (Math.pow(10, length) - Math.pow(10, length - 1)) +
            Math.pow(10, length - 1)
        ).toString()

    const key = `otp:${userUuid}`
    const data = JSON.stringify({
      code,
      createdAt: DateTime.now().toISO(),
    })

    // Stocke avec expiration automatique
    await RedisService.setex(key, expiresInMinutes * 60, data)
    return code
  }

  /**
   * Vérifie un code OTP pour un utilisateur
   */
  static async verifyOtpCode(userUuid: string, providedCode: string): Promise<boolean> {
    const key = `otp:${userUuid}`
    const data = await RedisService.get(key)

    if (!data) {
      return false
    }

    try {
      const parsed = JSON.parse(data)
      const isValid = parsed.code === providedCode

      // Si le code est valide, on le supprime pour éviter la réutilisation
      if (isValid) {
        await RedisService.del(key)
      }

      return isValid
    } catch {
      return false
    }
  }

  /**
   * Genere un token pour l'initialisation de compte
   */
  static async generateToken(
    userUuid: string,
    keyPrefix: string,
    expiresInMinutes: number = 5
  ): Promise<string> {
    const token = this.generateSecureToken(32)
    const key = `${keyPrefix}:${token}`
    await RedisService.setex(key, expiresInMinutes * 60, userUuid)
    return token
  }

  /**
   * Vérifie un token pour un utilisateur
   */
  static async verifyToken(userUuid: string, keyPrefix: string, token: string): Promise<boolean> {
    const key = `${keyPrefix}:${token}`
    const data = await RedisService.get(key)

    if (!data) {
      return false
    }

    const isValid = data === userUuid

    // Si le code est valide, on le supprime pour éviter la réutilisation
    if (isValid) {
      await RedisService.del(key)
    }

    return isValid
  }
}
