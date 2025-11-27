import type { ConventionAssociatedToCampaignPayload } from '#events/convention/convention_associated_to_campaign'
import User from '#models/user'
import { ConventionEmailService } from '#services/email/convention_email_service'
import logger from '@adonisjs/core/services/logger'

/**
 * Listener pour notifier les acteurs concernés lors de l'association d'une convention à une campagne
 */
export default class SendConventionAssociatedNotifications {
  async handle(payload: ConventionAssociatedToCampaignPayload) {
    try {
      logger.info(
        `📧 [Background] Envoi notifications association convention ${payload.convention.code} à campagne ${payload.campaign.code}`
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
            ConventionEmailService.sendConventionAssociatedToCampaignNotification(
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
              payload.associatedBy.fullName
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
            ConventionEmailService.sendConventionAssociatedToCampaignNotification(
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
              payload.associatedBy.fullName
            )
          )
        }
      }

      // Envoyer tous les emails en parallèle
      const results = await Promise.allSettled(emailPromises)

      const successCount = results.filter((r) => r.status === 'fulfilled').length
      const failureCount = results.filter((r) => r.status === 'rejected').length

      logger.info(
        `✅ [Background] Notifications association convention ${payload.convention.code} à campagne ${payload.campaign.code} envoyées: ${successCount} succès, ${failureCount} échecs`
      )
    } catch (error) {
      logger.error(
        `❌ [Background] Erreur envoi notifications association convention ${payload.convention.code} à campagne ${payload.campaign.code}:`,
        error
      )
    }
  }
}
