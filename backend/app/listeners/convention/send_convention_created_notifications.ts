import type { ConventionCreatedPayload } from '#events/convention/convention_created'
import User from '#models/user'
import { ConventionEmailService } from '#services/email/convention_email_service'
import logger from '@adonisjs/core/services/logger'

/**
 * Listener pour notifier tous les acteurs concernés lors de la création d'une convention
 */
export default class SendConventionCreatedNotifications {
  async handle(payload: ConventionCreatedPayload) {
    try {
      logger.info(
        `📧 [Background] Envoi notifications création convention ${payload.convention.code}`
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
            ConventionEmailService.sendConventionCreatedNotification(
              manager.email,
              managerName,
              {
                code: payload.convention.code,
                signatureDate: payload.convention.signatureDate,
                products: payload.convention.products,
              },
              {
                name: payload.producers.fullName,
                type: 'OPA',
              },
              payload.createdBy.fullName
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

        // Déterminer si la création a été faite par un utilisateur de l'OPA
        const isCreatedByOpa = payload.createdBy.actorId === payload.producers.id

        for (const manager of producersManagers) {
          const managerName = `${manager.givenName || ''} ${manager.familyName || ''}`.trim()

          if (isCreatedByOpa) {
            // Si créé par l'OPA, envoyer un email de résumé
            emailPromises.push(
              ConventionEmailService.sendConventionCreatedSummary(
                manager.email,
                managerName,
                {
                  code: payload.convention.code,
                  signatureDate: payload.convention.signatureDate,
                  products: payload.convention.products,
                },
                {
                  name: payload.buyerExporter.fullName,
                  type: payload.buyerExporter.actorType,
                }
              )
            )
          } else {
            // Sinon, envoyer un email de notification détaillé
            emailPromises.push(
              ConventionEmailService.sendConventionCreatedNotification(
                manager.email,
                managerName,
                {
                  code: payload.convention.code,
                  signatureDate: payload.convention.signatureDate,
                  products: payload.convention.products,
                },
                {
                  name: payload.buyerExporter.fullName,
                  type: payload.buyerExporter.actorType,
                },
                payload.createdBy.fullName
              )
            )
          }
        }
      }

      // Envoyer tous les emails en parallèle
      const results = await Promise.allSettled(emailPromises)

      const successCount = results.filter((r) => r.status === 'fulfilled').length
      const failureCount = results.filter((r) => r.status === 'rejected').length

      logger.info(
        `✅ [Background] Notifications convention ${payload.convention.code} envoyées: ${successCount} succès, ${failureCount} échecs`
      )
    } catch (error) {
      logger.error(
        `❌ [Background] Erreur envoi notifications convention ${payload.convention.code}:`,
        error
      )
    }
  }
}
