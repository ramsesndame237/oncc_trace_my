import type { ConventionUpdatedPayload } from '#events/convention/convention_updated'
import User from '#models/user'
import { ConventionEmailService } from '#services/email/convention_email_service'
import logger from '@adonisjs/core/services/logger'

/**
 * Listener pour notifier les acteurs concernés lors de la modification d'une convention
 */
export default class SendConventionUpdatedNotifications {
  async handle(payload: ConventionUpdatedPayload) {
    try {
      logger.info(
        `📧 [Background] Envoi notifications modification convention ${payload.convention.code}`
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
            ConventionEmailService.sendConventionUpdatedNotification(
              manager.email,
              managerName,
              {
                code: payload.convention.code,
                signatureDate: payload.convention.signatureDate,
                products: payload.convention.products,
              },
              payload.changes,
              {
                name: payload.producers.fullName,
                type: 'OPA',
              },
              payload.updatedBy.fullName
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
            ConventionEmailService.sendConventionUpdatedNotification(
              manager.email,
              managerName,
              {
                code: payload.convention.code,
                signatureDate: payload.convention.signatureDate,
                products: payload.convention.products,
              },
              payload.changes,
              {
                name: payload.buyerExporter.fullName,
                type: payload.buyerExporter.actorType,
              },
              payload.updatedBy.fullName
            )
          )
        }
      }

      // Envoyer tous les emails en parallèle
      const results = await Promise.allSettled(emailPromises)

      const successCount = results.filter((r) => r.status === 'fulfilled').length
      const failureCount = results.filter((r) => r.status === 'rejected').length

      logger.info(
        `✅ [Background] Notifications modification convention ${payload.convention.code} envoyées: ${successCount} succès, ${failureCount} échecs`
      )
    } catch (error) {
      logger.error(
        `❌ [Background] Erreur envoi notifications modification convention ${payload.convention.code}:`,
        error
      )
    }
  }
}
