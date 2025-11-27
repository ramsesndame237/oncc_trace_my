import User from '#models/user'
import { BaseEmailService } from '#services/email/base_email_service'
import logger from '@adonisjs/core/services/logger'
import mail from '@adonisjs/mail/services/main'

/**
 * Service pour tous les emails de notification de calendrier d'enlèvement
 */
export class PickupCalendarEmailService extends BaseEmailService {
  /**
   * Envoie un email de notification de création de calendrier d'enlèvement à tous les destinataires
   */
  static async sendPickupCalendarCreatedNotifications(
    calendarCode: string,
    startDate: string,
    endDate: string,
    location: string,
    hierarchicalLocation: string,
    opaId: string,
    opaName: string,
    buyerExporterId: string,
    buyerExporterName: string,
    conventionCode: string
  ): Promise<boolean> {
    try {
      const config = this.getEmailConfig()

      // 1. Récupérer les utilisateurs de l'OPA propriétaire
      const opaUsers = await User.query()
        .where('actor_id', opaId)
        .where('role', 'actor_manager')
        .whereNull('deleted_at')
        .exec()

      logger.info(
        `📧 Envoi emails calendrier enlèvement à ${opaUsers.length} utilisateur(s) de l'OPA`
      )

      // Envoyer email à l'OPA propriétaire
      for (const user of opaUsers) {
        await mail.send((message) => {
          message
            .to(user.email)
            .from(config.fromEmail, config.fromName)
            .subject(`Calendrier d'enlèvement créé pour votre OPA - ${config.appName}`)
            .htmlView('emails/calendar/pickup_calendar_created_opa', {
              userName: `${user.givenName} ${user.familyName}`,
              opaName,
              calendarCode,
              startDate,
              endDate,
              location,
              hierarchicalLocation,
              conventionCode,
              buyerExporterName,
              appUrl: config.frontendUrl,
              appName: config.appName,
              supportEmail: config.supportEmail,
              supportPhone: config.supportPhone,
              year: config.year,
            })
        })
      }

      // 2. Récupérer les utilisateurs de l'acheteur/exportateur
      const buyerExporterUsers = await User.query()
        .where('actor_id', buyerExporterId)
        .where('role', 'actor_manager')
        .whereNull('deleted_at')
        .exec()

      logger.info(
        `📧 Envoi emails calendrier enlèvement à ${buyerExporterUsers.length} utilisateur(s) de l'acheteur/exportateur`
      )

      // Envoyer email à l'acheteur/exportateur
      for (const user of buyerExporterUsers) {
        await mail.send((message) => {
          message
            .to(user.email)
            .from(config.fromEmail, config.fromName)
            .subject(`Nouveau calendrier d'enlèvement disponible - ${config.appName}`)
            .htmlView('emails/calendar/pickup_calendar_created_buyer_exporter', {
              userName: `${user.givenName} ${user.familyName}`,
              buyerExporterName,
              opaName,
              calendarCode,
              startDate,
              endDate,
              location,
              hierarchicalLocation,
              conventionCode,
              appUrl: config.frontendUrl,
              appName: config.appName,
              supportEmail: config.supportEmail,
              supportPhone: config.supportPhone,
              year: config.year,
            })
        })
      }

      const totalRecipients = opaUsers.length + buyerExporterUsers.length

      logger.info(
        `✅ Emails de création de calendrier d'enlèvement envoyés à ${totalRecipients} destinataire(s)`
      )

      return true
    } catch (error) {
      logger.error("Erreur lors de l'envoi des emails de calendrier d'enlèvement:", error)
      return false
    }
  }

  /**
   * Envoie un email de notification de modification de calendrier d'enlèvement à tous les destinataires
   */
  static async sendPickupCalendarUpdatedNotifications(
    calendarCode: string,
    startDate: string,
    endDate: string,
    location: string,
    hierarchicalLocation: string,
    opaId: string,
    opaName: string,
    buyerExporterId: string,
    buyerExporterName: string,
    conventionCode: string
  ): Promise<boolean> {
    try {
      const config = this.getEmailConfig()

      // 1. Récupérer les utilisateurs de l'OPA propriétaire
      const opaUsers = await User.query()
        .where('actor_id', opaId)
        .where('role', 'actor_manager')
        .whereNull('deleted_at')
        .exec()

      logger.info(
        `📧 Envoi emails modification calendrier enlèvement à ${opaUsers.length} utilisateur(s) de l'OPA`
      )

      // Envoyer email à l'OPA propriétaire
      for (const user of opaUsers) {
        await mail.send((message) => {
          message
            .to(user.email)
            .from(config.fromEmail, config.fromName)
            .subject(`Calendrier d'enlèvement modifié pour votre OPA - ${config.appName}`)
            .htmlView('emails/calendar/pickup_calendar_updated_opa', {
              userName: `${user.givenName} ${user.familyName}`,
              opaName,
              calendarCode,
              startDate,
              endDate,
              location,
              hierarchicalLocation,
              conventionCode,
              buyerExporterName,
              appUrl: config.frontendUrl,
              appName: config.appName,
              supportEmail: config.supportEmail,
              supportPhone: config.supportPhone,
              year: config.year,
            })
        })
      }

      // 2. Récupérer les utilisateurs de l'acheteur/exportateur
      const buyerExporterUsers = await User.query()
        .where('actor_id', buyerExporterId)
        .where('role', 'actor_manager')
        .whereNull('deleted_at')
        .exec()

      logger.info(
        `📧 Envoi emails modification calendrier enlèvement à ${buyerExporterUsers.length} utilisateur(s) de l'acheteur/exportateur`
      )

      // Envoyer email à l'acheteur/exportateur
      for (const user of buyerExporterUsers) {
        await mail.send((message) => {
          message
            .to(user.email)
            .from(config.fromEmail, config.fromName)
            .subject(`Calendrier d'enlèvement modifié - ${config.appName}`)
            .htmlView('emails/calendar/pickup_calendar_updated_buyer_exporter', {
              userName: `${user.givenName} ${user.familyName}`,
              buyerExporterName,
              opaName,
              calendarCode,
              startDate,
              endDate,
              location,
              hierarchicalLocation,
              conventionCode,
              appUrl: config.frontendUrl,
              appName: config.appName,
              supportEmail: config.supportEmail,
              supportPhone: config.supportPhone,
              year: config.year,
            })
        })
      }

      const totalRecipients = opaUsers.length + buyerExporterUsers.length

      logger.info(
        `✅ Emails de modification de calendrier d'enlèvement envoyés à ${totalRecipients} destinataire(s)`
      )

      return true
    } catch (error) {
      logger.error(
        "Erreur lors de l'envoi des emails de modification de calendrier d'enlèvement:",
        error
      )
      return false
    }
  }

  /**
   * Envoie un email de notification d'annulation de calendrier d'enlèvement à tous les destinataires
   */
  static async sendPickupCalendarCancelledNotifications(
    calendarCode: string,
    startDate: string,
    endDate: string,
    location: string,
    hierarchicalLocation: string,
    opaId: string,
    opaName: string,
    buyerExporterId: string,
    buyerExporterName: string,
    conventionCode: string
  ): Promise<boolean> {
    try {
      const config = this.getEmailConfig()

      // 1. Récupérer les utilisateurs de l'OPA propriétaire
      const opaUsers = await User.query()
        .where('actor_id', opaId)
        .where('role', 'actor_manager')
        .whereNull('deleted_at')
        .exec()

      logger.info(
        `📧 Envoi emails annulation calendrier enlèvement à ${opaUsers.length} utilisateur(s) de l'OPA`
      )

      // Envoyer email à l'OPA propriétaire
      for (const user of opaUsers) {
        await mail.send((message) => {
          message
            .to(user.email)
            .from(config.fromEmail, config.fromName)
            .subject(`Calendrier d'enlèvement annulé pour votre OPA - ${config.appName}`)
            .htmlView('emails/calendar/pickup_calendar_cancelled_opa', {
              userName: `${user.givenName} ${user.familyName}`,
              opaName,
              calendarCode,
              startDate,
              endDate,
              location,
              hierarchicalLocation,
              conventionCode,
              buyerExporterName,
              appUrl: config.frontendUrl,
              appName: config.appName,
              supportEmail: config.supportEmail,
              supportPhone: config.supportPhone,
              year: config.year,
            })
        })
      }

      // 2. Récupérer les utilisateurs de l'acheteur/exportateur
      const buyerExporterUsers = await User.query()
        .where('actor_id', buyerExporterId)
        .where('role', 'actor_manager')
        .whereNull('deleted_at')
        .exec()

      logger.info(
        `📧 Envoi emails annulation calendrier enlèvement à ${buyerExporterUsers.length} utilisateur(s) de l'acheteur/exportateur`
      )

      // Envoyer email à l'acheteur/exportateur
      for (const user of buyerExporterUsers) {
        await mail.send((message) => {
          message
            .to(user.email)
            .from(config.fromEmail, config.fromName)
            .subject(`Calendrier d'enlèvement annulé - ${config.appName}`)
            .htmlView('emails/calendar/pickup_calendar_cancelled_buyer_exporter', {
              userName: `${user.givenName} ${user.familyName}`,
              buyerExporterName,
              opaName,
              calendarCode,
              startDate,
              endDate,
              location,
              hierarchicalLocation,
              conventionCode,
              appUrl: config.frontendUrl,
              appName: config.appName,
              supportEmail: config.supportEmail,
              supportPhone: config.supportPhone,
              year: config.year,
            })
        })
      }

      const totalRecipients = opaUsers.length + buyerExporterUsers.length

      logger.info(
        `✅ Emails d'annulation de calendrier d'enlèvement envoyés à ${totalRecipients} destinataire(s)`
      )

      return true
    } catch (error) {
      logger.error(
        "Erreur lors de l'envoi des emails d'annulation de calendrier d'enlèvement:",
        error
      )
      return false
    }
  }
}
