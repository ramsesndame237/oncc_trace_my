import type { StandardTransferCreatedPayload } from '#events/product_transfer/standard_transfer_created'
import { ProductTransferEmailService } from '#services/email/product_transfer_email_service'
import logger from '@adonisjs/core/services/logger'

/**
 * Listener pour l'envoi des emails de notification de création de transfert STANDARD
 * Envoie des emails au sender ET au receiver
 */
export default class SendStandardTransferCreatedNotification {
  async handle(payload: StandardTransferCreatedPayload) {
    try {
      logger.info(
        `📧 [Background] Envoi emails de transfert standard ${payload.transferCode}`
      )

      const success = await ProductTransferEmailService.sendStandardTransferCreatedNotifications(
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
        payload.driverInfo
      )

      if (success) {
        logger.info(
          `✅ [Background] Emails de transfert standard envoyés avec succès pour ${payload.transferCode}`
        )
      } else {
        logger.error(
          `❌ [Background] Échec envoi emails de transfert standard pour ${payload.transferCode}`
        )
      }
    } catch (error) {
      logger.error(
        `❌ [Background] Erreur envoi emails de transfert standard pour ${payload.transferCode}:`,
        error
      )
    }
  }
}
