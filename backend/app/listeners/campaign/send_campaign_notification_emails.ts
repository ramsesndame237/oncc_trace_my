import type { CampaignActivatedPayload } from '#events/campaign/campaign_activated'
import User from '#models/user'
import { CampaignEmailService } from '#services/email/campaign_email_service'
import logger from '@adonisjs/core/services/logger'

/**
 * Listener pour envoyer des emails de notification lors de l'activation d'une campagne
 * Ce listener s'exécute de manière asynchrone sans bloquer la réponse HTTP
 */
export default class SendCampaignNotificationEmails {
  async handle(payload: CampaignActivatedPayload) {
    const startTime = Date.now()

    try {
      logger.info(
        `📧 [Background] Démarrage de l'envoi des notifications pour la campagne ${payload.campaign.code}`
      )

      // Récupérer tous les utilisateurs actifs
      const activeUsers = await User.query()
        .where('status', 'active')
        .select('email', 'givenName', 'familyName')

      if (activeUsers.length === 0) {
        logger.warn("⚠️ Aucun utilisateur actif trouvé pour l'envoi de notifications")
        return
      }

      // Préparer les informations de la campagne pour l'email
      const campaignInfo = {
        code: payload.campaign.code,
        startDate: payload.campaign.startDate?.toFormat('dd/MM/yyyy') || '',
        endDate: payload.campaign.endDate?.toFormat('dd/MM/yyyy') || '',
      }

      // Envoyer les emails en parallèle
      const emailPromises = activeUsers.map(async (user) => {
        const userName = `${user.givenName || ''} ${user.familyName || ''}`.trim() || 'Utilisateur'

        try {
          const success = await CampaignEmailService.sendCampaignActivatedEmail(
            user.email,
            userName,
            campaignInfo,
            payload.activatedBy.fullName
          )

          if (success) {
            logger.info(`✅ Email envoyé à ${user.email}`)
          } else {
            logger.warn(`⚠️ Échec d'envoi à ${user.email}`)
          }

          return success
        } catch (error) {
          logger.error(`❌ Erreur lors de l'envoi à ${user.email}:`, error)
          return false
        }
      })

      // Attendre que tous les emails soient envoyés
      const results = await Promise.allSettled(emailPromises)

      // Compter les succès et échecs
      const successCount = results.filter(
        (r) => r.status === 'fulfilled' && r.value === true
      ).length
      const failCount = results.length - successCount

      const duration = Date.now() - startTime

      logger.info(
        `✅ [Background] Notifications de campagne terminées en ${duration}ms - Succès: ${successCount}/${activeUsers.length}, Échecs: ${failCount}`
      )
    } catch (error) {
      logger.error(`❌ [Background] Erreur lors de l'envoi des notifications de campagne:`, error)
    }
  }
}
