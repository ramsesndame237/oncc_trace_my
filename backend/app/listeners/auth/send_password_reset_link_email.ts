import type { PasswordResetLinkEmailPayload } from '#events/auth/password_reset_link_email'
import { AuthEmailService } from '#services/email/auth_email_service'
import logger from '@adonisjs/core/services/logger'

/**
 * Listener pour le lien de réinitialisation de mot de passe
 */
export default class SendPasswordResetLinkEmail {
  async handle(payload: PasswordResetLinkEmailPayload) {
    try {
      logger.info(`📧 [Background] Envoi lien réinitialisation mot de passe à ${payload.email}`)
      const success = await AuthEmailService.sendPasswordResetLinkEmail(
        payload.email,
        payload.resetToken,
        payload.userName
      )
      if (success) {
        logger.info(
          `✅ [Background] Lien réinitialisation mot de passe envoyé à ${payload.email}`
        )
      } else {
        logger.warn(
          `⚠️ [Background] Échec envoi lien réinitialisation mot de passe à ${payload.email}`
        )
      }
    } catch (error) {
      logger.error(
        `❌ [Background] Erreur envoi lien réinitialisation mot de passe à ${payload.email}:`,
        error
      )
    }
  }
}
