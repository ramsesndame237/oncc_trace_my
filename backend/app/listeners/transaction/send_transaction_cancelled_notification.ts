import type { TransactionCancelledPayload } from '#events/transaction/transaction_cancelled'
import { TransactionEmailService } from '#services/email/transaction_email_service'
import logger from '@adonisjs/core/services/logger'

/**
 * Listener pour l'envoi des emails de notification de transaction annulée
 * Envoie un email au créateur de la transaction (vendeur pour SALE, acheteur pour PURCHASE)
 */
export default class SendTransactionCancelledNotification {
  async handle(payload: TransactionCancelledPayload) {
    try {
      logger.info(
        `📧 [Background] Envoi email de transaction annulée ${payload.transactionCode}`
      )

      const success = await TransactionEmailService.sendTransactionCancelledNotification(
        payload.transactionCode,
        payload.transactionType,
        payload.transactionDate,
        payload.sellerId,
        payload.sellerName,
        payload.buyerId,
        payload.buyerName,
        payload.campaignCode,
        payload.locationType,
        payload.locationName,
        payload.products,
        payload.totalAmount,
        payload.cancellationReason,
        payload.hasComplementaryTransaction
      )

      if (success) {
        logger.info(
          `✅ [Background] Email de transaction annulée envoyé avec succès pour ${payload.transactionCode}`
        )
      } else {
        logger.error(
          `❌ [Background] Échec envoi email de transaction annulée pour ${payload.transactionCode}`
        )
      }
    } catch (error) {
      logger.error(
        `❌ [Background] Erreur envoi email de transaction annulée pour ${payload.transactionCode}:`,
        error
      )
    }
  }
}
