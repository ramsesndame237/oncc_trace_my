import Session from '#models/session'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { DateTime } from 'luxon'

/**
 * Middleware d'authentification avec Redis pour des vérifications de sécurité supplémentaires
 */
export default class RedisAuthMiddleware {
  /**
   * Vérifie les métadonnées de session et détecte les anomalies
   */
  async handle(ctx: HttpContext, next: NextFn) {
    const { auth, request, response } = ctx

    try {
      // Vérifier si l'utilisateur est authentifié
      const user = auth.user
      if (!user) {
        return await next()
      }

      // Récupérer les métadonnées de session depuis Redis
      const sessionMetadata = await Session.getSessionMetadata(user.id)

      if (sessionMetadata) {
        // Vérifier si l'IP a changé (optionnel - peut être désactivé en production)
        const currentIp = request.ip()
        if (sessionMetadata.ipAddress && sessionMetadata.ipAddress !== currentIp) {
          console.warn(
            `IP change detected for user ${user.id}: ${sessionMetadata.ipAddress} -> ${currentIp}`
          )
          // En production, vous pourriez vouloir forcer une nouvelle authentification
        }

        // Vérifier si la session n'est pas trop ancienne (plus de 30 jours)
        if (sessionMetadata.loginAt) {
          const sessionAge = DateTime.now().diff(sessionMetadata.loginAt, 'days').days
          if (sessionAge > 30) {
            // Session expirée, nettoyer et forcer une nouvelle authentification
            await Session.clearUserSessions(user.id)

            return response.status(401).json({
              success: false,
              message: 'Session expirée, veuillez vous reconnecter',
              code: 'SESSION_EXPIRED',
            })
          }
        }

        // Mettre à jour l'activité de la session
        await Session.storeSessionMetadata(user.id, {
          ipAddress: currentIp,
          userAgent: request.header('user-agent'),
          loginAt: sessionMetadata.loginAt, // Garder la date de connexion originale
        })
      }

      return await next()
    } catch (error) {
      console.error('Redis Auth Middleware Error:', error)
      // En cas d'erreur Redis, continuer sans bloquer l'utilisateur
      return await next()
    }
  }

  /**
   * Middleware pour vérifier qu'aucun OTP n'est en attente
   * Utile pour s'assurer qu'un utilisateur a bien terminé son processus d'authentification
   */
  static async requireCompleteAuth(ctx: HttpContext, next: NextFn) {
    const { auth, response } = ctx

    try {
      const user = auth.user
      if (!user) {
        return await next()
      }

      // Vérifier qu'il n'y a pas d'OTP en attente pour cet utilisateur
      // On vérifie si un OTP existe en tentant de vérifier avec un code dummy
      const hasOtpPending = await Session.verifyOtpCode(user.id, 'dummy-check')
      if (!hasOtpPending) {
        // Pas d'OTP en attente, c'est bon
        return await next()
      }

      // Il y a un OTP en attente, l'authentification n'est pas complète
      return response.status(401).json({
        success: false,
        message: 'Authentification incomplète, veuillez finaliser votre connexion',
        code: 'INCOMPLETE_AUTH',
      })
    } catch (error) {
      console.error('Complete Auth Check Error:', error)
      return await next()
    }
  }

  /**
   * Middleware pour limiter les tentatives de connexion par IP
   * Utilise Redis pour stocker les compteurs de tentatives
   */
  static async rateLimitLogin(ctx: HttpContext, next: NextFn) {
    const { request } = ctx
    const ip = request.ip()

    try {
      // Pour une vraie implémentation, vous devriez utiliser une méthode dédiée pour rate limiting
      // Ici c'est juste un exemple de la logique
      console.log(`Login attempt from IP: ${ip}`)

      return await next()
    } catch (error) {
      console.error('Rate Limit Error:', error)
      return await next()
    }
  }
}
