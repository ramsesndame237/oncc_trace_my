import type { TransactionValidatedPayload } from '#events/transaction/transaction_validated'
import { TransactionEmailService } from '#services/email/transaction_email_service'
import logger from '@adonisjs/core/services/logger'

/**
 * Listener pour l'envoi des emails de notification de transaction validée
 * Envoie des emails au vendeur ET à l'acheteur
 */
export default class SendTransactionValidatedNotifications {
  async handle(payload: TransactionValidatedPayload) {
    try {
      logger.info(
        `📧 [Background] Envoi emails de transaction validée ${payload.transactionCode}`
      )

      const success = await TransactionEmailService.sendTransactionValidatedNotifications(
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
        payload.totalAmount
      )

      if (success) {
        logger.info(
          `✅ [Background] Emails de transaction validée envoyés avec succès pour ${payload.transactionCode}`
        )
      } else {
        logger.error(
          `❌ [Background] Échec envoi emails de transaction validée pour ${payload.transactionCode}`
        )
      }
    } catch (error) {
      logger.error(
        `❌ [Background] Erreur envoi emails de transaction validée pour ${payload.transactionCode}:`,
        error
      )
    }
  }
}
