import type { PasswordChangeEmailPayload } from '#events/auth/password_change_email'
import { AuthEmailService } from '#services/email/auth_email_service'
import logger from '@adonisjs/core/services/logger'

/**
 * Listener pour la notification de changement de mot de passe
 */
export default class SendPasswordChangeEmail {
  async handle(payload: PasswordChangeEmailPayload) {
    try {
      logger.info(`📧 [Background] Envoi notification changement mot de passe à ${payload.email}`)
      const success = await AuthEmailService.sendPasswordChangeNotification(
        payload.email,
        payload.userName
      )
      if (success) {
        logger.info(
          `✅ [Background] Notification changement mot de passe envoyée à ${payload.email}`
        )
      } else {
        logger.warn(
          `⚠️ [Background] Échec envoi notification changement mot de passe à ${payload.email}`
        )
      }
    } catch (error) {
      logger.error(
        `❌ [Background] Erreur envoi notification changement mot de passe à ${payload.email}:`,
        error
      )
    }
  }
}
