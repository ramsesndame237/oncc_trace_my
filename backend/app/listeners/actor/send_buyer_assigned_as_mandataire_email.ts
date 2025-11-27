import type { BuyerAssignedAsMandatairePayload } from '#events/actor/buyer_assigned_as_mandataire'
import { ActorEmailService } from '#services/email/actor_email_service'
import logger from '@adonisjs/core/services/logger'

/**
 * Listener pour l'envoi de l'email d'affectation comme mandataire à l'acheteur
 */
export default class SendBuyerAssignedAsMandataireEmail {
  async handle(payload: BuyerAssignedAsMandatairePayload) {
    try {
      logger.info(
        `📧 [Background] Envoi email d'affectation comme mandataire à ${payload.buyerName} pour l'exportateur ${payload.exporterName}`
      )

      const success = await ActorEmailService.sendBuyerAssignedAsMandataireEmail(
        payload.buyerId,
        payload.buyerName,
        payload.exporterName
      )

      if (success) {
        logger.info(
          `✅ [Background] Email d'affectation comme mandataire envoyé avec succès à ${payload.buyerName}`
        )
      } else {
        logger.error(
          `❌ [Background] Échec envoi email d'affectation comme mandataire à ${payload.buyerName}`
        )
      }
    } catch (error) {
      logger.error(
        `❌ [Background] Erreur envoi email d'affectation comme mandataire à ${payload.buyerName}:`,
        error
      )
    }
  }
}
