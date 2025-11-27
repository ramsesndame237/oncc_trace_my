import type { BuyerUnassignedAsMandatairePayload } from '#events/actor/buyer_unassigned_as_mandataire'
import { ActorEmailService } from '#services/email/actor_email_service'
import logger from '@adonisjs/core/services/logger'

/**
 * Listener pour l'envoi de l'email de retrait comme mandataire à l'acheteur
 */
export default class SendBuyerUnassignedAsMandataireEmail {
  async handle(payload: BuyerUnassignedAsMandatairePayload) {
    try {
      logger.info(
        `📧 [Background] Envoi email de retrait comme mandataire à ${payload.buyerName} pour l'exportateur ${payload.exporterName}`
      )

      const success = await ActorEmailService.sendBuyerUnassignedAsMandataireEmail(
        payload.buyerId,
        payload.buyerName,
        payload.exporterName
      )

      if (success) {
        logger.info(
          `✅ [Background] Email de retrait comme mandataire envoyé avec succès à ${payload.buyerName}`
        )
      } else {
        logger.error(
          `❌ [Background] Échec envoi email de retrait comme mandataire à ${payload.buyerName}`
        )
      }
    } catch (error) {
      logger.error(
        `❌ [Background] Erreur envoi email de retrait comme mandataire à ${payload.buyerName}:`,
        error
      )
    }
  }
}
