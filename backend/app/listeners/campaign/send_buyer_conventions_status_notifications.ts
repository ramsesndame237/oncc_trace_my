import type { BuyerConventionsStatusPayload } from '#events/campaign/buyer_conventions_status'
import User from '#models/user'
import { CampaignEmailService } from '#services/email/campaign_email_service'
import logger from '@adonisjs/core/services/logger'

/**
 * Listener pour notifier les utilisateurs d'un acheteur/exportateur du statut de leurs conventions
 * lors de l'activation d'une campagne
 */
export default class SendBuyerConventionsStatusNotifications {
  async handle(payload: BuyerConventionsStatusPayload) {
    try {
      logger.info(
        `📧 [Background] Envoi notifications statut conventions acheteur/exportateur ${payload.buyer.fullName} pour campagne ${payload.campaign.code}`
      )

      // Récupérer tous les utilisateurs actifs de cet acheteur/exportateur
      const buyerUsers = await User.query()
        .where('actor_id', payload.buyer.id)
        .where('status', 'active')
        .select('email', 'given_name', 'family_name')

      if (buyerUsers.length === 0) {
        logger.info(
          `📧 [Background] Aucun utilisateur actif trouvé pour l'acheteur/exportateur ${payload.buyer.fullName}`
        )
        return
      }

      logger.info(
        `📧 [Background] Envoi de ${buyerUsers.length} email(s) aux utilisateurs de ${payload.buyer.fullName}`
      )

      // Envoyer les emails en parallèle
      const emailPromises = buyerUsers.map(async (user) => {
        const userName = `${user.givenName || ''} ${user.familyName || ''}`.trim()

        return CampaignEmailService.sendBuyerConventionsStatusEmail(
          user.email,
          userName,
          {
            code: payload.campaign.code,
            startDate: payload.campaign.startDate,
            endDate: payload.campaign.endDate,
          },
          payload.buyer.fullName,
          {
            totalConventions: payload.conventionsData.totalConventions,
            activeConventions: payload.conventionsData.activeConventions,
            inactiveConventions: payload.conventionsData.inactiveConventions,
          },
          payload.activatedBy.fullName
        )
      })

      const results = await Promise.allSettled(emailPromises)

      const successCount = results.filter((r) => r.status === 'fulfilled').length
      const failureCount = results.filter((r) => r.status === 'rejected').length

      logger.info(
        `✅ [Background] Notifications statut conventions acheteur/exportateur ${payload.buyer.fullName} envoyées: ${successCount} succès, ${failureCount} échecs`
      )
    } catch (error) {
      logger.error(
        `❌ [Background] Erreur envoi notifications statut conventions acheteur/exportateur ${payload.buyer.fullName}:`,
        error
      )
    }
  }
}
