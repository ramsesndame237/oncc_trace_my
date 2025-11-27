import type { OpaConventionsStatusPayload } from '#events/campaign/opa_conventions_status'
import User from '#models/user'
import { CampaignEmailService } from '#services/email/campaign_email_service'
import logger from '@adonisjs/core/services/logger'

/**
 * Listener pour notifier les utilisateurs d'un OPA du statut de leurs conventions
 * lors de l'activation d'une campagne
 */
export default class SendOpaConventionsStatusNotifications {
  async handle(payload: OpaConventionsStatusPayload) {
    try {
      logger.info(
        `📧 [Background] Envoi notifications statut conventions OPA ${payload.opa.fullName} pour campagne ${payload.campaign.code}`
      )

      // Récupérer tous les utilisateurs actifs de cet OPA
      const opaUsers = await User.query()
        .where('actor_id', payload.opa.id)
        .where('status', 'active')
        .select('email', 'given_name', 'family_name')

      if (opaUsers.length === 0) {
        logger.info(
          `📧 [Background] Aucun utilisateur actif trouvé pour l'OPA ${payload.opa.fullName}`
        )
        return
      }

      logger.info(
        `📧 [Background] Envoi de ${opaUsers.length} email(s) aux utilisateurs de ${payload.opa.fullName}`
      )

      // Envoyer les emails en parallèle
      const emailPromises = opaUsers.map(async (user) => {
        const userName = `${user.givenName || ''} ${user.familyName || ''}`.trim()

        return CampaignEmailService.sendOpaConventionsStatusEmail(
          user.email,
          userName,
          {
            code: payload.campaign.code,
            startDate: payload.campaign.startDate,
            endDate: payload.campaign.endDate,
          },
          payload.opa.fullName,
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
        `✅ [Background] Notifications statut conventions OPA ${payload.opa.fullName} envoyées: ${successCount} succès, ${failureCount} échecs`
      )
    } catch (error) {
      logger.error(
        `❌ [Background] Erreur envoi notifications statut conventions OPA ${payload.opa.fullName}:`,
        error
      )
    }
  }
}
