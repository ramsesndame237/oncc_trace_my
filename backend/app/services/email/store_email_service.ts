import { BaseEmailService } from '#services/email/base_email_service'
import logger from '@adonisjs/core/services/logger'
import mail from '@adonisjs/mail/services/main'

/**
 * Service pour tous les emails de magasin
 */
export class StoreEmailService extends BaseEmailService {
  /**
   * Envoie un email de notification d'activation de magasin
   */
  static async sendStoreActivatedEmail(
    email: string,
    userName: string,
    store: { name: string; code: string; storeType: string },
    campaign: { code: string; startDate: string; endDate: string },
    occupantName: string,
    activatedBy: string
  ): Promise<boolean> {
    try {
      const config = this.getEmailConfig()

      await mail.send((message) => {
        message
          .to(email)
          .from(config.fromEmail, config.fromName)
          .subject(`Magasin activé - ${config.appName}`)
          .htmlView('emails/stores/store_activated', {
            userName,
            storeName: store.name,
            storeCode: store.code,
            storeType: store.storeType,
            campaignCode: campaign.code,
            campaignStartDate: campaign.startDate,
            campaignEndDate: campaign.endDate,
            occupantName,
            activatedBy,
            appUrl: config.frontendUrl,
            appName: config.appName,
            year: config.year,
          })
      })

      logger.info(`Email d'activation de magasin envoyé à ${email}`)
      return true
    } catch (error) {
      logger.error("Erreur lors de l'envoi de l'email d'activation de magasin:", error)
      return false
    }
  }

  /**
   * Envoie un email de notification de désactivation de magasin
   */
  static async sendStoreDeactivatedEmail(
    email: string,
    userName: string,
    store: { name: string; code: string; storeType: string },
    campaign: { code: string; startDate: string; endDate: string },
    occupantName: string,
    deactivatedBy: string
  ): Promise<boolean> {
    try {
      const config = this.getEmailConfig()

      await mail.send((message) => {
        message
          .to(email)
          .from(config.fromEmail, config.fromName)
          .subject(`Magasin désactivé - ${config.appName}`)
          .htmlView('emails/stores/store_deactivated', {
            userName,
            storeName: store.name,
            storeCode: store.code,
            storeType: store.storeType,
            campaignCode: campaign.code,
            occupantName,
            deactivatedBy,
            appUrl: config.frontendUrl,
            appName: config.appName,
            year: config.year,
          })
      })

      logger.info(`Email de désactivation de magasin envoyé à ${email}`)
      return true
    } catch (error) {
      logger.error("Erreur lors de l'envoi de l'email de désactivation de magasin:", error)
      return false
    }
  }

  /**
   * Envoie un email de notification d'affectation d'occupant
   */
  static async sendOccupantAssignedEmail(
    email: string,
    userName: string,
    actor: { fullName: string; actorType: string },
    store: { name: string; code: string },
    assignedBy: string
  ): Promise<boolean> {
    try {
      const config = this.getEmailConfig()

      await mail.send((message) => {
        message
          .to(email)
          .from(config.fromEmail, config.fromName)
          .subject(`Affectation à un magasin - ${config.appName}`)
          .htmlView('emails/stores/occupant_assigned', {
            userName,
            actorFullName: actor.fullName,
            actorType: actor.actorType,
            storeName: store.name,
            storeCode: store.code,
            assignedBy,
            appUrl: config.frontendUrl,
            appName: config.appName,
            year: config.year,
          })
      })

      logger.info(`Email d'affectation d'occupant envoyé à ${email}`)
      return true
    } catch (error) {
      logger.error("Erreur lors de l'envoi de l'email d'affectation d'occupant:", error)
      return false
    }
  }

  /**
   * Envoie un email de notification de dissociation d'occupant
   */
  static async sendOccupantUnassignedEmail(
    email: string,
    userName: string,
    actor: { fullName: string; actorType: string },
    store: { name: string; code: string },
    unassignedBy: string
  ): Promise<boolean> {
    try {
      const config = this.getEmailConfig()

      await mail.send((message) => {
        message
          .to(email)
          .from(config.fromEmail, config.fromName)
          .subject(`Retrait d'un magasin - ${config.appName}`)
          .htmlView('emails/stores/occupant_unassigned', {
            userName,
            actorFullName: actor.fullName,
            actorType: actor.actorType,
            storeName: store.name,
            storeCode: store.code,
            unassignedBy,
            appUrl: config.frontendUrl,
            appName: config.appName,
            year: config.year,
          })
      })

      logger.info(`Email de dissociation d'occupant envoyé à ${email}`)
      return true
    } catch (error) {
      logger.error("Erreur lors de l'envoi de l'email de dissociation d'occupant:", error)
      return false
    }
  }
}
