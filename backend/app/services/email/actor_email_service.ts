import User from '#models/user'
import { BaseEmailService } from '#services/email/base_email_service'
import logger from '@adonisjs/core/services/logger'
import mail from '@adonisjs/mail/services/main'

/**
 * Service pour tous les emails de gestion des acteurs
 */
export class ActorEmailService extends BaseEmailService {
  /**
   * Récupère tous les utilisateurs actor_manager d'un acteur donné
   */
  private static async getActorUsers(actorId: string): Promise<User[]> {
    return await User.query()
      .where('actor_id', actorId)
      .where('role', 'actor_manager')
      .whereNull('deleted_at')
      .exec()
  }

  /**
   * Envoie un email de notification d'activation d'acteur
   */
  static async sendActorActivatedEmail(
    actorId: string,
    actorName: string,
    actorType: string
  ): Promise<boolean> {
    try {
      const config = this.getEmailConfig()
      const users = await this.getActorUsers(actorId)

      if (users.length === 0) {
        logger.warn(`Aucun utilisateur trouvé pour l'acteur ${actorId}`)
        return true
      }

      // Envoyer l'email à tous les utilisateurs de l'acteur
      for (const user of users) {
        await mail.send((message) => {
          message
            .to(user.email)
            .from(config.fromEmail, config.fromName)
            .subject(`Votre organisation a été activée - ${config.appName}`)
            .htmlView('emails/actor/actor_activated', {
              userName: `${user.givenName} ${user.familyName}`,
              actorName,
              actorType,
              appUrl: config.frontendUrl,
              appName: config.appName,
              supportEmail: config.supportEmail,
              supportPhone: config.supportPhone,
              year: config.year,
            })
        })
      }

      logger.info(
        `Email d'activation d'acteur envoyé à ${users.length} utilisateur(s) de ${actorName}`
      )
      return true
    } catch (error) {
      logger.error("Erreur lors de l'envoi de l'email d'activation d'acteur:", error)
      return false
    }
  }

  /**
   * Envoie un email de notification de désactivation d'acteur
   */
  static async sendActorDeactivatedEmail(
    actorId: string,
    actorName: string,
    actorType: string
  ): Promise<boolean> {
    try {
      const config = this.getEmailConfig()
      const users = await this.getActorUsers(actorId)

      if (users.length === 0) {
        logger.warn(`Aucun utilisateur trouvé pour l'acteur ${actorId}`)
        return true
      }

      // Envoyer l'email à tous les utilisateurs de l'acteur
      for (const user of users) {
        await mail.send((message) => {
          message
            .to(user.email)
            .from(config.fromEmail, config.fromName)
            .subject(`Votre organisation a été désactivée - ${config.appName}`)
            .htmlView('emails/actor/actor_deactivated', {
              userName: `${user.givenName} ${user.familyName}`,
              actorName,
              actorType,
              appUrl: config.frontendUrl,
              appName: config.appName,
              supportEmail: config.supportEmail,
              supportPhone: config.supportPhone,
              year: config.year,
            })
        })
      }

      logger.info(
        `Email de désactivation d'acteur envoyé à ${users.length} utilisateur(s) de ${actorName}`
      )
      return true
    } catch (error) {
      logger.error("Erreur lors de l'envoi de l'email de désactivation d'acteur:", error)
      return false
    }
  }

  /**
   * Envoie un email de notification d'ajout de producteur à une OPA
   */
  static async sendProducerAddedToOpaEmail(
    opaId: string,
    opaName: string,
    producerName: string
  ): Promise<boolean> {
    try {
      const config = this.getEmailConfig()
      const users = await this.getActorUsers(opaId)

      if (users.length === 0) {
        logger.warn(`Aucun utilisateur trouvé pour l'OPA ${opaId}`)
        return true
      }

      // Envoyer l'email à tous les utilisateurs de l'OPA
      for (const user of users) {
        await mail.send((message) => {
          message
            .to(user.email)
            .from(config.fromEmail, config.fromName)
            .subject(`Nouveau producteur ajouté à votre OPA - ${config.appName}`)
            .htmlView('emails/actor/producer_added_to_opa', {
              userName: `${user.givenName} ${user.familyName}`,
              opaName,
              producerName,
              appUrl: config.frontendUrl,
              appName: config.appName,
              supportEmail: config.supportEmail,
              supportPhone: config.supportPhone,
              year: config.year,
            })
        })
      }

      logger.info(
        `Email d'ajout de producteur envoyé à ${users.length} utilisateur(s) de ${opaName}`
      )
      return true
    } catch (error) {
      logger.error("Erreur lors de l'envoi de l'email d'ajout de producteur:", error)
      return false
    }
  }

  /**
   * Envoie un email de notification de retrait de producteur d'une OPA
   */
  static async sendProducerRemovedFromOpaEmail(
    opaId: string,
    opaName: string,
    producerName: string
  ): Promise<boolean> {
    try {
      const config = this.getEmailConfig()
      const users = await this.getActorUsers(opaId)

      if (users.length === 0) {
        logger.warn(`Aucun utilisateur trouvé pour l'OPA ${opaId}`)
        return true
      }

      // Envoyer l'email à tous les utilisateurs de l'OPA
      for (const user of users) {
        await mail.send((message) => {
          message
            .to(user.email)
            .from(config.fromEmail, config.fromName)
            .subject(`Producteur retiré de votre OPA - ${config.appName}`)
            .htmlView('emails/actor/producer_removed_from_opa', {
              userName: `${user.givenName} ${user.familyName}`,
              opaName,
              producerName,
              appUrl: config.frontendUrl,
              appName: config.appName,
              supportEmail: config.supportEmail,
              supportPhone: config.supportPhone,
              year: config.year,
            })
        })
      }

      logger.info(
        `Email de retrait de producteur envoyé à ${users.length} utilisateur(s) de ${opaName}`
      )
      return true
    } catch (error) {
      logger.error("Erreur lors de l'envoi de l'email de retrait de producteur:", error)
      return false
    }
  }

  /**
   * Envoie un email de notification d'ajout d'acheteur mandataire à un exportateur
   * Notifie les utilisateurs de l'exportateur
   */
  static async sendBuyerAddedToExporterEmail(
    exporterId: string,
    exporterName: string,
    buyerName: string
  ): Promise<boolean> {
    try {
      const config = this.getEmailConfig()
      const users = await this.getActorUsers(exporterId)

      if (users.length === 0) {
        logger.warn(`Aucun utilisateur trouvé pour l'exportateur ${exporterId}`)
        return true
      }

      // Envoyer l'email à tous les utilisateurs de l'exportateur
      for (const user of users) {
        await mail.send((message) => {
          message
            .to(user.email)
            .from(config.fromEmail, config.fromName)
            .subject(`Nouveau mandataire ajouté à votre exportateur - ${config.appName}`)
            .htmlView('emails/actor/buyer_added_to_exporter', {
              userName: `${user.givenName} ${user.familyName}`,
              exporterName,
              buyerName,
              appUrl: config.frontendUrl,
              appName: config.appName,
              supportEmail: config.supportEmail,
              supportPhone: config.supportPhone,
              year: config.year,
            })
        })
      }

      logger.info(
        `Email d'ajout de mandataire envoyé à ${users.length} utilisateur(s) de ${exporterName}`
      )
      return true
    } catch (error) {
      logger.error("Erreur lors de l'envoi de l'email d'ajout de mandataire:", error)
      return false
    }
  }

  /**
   * Envoie un email de notification de retrait d'acheteur mandataire d'un exportateur
   * Notifie les utilisateurs de l'exportateur
   */
  static async sendBuyerRemovedFromExporterEmail(
    exporterId: string,
    exporterName: string,
    buyerName: string
  ): Promise<boolean> {
    try {
      const config = this.getEmailConfig()
      const users = await this.getActorUsers(exporterId)

      if (users.length === 0) {
        logger.warn(`Aucun utilisateur trouvé pour l'exportateur ${exporterId}`)
        return true
      }

      // Envoyer l'email à tous les utilisateurs de l'exportateur
      for (const user of users) {
        await mail.send((message) => {
          message
            .to(user.email)
            .from(config.fromEmail, config.fromName)
            .subject(`Mandataire retiré de votre exportateur - ${config.appName}`)
            .htmlView('emails/actor/buyer_removed_from_exporter', {
              userName: `${user.givenName} ${user.familyName}`,
              exporterName,
              buyerName,
              appUrl: config.frontendUrl,
              appName: config.appName,
              supportEmail: config.supportEmail,
              supportPhone: config.supportPhone,
              year: config.year,
            })
        })
      }

      logger.info(
        `Email de retrait de mandataire envoyé à ${users.length} utilisateur(s) de ${exporterName}`
      )
      return true
    } catch (error) {
      logger.error("Erreur lors de l'envoi de l'email de retrait de mandataire:", error)
      return false
    }
  }

  /**
   * Envoie un email de notification à l'acheteur mandataire qu'il a été affecté à un exportateur
   * Notifie les utilisateurs de l'acheteur mandataire
   */
  static async sendBuyerAssignedAsMandataireEmail(
    buyerId: string,
    buyerName: string,
    exporterName: string
  ): Promise<boolean> {
    try {
      const config = this.getEmailConfig()
      const users = await this.getActorUsers(buyerId)

      if (users.length === 0) {
        logger.warn(`Aucun utilisateur trouvé pour l'acheteur mandataire ${buyerId}`)
        return true
      }

      // Envoyer l'email à tous les utilisateurs de l'acheteur mandataire
      for (const user of users) {
        await mail.send((message) => {
          message
            .to(user.email)
            .from(config.fromEmail, config.fromName)
            .subject(`Vous avez été affecté comme mandataire - ${config.appName}`)
            .htmlView('emails/actor/buyer_assigned_as_mandataire', {
              userName: `${user.givenName} ${user.familyName}`,
              buyerName,
              exporterName,
              appUrl: config.frontendUrl,
              appName: config.appName,
              supportEmail: config.supportEmail,
              supportPhone: config.supportPhone,
              year: config.year,
            })
        })
      }

      logger.info(
        `Email d'affectation comme mandataire envoyé à ${users.length} utilisateur(s) de ${buyerName}`
      )
      return true
    } catch (error) {
      logger.error(
        "Erreur lors de l'envoi de l'email d'affectation comme mandataire:",
        error
      )
      return false
    }
  }

  /**
   * Envoie un email de notification à l'acheteur mandataire qu'il a été retiré d'un exportateur
   * Notifie les utilisateurs de l'acheteur mandataire
   */
  static async sendBuyerUnassignedAsMandataireEmail(
    buyerId: string,
    buyerName: string,
    exporterName: string
  ): Promise<boolean> {
    try {
      const config = this.getEmailConfig()
      const users = await this.getActorUsers(buyerId)

      if (users.length === 0) {
        logger.warn(`Aucun utilisateur trouvé pour l'acheteur mandataire ${buyerId}`)
        return true
      }

      // Envoyer l'email à tous les utilisateurs de l'acheteur mandataire
      for (const user of users) {
        await mail.send((message) => {
          message
            .to(user.email)
            .from(config.fromEmail, config.fromName)
            .subject(`Vous avez été retiré comme mandataire - ${config.appName}`)
            .htmlView('emails/actor/buyer_unassigned_as_mandataire', {
              userName: `${user.givenName} ${user.familyName}`,
              buyerName,
              exporterName,
              appUrl: config.frontendUrl,
              appName: config.appName,
              supportEmail: config.supportEmail,
              supportPhone: config.supportPhone,
              year: config.year,
            })
        })
      }

      logger.info(
        `Email de retrait comme mandataire envoyé à ${users.length} utilisateur(s) de ${buyerName}`
      )
      return true
    } catch (error) {
      logger.error("Erreur lors de l'envoi de l'email de retrait comme mandataire:", error)
      return false
    }
  }
}
