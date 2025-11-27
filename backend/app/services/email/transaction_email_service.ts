import User from '#models/user'
import { BaseEmailService } from '#services/email/base_email_service'
import logger from '@adonisjs/core/services/logger'
import mail from '@adonisjs/mail/services/main'

/**
 * Service pour tous les emails de notification de transactions
 */
export class TransactionEmailService extends BaseEmailService {
  /**
   * Envoie des emails de notification de transaction validée au vendeur ET à l'acheteur
   * Inclut une section de demande de déclaration inverse pour la contrepartie
   */
  static async sendTransactionValidatedNotifications(
    transactionCode: string,
    transactionType: 'SALE' | 'PURCHASE',
    transactionDate: string,
    sellerId: string,
    sellerName: string,
    buyerId: string,
    buyerName: string,
    campaignCode: string,
    locationType: 'MARKET' | 'CONVENTION' | 'OUTSIDE_MARKET',
    locationName: string | undefined,
    products: Array<{
      productType: string
      quality: string
      weight: number
      numberOfBags: number
      unitPrice: number
      totalPrice: number
    }>,
    totalAmount: number
  ): Promise<boolean> {
    try {
      const config = this.getEmailConfig()

      // Récupérer les utilisateurs du vendeur
      const sellerUsers = await User.query()
        .where('actor_id', sellerId)
        .where('role', 'actor_manager')
        .whereNull('deleted_at')
        .exec()

      // Récupérer les utilisateurs de l'acheteur
      const buyerUsers = await User.query()
        .where('actor_id', buyerId)
        .where('role', 'actor_manager')
        .whereNull('deleted_at')
        .exec()

      logger.info(
        `📧 Envoi emails transaction validée à ${sellerUsers.length} vendeur(s) et ${buyerUsers.length} acheteur(s)`
      )

      // Préparer les données communes
      const emailData = {
        transactionCode,
        transactionType,
        transactionDate,
        campaignCode,
        locationType,
        locationName,
        products,
        totalAmount,
        appUrl: config.frontendUrl,
        appName: config.appName,
        supportEmail: config.supportEmail,
        supportPhone: config.supportPhone,
        year: config.year,
      }

      // Envoyer email aux vendeurs
      for (const user of sellerUsers) {
        // Le vendeur a créé une SALE => il confirme, l'acheteur doit créer PURCHASE
        // Le vendeur reçoit une PURCHASE de l'acheteur => il doit créer SALE
        const needsReverseDeclaration = transactionType === 'PURCHASE'

        await mail.send((message) => {
          message
            .to(user.email)
            .from(config.fromEmail, config.fromName)
            .subject(`Transaction validée - ${config.appName}`)
            .htmlView('emails/transaction/transaction_validated_seller', {
              userName: `${user.givenName} ${user.familyName}`,
              counterpartName: buyerName,
              needsReverseDeclaration,
              ...emailData,
            })
        })
      }

      // Envoyer email aux acheteurs
      for (const user of buyerUsers) {
        // L'acheteur reçoit une SALE du vendeur => il doit créer PURCHASE
        // L'acheteur a créé une PURCHASE => il confirme, le vendeur doit créer SALE
        const needsReverseDeclaration = transactionType === 'SALE'

        await mail.send((message) => {
          message
            .to(user.email)
            .from(config.fromEmail, config.fromName)
            .subject(`Transaction validée - ${config.appName}`)
            .htmlView('emails/transaction/transaction_validated_buyer', {
              userName: `${user.givenName} ${user.familyName}`,
              counterpartName: sellerName,
              needsReverseDeclaration,
              ...emailData,
            })
        })
      }

      logger.info(
        `✅ Emails de transaction validée envoyés à ${sellerUsers.length + buyerUsers.length} destinataire(s)`
      )

      return true
    } catch (error) {
      logger.error("Erreur lors de l'envoi des emails de transaction validée:", error)
      return false
    }
  }

  /**
   * Envoie un email de notification de transaction annulée
   * Informe le créateur de la transaction (vendeur pour SALE, acheteur pour PURCHASE)
   * Inclut une invitation à créer une nouvelle transaction si aucune transaction complémentaire n'existe
   */
  static async sendTransactionCancelledNotification(
    transactionCode: string,
    transactionType: 'SALE' | 'PURCHASE',
    transactionDate: string,
    sellerId: string,
    sellerName: string,
    buyerId: string,
    buyerName: string,
    campaignCode: string,
    locationType: 'MARKET' | 'CONVENTION' | 'OUTSIDE_MARKET',
    locationName: string | undefined,
    products: Array<{
      productType: string
      quality: string
      weight: number
      numberOfBags: number
      unitPrice: number
      totalPrice: number
    }>,
    totalAmount: number,
    cancellationReason: string | undefined,
    hasComplementaryTransaction: boolean
  ): Promise<boolean> {
    try {
      const config = this.getEmailConfig()

      // Déterminer qui doit recevoir l'email selon le type de transaction
      // SALE => informer le vendeur (créateur)
      // PURCHASE => informer l'acheteur (créateur)
      const targetActorId = transactionType === 'SALE' ? sellerId : buyerId
      const counterpartName = transactionType === 'SALE' ? buyerName : sellerName

      // Récupérer les utilisateurs de l'acteur cible
      const targetUsers = await User.query()
        .where('actor_id', targetActorId)
        .where('role', 'actor_manager')
        .whereNull('deleted_at')
        .exec()

      logger.info(
        `📧 Envoi email transaction annulée à ${targetUsers.length} utilisateur(s) (${transactionType})`
      )

      // Préparer les données communes
      const emailData = {
        transactionCode,
        transactionType,
        transactionDate,
        campaignCode,
        locationType,
        locationName,
        products,
        totalAmount,
        cancellationReason,
        hasComplementaryTransaction,
        appUrl: config.frontendUrl,
        appName: config.appName,
        supportEmail: config.supportEmail,
        supportPhone: config.supportPhone,
        year: config.year,
      }

      // Choisir le template selon le type de transaction
      const template =
        transactionType === 'SALE'
          ? 'emails/transaction/transaction_cancelled_seller'
          : 'emails/transaction/transaction_cancelled_buyer'

      // Envoyer email aux utilisateurs concernés
      for (const user of targetUsers) {
        await mail.send((message) => {
          message
            .to(user.email)
            .from(config.fromEmail, config.fromName)
            .subject(`Transaction annulée - ${config.appName}`)
            .htmlView(template, {
              userName: `${user.givenName} ${user.familyName}`,
              counterpartName,
              ...emailData,
            })
        })
      }

      logger.info(`✅ Emails de transaction annulée envoyés à ${targetUsers.length} destinataire(s)`)

      return true
    } catch (error) {
      logger.error("Erreur lors de l'envoi des emails de transaction annulée:", error)
      return false
    }
  }
}
