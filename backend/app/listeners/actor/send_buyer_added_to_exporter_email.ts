import type { BuyerAddedToExporterPayload } from '#events/actor/buyer_added_to_exporter'
import { ActorEmailService } from '#services/email/actor_email_service'
import logger from '@adonisjs/core/services/logger'

/**
 * Listener pour l'envoi de l'email d'ajout de mandataire à un exportateur
 */
export default class SendBuyerAddedToExporterEmail {
  async handle(payload: BuyerAddedToExporterPayload) {
    try {
      logger.info(
        `📧 [Background] Envoi email d'ajout de mandataire ${payload.buyerName} à l'exportateur ${payload.exporterName}`
      )

      const success = await ActorEmailService.sendBuyerAddedToExporterEmail(
        payload.exporterId,
        payload.exporterName,
        payload.buyerName
      )

      if (success) {
        logger.info(
          `✅ [Background] Email d'ajout de mandataire envoyé avec succès pour l'exportateur ${payload.exporterName}`
        )
      } else {
        logger.error(
          `❌ [Background] Échec envoi email d'ajout de mandataire pour l'exportateur ${payload.exporterName}`
        )
      }
    } catch (error) {
      logger.error(
        `❌ [Background] Erreur envoi email d'ajout de mandataire pour l'exportateur ${payload.exporterName}:`,
        error
      )
    }
  }
}
