import type { ActorActivatedPayload } from '#events/actor/actor_activated'
import { ActorEmailService } from '#services/email/actor_email_service'
import logger from '@adonisjs/core/services/logger'

/**
 * Listener pour l'envoi de l'email d'activation d'acteur
 */
export default class SendActorActivatedEmail {
  async handle(payload: ActorActivatedPayload) {
    try {
      logger.info(`📧 [Background] Envoi email d'activation d'acteur à ${payload.actorName}`)

      const success = await ActorEmailService.sendActorActivatedEmail(
        payload.actorId,
        payload.actorName,
        payload.actorType
      )

      if (success) {
        logger.info(
          `✅ [Background] Email d'activation d'acteur envoyé avec succès pour ${payload.actorName}`
        )
      } else {
        logger.error(
          `❌ [Background] Échec envoi email d'activation d'acteur pour ${payload.actorName}`
        )
      }
    } catch (error) {
      logger.error(
        `❌ [Background] Erreur envoi email d'activation d'acteur pour ${payload.actorName}:`,
        error
      )
    }
  }
}
