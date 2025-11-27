import type { AccountInitializationEmailPayload } from '#events/auth/account_initialization_email'
import { AuthEmailService } from '#services/email/auth_email_service'
import logger from '@adonisjs/core/services/logger'

/**
 * Listener pour la notification d'initialisation de compte
 */
export default class SendAccountInitializationEmail {
  async handle(payload: AccountInitializationEmailPayload) {
    try {
      logger.info(`📧 [Background] Envoi notification initialisation à ${payload.email}`)
      const success = await AuthEmailService.sendAccountInitializationNotification(
        payload.email,
        payload.userName
      )
      if (success) {
        logger.info(`✅ [Background] Notification initialisation envoyée à ${payload.email}`)
      } else {
        logger.warn(`⚠️ [Background] Échec envoi notification initialisation à ${payload.email}`)
      }
    } catch (error) {
      logger.error(
        `❌ [Background] Erreur envoi notification initialisation à ${payload.email}:`,
        error
      )
    }
  }
}
