import type { ProducerRemovedFromOpaPayload } from '#events/actor/producer_removed_from_opa'
import { ActorEmailService } from '#services/email/actor_email_service'
import logger from '@adonisjs/core/services/logger'

/**
 * Listener pour l'envoi de l'email de retrait de producteur d'une OPA
 */
export default class SendProducerRemovedEmail {
  async handle(payload: ProducerRemovedFromOpaPayload) {
    try {
      logger.info(
        `📧 [Background] Envoi email de retrait de producteur ${payload.producerName} de l'OPA ${payload.opaName}`
      )

      const success = await ActorEmailService.sendProducerRemovedFromOpaEmail(
        payload.opaId,
        payload.opaName,
        payload.producerName
      )

      if (success) {
        logger.info(
          `✅ [Background] Email de retrait de producteur envoyé avec succès pour l'OPA ${payload.opaName}`
        )
      } else {
        logger.error(
          `❌ [Background] Échec envoi email de retrait de producteur pour l'OPA ${payload.opaName}`
        )
      }
    } catch (error) {
      logger.error(
        `❌ [Background] Erreur envoi email de retrait de producteur pour l'OPA ${payload.opaName}:`,
        error
      )
    }
  }
}
