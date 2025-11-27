import type { UsernameRecoveryEmailPayload } from '#events/auth/username_recovery_email'
import { AuthEmailService } from '#services/email/auth_email_service'
import logger from '@adonisjs/core/services/logger'

/**
 * Listener pour la récupération du nom d'utilisateur
 */
export default class SendUsernameRecoveryEmail {
  async handle(payload: UsernameRecoveryEmailPayload) {
    try {
      logger.info(`📧 [Background] Envoi récupération username à ${payload.email}`)
      const success = await AuthEmailService.sendUserNameRecoveryEmail(
        payload.email,
        payload.username,
        payload.userName
      )
      if (success) {
        logger.info(`✅ [Background] Récupération username envoyée à ${payload.email}`)
      } else {
        logger.warn(`⚠️ [Background] Échec envoi récupération username à ${payload.email}`)
      }
    } catch (error) {
      logger.error(`❌ [Background] Erreur envoi récupération username à ${payload.email}:`, error)
    }
  }
}
