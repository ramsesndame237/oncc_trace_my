import type { GroupageTransferCreatedPayload } from '#events/product_transfer/groupage_transfer_created'
import { ProductTransferEmailService } from '#services/email/product_transfer_email_service'
import logger from '@adonisjs/core/services/logger'

/**
 * Listener pour l'envoi de l'email de notification de création de transfert GROUPAGE
 */
export default class SendGroupageTransferCreatedNotification {
  async handle(payload: GroupageTransferCreatedPayload) {
    try {
      logger.info(
        `📧 [Background] Envoi email de transfert groupage ${payload.transferCode} vers OPA ${payload.receiverActorName}`
      )

      const success = await ProductTransferEmailService.sendGroupageTransferCreatedNotification(
        payload.transferCode,
        payload.transferDate,
        payload.senderActorName,
        payload.receiverActorId,
        payload.receiverActorName,
        payload.receiverStoreName,
        payload.campaignCode,
        payload.products
      )

      if (success) {
        logger.info(
          `✅ [Background] Email de transfert groupage envoyé avec succès pour ${payload.transferCode}`
        )
      } else {
        logger.error(
          `❌ [Background] Échec envoi email de transfert groupage pour ${payload.transferCode}`
        )
      }
    } catch (error) {
      logger.error(
        `❌ [Background] Erreur envoi email de transfert groupage pour ${payload.transferCode}:`,
        error
      )
    }
  }
}
