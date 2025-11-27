import type { BuyerRemovedFromExporterPayload } from '#events/actor/buyer_removed_from_exporter'
import { ActorEmailService } from '#services/email/actor_email_service'
import logger from '@adonisjs/core/services/logger'

/**
 * Listener pour l'envoi de l'email de retrait de mandataire d'un exportateur
 */
export default class SendBuyerRemovedFromExporterEmail {
  async handle(payload: BuyerRemovedFromExporterPayload) {
    try {
      logger.info(
        `📧 [Background] Envoi email de retrait de mandataire ${payload.buyerName} de l'exportateur ${payload.exporterName}`
      )

      const success = await ActorEmailService.sendBuyerRemovedFromExporterEmail(
        payload.exporterId,
        payload.exporterName,
        payload.buyerName
      )

      if (success) {
        logger.info(
          `✅ [Background] Email de retrait de mandataire envoyé avec succès pour l'exportateur ${payload.exporterName}`
        )
      } else {
        logger.error(
          `❌ [Background] Échec envoi email de retrait de mandataire pour l'exportateur ${payload.exporterName}`
        )
      }
    } catch (error) {
      logger.error(
        `❌ [Background] Erreur envoi email de retrait de mandataire pour l'exportateur ${payload.exporterName}:`,
        error
      )
    }
  }
}
