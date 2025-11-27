import type { OccupantAssignedPayload } from '#events/stores/occupant_assigned'
import User from '#models/user'
import { StoreEmailService } from '#services/email/store_email_service'
import logger from '@adonisjs/core/services/logger'

/**
 * Listener pour l'affectation d'un occupant à un magasin
 * Envoie un email à tous les actor managers de l'acteur affecté
 */
export default class SendOccupantAssignedNotifications {
  async handle(payload: OccupantAssignedPayload) {
    try {
      logger.info(
        `📧 [Background] Envoi notifications affectation occupant ${payload.actor.fullName} au magasin ${payload.store.name}`
      )

      // Récupérer tous les actor managers de l'acteur
      const actorManagers = await User.query()
        .where('role', 'actor_manager')
        .where('actor_id', payload.actor.id)
        .select('email', 'given_name', 'family_name')

      if (actorManagers.length === 0) {
        logger.info(
          `ℹ️  [Background] Aucun actor manager trouvé pour l'acteur ${payload.actor.fullName}`
        )
        return
      }

      logger.info(
        `📧 [Background] Envoi de ${actorManagers.length} email(s) aux actor managers de ${payload.actor.fullName}`
      )

      // Envoyer les emails en parallèle
      const emailPromises = actorManagers.map(async (manager) => {
        const managerName = `${manager.givenName || ''} ${manager.familyName || ''}`.trim()

        return StoreEmailService.sendOccupantAssignedEmail(
          manager.email,
          managerName,
          {
            fullName: payload.actor.fullName,
            actorType: payload.actor.actorType,
          },
          {
            name: payload.store.name,
            code: payload.store.code || 'N/A',
          },
          payload.assignedBy.fullName
        )
      })

      const results = await Promise.allSettled(emailPromises)

      // Compter les succès et échecs
      const successCount = results.filter((r) => r.status === 'fulfilled').length
      const failureCount = results.filter((r) => r.status === 'rejected').length

      logger.info(
        `✅ [Background] Notifications affectation occupant envoyées: ${successCount} succès, ${failureCount} échecs`
      )
    } catch (error) {
      logger.error(
        `❌ [Background] Erreur envoi notifications affectation occupant ${payload.actor.fullName}:`,
        error
      )
    }
  }
}
