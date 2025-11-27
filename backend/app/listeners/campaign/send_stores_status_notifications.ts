import type { StoresStatusPayload } from '#events/campaign/stores_status'
import User from '#models/user'
import { CampaignEmailService } from '#services/email/campaign_email_service'
import logger from '@adonisjs/core/services/logger'

/**
 * Listener pour la notification du statut des magasins d'une campagne
 * Envoie un email à tous les basin admins si des magasins ne sont pas associés
 */
export default class SendStoresStatusNotifications {
  async handle(payload: StoresStatusPayload) {
    try {
      logger.info(
        `📧 [Background] Vérification statut magasins campagne ${payload.campaign.code}: ${payload.inactiveStores} non associé(s)`
      )

      // Récupérer tous les basin admins
      const basinAdmins = await User.query()
        .where('role', 'basin_admin')
        .where('status', 'active')
        .select('email', 'given_name', 'family_name')

      if (basinAdmins.length === 0) {
        logger.info(`ℹ️  [Background] Aucun basin admin trouvé pour la notification`)
        return
      }

      logger.info(
        `📧 [Background] Envoi de ${basinAdmins.length} email(s) aux basin admins pour la campagne ${payload.campaign.code}`
      )

      // Envoyer les emails en parallèle
      const emailPromises = basinAdmins.map(async (admin) => {
        const adminName = `${admin.givenName || ''} ${admin.familyName || ''}`.trim()

        return CampaignEmailService.sendStoresStatusEmail(
          admin.email,
          adminName,
          {
            code: payload.campaign.code,
            startDate: payload.campaign.startDate,
            endDate: payload.campaign.endDate,
          },
          {
            totalStores: payload.totalStores,
            activeStores: payload.activeStores,
            inactiveStores: payload.inactiveStores,
          },
          payload.activatedBy.fullName
        )
      })

      const results = await Promise.allSettled(emailPromises)

      // Compter les succès et échecs
      const successCount = results.filter((r) => r.status === 'fulfilled').length
      const failureCount = results.filter((r) => r.status === 'rejected').length

      logger.info(
        `✅ [Background] Notifications statut magasins envoyées: ${successCount} succès, ${failureCount} échecs`
      )
    } catch (error) {
      logger.error(
        `❌ [Background] Erreur envoi notifications statut magasins campagne ${payload.campaign.code}:`,
        error
      )
    }
  }
}
