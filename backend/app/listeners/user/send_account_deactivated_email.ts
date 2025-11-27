import type { AccountDeactivatedPayload } from '#events/user/account_deactivated'
import { UserEmailService } from '#services/email/user_email_service'
import logger from '@adonisjs/core/services/logger'

/**
 * Listener pour l'envoi de l'email de désactivation de compte
 */
export default class SendAccountDeactivatedEmail {
  async handle(payload: AccountDeactivatedPayload) {
    try {
      logger.info(`📧 [Background] Envoi email de désactivation de compte à ${payload.email}`)

      const success = await UserEmailService.sendAccountDeactivatedEmail(
        payload.email,
        payload.userName,
        payload.reason
      )

      if (success) {
        logger.info(
          `✅ [Background] Email de désactivation de compte envoyé avec succès à ${payload.email}`
        )
      } else {
        logger.error(
          `❌ [Background] Échec envoi email de désactivation de compte à ${payload.email}`
        )
      }
    } catch (error) {
      logger.error(
        `❌ [Background] Erreur envoi email de désactivation de compte à ${payload.email}:`,
        error
      )
    }
  }
}
