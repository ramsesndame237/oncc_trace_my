import type { StandardTransferCancelledPayload } from '#events/product_transfer/standard_transfer_cancelled'
import { ProductTransferEmailService } from '#services/email/product_transfer_email_service'
import logger from '@adonisjs/core/services/logger'

/**
 * Listener pour l'envoi des emails de notification d'annulation de transfert STANDARD
 * Envoie des emails au sender ET au receiver
 */
export default class SendStandardTransferCancelledNotification {
  async handle(payload: StandardTransferCancelledPayload) {
    try {
      logger.info(
        `📧 [Background] Envoi emails d'annulation de transfert standard ${payload.transferCode}`
      )

      const success =
        await ProductTransferEmailService.sendStandardTransferCancelledNotifications(
          payload.transferCode,
          payload.transferDate,
          payload.senderActorId,
          payload.senderActorName,
          payload.senderStoreName,
          payload.receiverActorId,
          payload.receiverActorName,
          payload.receiverStoreName,
          payload.campaignCode,
          payload.products,
          payload.driverInfo,
          payload.cancellationReason
        )

      if (success) {
        logger.info(
          `✅ [Background] Emails d'annulation de transfert standard envoyés avec succès pour ${payload.transferCode}`
        )
      } else {
        logger.error(
          `❌ [Background] Échec envoi emails d'annulation de transfert standard pour ${payload.transferCode}`
        )
      }
    } catch (error) {
      logger.error(
        `❌ [Background] Erreur envoi emails d'annulation de transfert standard pour ${payload.transferCode}:`,
        error
      )
    }
  }
}
