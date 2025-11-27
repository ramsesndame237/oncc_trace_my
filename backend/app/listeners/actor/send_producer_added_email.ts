import type { ProducerAddedToOpaPayload } from '#events/actor/producer_added_to_opa'
import { ActorEmailService } from '#services/email/actor_email_service'
import logger from '@adonisjs/core/services/logger'

/**
 * Listener pour l'envoi de l'email d'ajout de producteur à une OPA
 */
export default class SendProducerAddedEmail {
  async handle(payload: ProducerAddedToOpaPayload) {
    try {
      logger.info(
        `📧 [Background] Envoi email d'ajout de producteur ${payload.producerName} à l'OPA ${payload.opaName}`
      )

      const success = await ActorEmailService.sendProducerAddedToOpaEmail(
        payload.opaId,
        payload.opaName,
        payload.producerName
      )

      if (success) {
        logger.info(
          `✅ [Background] Email d'ajout de producteur envoyé avec succès pour l'OPA ${payload.opaName}`
        )
      } else {
        logger.error(
          `❌ [Background] Échec envoi email d'ajout de producteur pour l'OPA ${payload.opaName}`
        )
      }
    } catch (error) {
      logger.error(
        `❌ [Background] Erreur envoi email d'ajout de producteur pour l'OPA ${payload.opaName}:`,
        error
      )
    }
  }
}
