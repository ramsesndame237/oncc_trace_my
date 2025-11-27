import type { ActorDeactivatedPayload } from '#events/actor/actor_deactivated'
import { ActorEmailService } from '#services/email/actor_email_service'
import logger from '@adonisjs/core/services/logger'

/**
 * Listener pour l'envoi de l'email de désactivation d'acteur
 */
export default class SendActorDeactivatedEmail {
  async handle(payload: ActorDeactivatedPayload) {
    try {
      logger.info(`📧 [Background] Envoi email de désactivation d'acteur à ${payload.actorName}`)

      const success = await ActorEmailService.sendActorDeactivatedEmail(
        payload.actorId,
        payload.actorName,
        payload.actorType
      )

      if (success) {
        logger.info(
          `✅ [Background] Email de désactivation d'acteur envoyé avec succès pour ${payload.actorName}`
        )
      } else {
        logger.error(
          `❌ [Background] Échec envoi email de désactivation d'acteur pour ${payload.actorName}`
        )
      }
    } catch (error) {
      logger.error(
        `❌ [Background] Erreur envoi email de désactivation d'acteur pour ${payload.actorName}:`,
        error
      )
    }
  }
}
