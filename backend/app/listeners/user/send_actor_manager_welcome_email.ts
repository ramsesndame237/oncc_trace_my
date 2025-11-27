import type { ActorManagerWelcomePayload } from '#events/user/actor_manager_welcome'
import { UserEmailService } from '#services/email/user_email_service'
import logger from '@adonisjs/core/services/logger'

/**
 * Listener pour l'envoi de l'email de bienvenue à un manager d'acteur
 */
export default class SendActorManagerWelcomeEmail {
  async handle(payload: ActorManagerWelcomePayload) {
    try {
      logger.info(`📧 [Background] Envoi email de bienvenue manager d'acteur à ${payload.email}`)

      const success = await UserEmailService.sendActorManagerWelcomeEmail(
        payload.email,
        payload.userName,
        payload.username,
        payload.tempPassword,
        payload.actorInfo
      )

      if (success) {
        logger.info(
          `✅ [Background] Email de bienvenue manager d'acteur envoyé avec succès à ${payload.email}`
        )
      } else {
        logger.error(
          `❌ [Background] Échec envoi email de bienvenue manager d'acteur à ${payload.email}`
        )
      }
    } catch (error) {
      logger.error(
        `❌ [Background] Erreur envoi email de bienvenue manager d'acteur à ${payload.email}:`,
        error
      )
    }
  }
}
