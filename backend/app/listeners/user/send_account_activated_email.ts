import type { AccountActivatedPayload } from '#events/user/account_activated'
import { UserEmailService } from '#services/email/user_email_service'
import logger from '@adonisjs/core/services/logger'

/**
 * Listener pour l'envoi de l'email d'activation de compte
 */
export default class SendAccountActivatedEmail {
  async handle(payload: AccountActivatedPayload) {
    try {
      logger.info(`📧 [Background] Envoi email d'activation de compte à ${payload.email}`)

      const success = await UserEmailService.sendAccountActivatedEmail(
        payload.email,
        payload.userName
      )

      if (success) {
        logger.info(
          `✅ [Background] Email d'activation de compte envoyé avec succès à ${payload.email}`
        )
      } else {
        logger.error(`❌ [Background] Échec envoi email d'activation de compte à ${payload.email}`)
      }
    } catch (error) {
      logger.error(
        `❌ [Background] Erreur envoi email d'activation de compte à ${payload.email}:`,
        error
      )
    }
  }
}
