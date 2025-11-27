import type { StoreActivatedPayload } from '#events/stores/store_activated'
import Store from '#models/store'
import User from '#models/user'
import { StoreEmailService } from '#services/email/store_email_service'
import logger from '@adonisjs/core/services/logger'

/**
 * Listener pour l'activation d'un magasin
 * Envoie un email à tous les actor managers des occupants du magasin
 */
export default class SendStoreActivatedNotifications {
  async handle(payload: StoreActivatedPayload) {
    try {
      logger.info(`📧 [Background] Envoi notifications activation magasin ${payload.store.name}`)

      // Récupérer le magasin avec ses occupants
      const store = await Store.query()
        .where('id', payload.store.id)
        .preload('occupants')
        .firstOrFail()

      if (store.occupants.length === 0) {
        logger.info(
          `ℹ️  [Background] Aucun occupant pour le magasin ${payload.store.name} - pas d'email envoyé`
        )
        return
      }

      // Récupérer tous les actor managers de tous les occupants
      const actorIds = store.occupants.map((occupant) => occupant.id)
      const actorManagers = await User.query()
        .where('role', 'actor_manager')
        .whereIn('actor_id', actorIds)
        .select('email', 'given_name', 'family_name', 'actor_id')

      if (actorManagers.length === 0) {
        logger.info(
          `ℹ️  [Background] Aucun actor manager trouvé pour les occupants du magasin ${payload.store.name}`
        )
        return
      }

      logger.info(
        `📧 [Background] Envoi de ${actorManagers.length} email(s) aux actor managers du magasin ${payload.store.name}`
      )

      // Envoyer les emails en parallèle
      const emailPromises = actorManagers.map(async (manager) => {
        const managerName = `${manager.givenName || ''} ${manager.familyName || ''}`.trim()
        const occupant = store.occupants.find((occ) => occ.id === manager.actorId)
        const occupantName = occupant
          ? `${occupant.givenName || ''} ${occupant.familyName || ''}`.trim()
          : "l'acteur"

        return StoreEmailService.sendStoreActivatedEmail(
          manager.email,
          managerName,
          {
            name: payload.store.name,
            code: payload.store.code || 'N/A',
            storeType: payload.store.storeType || 'N/A',
          },
          {
            code: payload.campaign.code,
            startDate: payload.campaign.startDate,
            endDate: payload.campaign.endDate,
          },
          occupantName,
          payload.activatedBy.fullName
        )
      })

      const results = await Promise.allSettled(emailPromises)

      // Compter les succès et échecs
      const successCount = results.filter((r) => r.status === 'fulfilled').length
      const failureCount = results.filter((r) => r.status === 'rejected').length

      logger.info(
        `✅ [Background] Notifications activation magasin envoyées: ${successCount} succès, ${failureCount} échecs`
      )
    } catch (error) {
      logger.error(
        `❌ [Background] Erreur envoi notifications activation magasin ${payload.store.name}:`,
        error
      )
    }
  }
}
