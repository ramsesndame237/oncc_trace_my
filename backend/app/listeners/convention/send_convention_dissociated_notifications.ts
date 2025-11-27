import type { ConventionDissociatedFromCampaignPayload } from '#events/convention/convention_dissociated_from_campaign'
import User from '#models/user'
import { ConventionEmailService } from '#services/email/convention_email_service'
import logger from '@adonisjs/core/services/logger'

/**
 * Listener pour notifier les acteurs concernés lors de la dissociation d'une convention d'une campagne
 */
export default class SendConventionDissociatedNotifications {
  async handle(payload: ConventionDissociatedFromCampaignPayload) {
    try {
      logger.info(
        `📧 [Background] Envoi notifications dissociation convention ${payload.convention.code} de campagne ${payload.campaign.code}`
      )

      const emailPromises: Promise<any>[] = []

      // 1. Notifier les utilisateurs de l'acheteur/exportateur
      const buyerExporterManagers = await User.query()
        .where('actor_id', payload.buyerExporter.id)
        .where('status', 'active')
        .select('email', 'given_name', 'family_name')

      if (buyerExporterManagers.length > 0) {
        logger.info(
          `📧 [Background] Envoi de ${buyerExporterManagers.length} email(s) aux utilisateurs de ${payload.buyerExporter.fullName}`
        )

        for (const manager of buyerExporterManagers) {
          const managerName = `${manager.givenName || ''} ${manager.familyName || ''}`.trim()

          emailPromises.push(
            ConventionEmailService.sendConventionDissociatedFromCampaignNotification(
              manager.email,
              managerName,
              {
                code: payload.convention.code,
                signatureDate: payload.convention.signatureDate,
              },
              {
                code: payload.campaign.code,
                startDate: payload.campaign.startDate,
                endDate: payload.campaign.endDate,
              },
              {
                name: payload.producers.fullName,
                type: 'OPA',
              },
              payload.dissociatedBy.fullName
            )
          )
        }
      }

      // 2. Notifier les utilisateurs de l'OPA
      const producersManagers = await User.query()
        .where('actor_id', payload.producers.id)
        .where('status', 'active')
        .select('email', 'given_name', 'family_name')

      if (producersManagers.length > 0) {
        logger.info(
          `📧 [Background] Envoi de ${producersManagers.length} email(s) aux utilisateurs de ${payload.producers.fullName}`
        )

        for (const manager of producersManagers) {
          const managerName = `${manager.givenName || ''} ${manager.familyName || ''}`.trim()

          emailPromises.push(
            ConventionEmailService.sendConventionDissociatedFromCampaignNotification(
              manager.email,
              managerName,
              {
                code: payload.convention.code,
                signatureDate: payload.convention.signatureDate,
              },
              {
                code: payload.campaign.code,
                startDate: payload.campaign.startDate,
                endDate: payload.campaign.endDate,
              },
              {
                name: payload.buyerExporter.fullName,
                type: payload.buyerExporter.actorType,
              },
              payload.dissociatedBy.fullName
            )
          )
        }
      }

      // Envoyer tous les emails en parallèle
      const results = await Promise.allSettled(emailPromises)

      const successCount = results.filter((r) => r.status === 'fulfilled').length
      const failureCount = results.filter((r) => r.status === 'rejected').length

      logger.info(
        `✅ [Background] Notifications dissociation convention ${payload.convention.code} de campagne ${payload.campaign.code} envoyées: ${successCount} succès, ${failureCount} échecs`
      )
    } catch (error) {
      logger.error(
        `❌ [Background] Erreur envoi notifications dissociation convention ${payload.convention.code} de campagne ${payload.campaign.code}:`,
        error
      )
    }
  }
}
