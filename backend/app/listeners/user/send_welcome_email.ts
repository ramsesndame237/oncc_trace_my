import type { WelcomePayload } from '#events/user/welcome'
import { UserEmailService } from '#services/email/user_email_service'
import logger from '@adonisjs/core/services/logger'

/**
 * Listener pour l'envoi de l'email de bienvenue
 */
export default class SendWelcomeEmail {
  async handle(payload: WelcomePayload) {
    try {
      logger.info(`📧 [Background] Envoi email de bienvenue à ${payload.email}`)

      const success = await UserEmailService.sendWelcomeEmail(
        payload.email,
        payload.userName,
        payload.username,
        payload.tempPassword
      )

      if (success) {
        logger.info(`✅ [Background] Email de bienvenue envoyé avec succès à ${payload.email}`)
      } else {
        logger.error(`❌ [Background] Échec envoi email de bienvenue à ${payload.email}`)
      }
    } catch (error) {
      logger.error(`❌ [Background] Erreur envoi email de bienvenue à ${payload.email}:`, error)
    }
  }
}
