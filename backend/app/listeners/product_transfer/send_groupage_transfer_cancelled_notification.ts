import type { GroupageTransferCancelledPayload } from '#events/product_transfer/groupage_transfer_cancelled'
import { ProductTransferEmailService } from '#services/email/product_transfer_email_service'
import logger from '@adonisjs/core/services/logger'

/**
 * Listener pour l'envoi de l'email de notification d'annulation de transfert GROUPAGE
 */
export default class SendGroupageTransferCancelledNotification {
  async handle(payload: GroupageTransferCancelledPayload) {
    try {
      logger.info(
        `📧 [Background] Envoi email d'annulation de transfert groupage ${payload.transferCode} vers OPA ${payload.receiverActorName}`
      )

      const success =
        await ProductTransferEmailService.sendGroupageTransferCancelledNotification(
          payload.transferCode,
          payload.transferDate,
          payload.senderActorName,
          payload.receiverActorId,
          payload.receiverActorName,
          payload.receiverStoreName,
          payload.campaignCode,
          payload.products,
          payload.cancellationReason
        )

      if (success) {
        logger.info(
          `✅ [Background] Email d'annulation de transfert groupage envoyé avec succès pour ${payload.transferCode}`
        )
      } else {
        logger.error(
          `❌ [Background] Échec envoi email d'annulation de transfert groupage pour ${payload.transferCode}`
        )
      }
    } catch (error) {
      logger.error(
        `❌ [Background] Erreur envoi email d'annulation de transfert groupage pour ${payload.transferCode}:`,
        error
      )
    }
  }
}
