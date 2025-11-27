import Actor from '#models/actor'
import User from '#models/user'
import { BaseEmailService } from '#services/email/base_email_service'
import ProductionBasinService from '#services/production_basin_service'
import { inject } from '@adonisjs/core'
import logger from '@adonisjs/core/services/logger'
import mail from '@adonisjs/mail/services/main'

/**
 * Service pour tous les emails de notification de calendrier de marché
 */
@inject()
export class MarketCalendarEmailService extends BaseEmailService {
  constructor(protected productionBasinService: ProductionBasinService) {
    super()
  }

  /**
   * Envoie un email de notification de création de calendrier de marché à tous les destinataires
   */
  async sendMarketCalendarCreatedNotifications(
    calendarCode: string,
    startDate: string,
    endDate: string,
    location: string,
    hierarchicalLocation: string,
    opaId: string,
    opaName: string,
    productionBasinId: string
  ): Promise<boolean> {
    try {
      const config = BaseEmailService.getEmailConfig()

      // 1. Récupérer les utilisateurs de l'OPA propriétaire
      const opaUsers = await User.query()
        .where('actor_id', opaId)
        .where('role', 'actor_manager')
        .whereNull('deleted_at')
        .exec()

      logger.info(`📧 Envoi emails calendrier marché à ${opaUsers.length} utilisateur(s) de l'OPA`)

      // Envoyer email à l'OPA propriétaire
      for (const user of opaUsers) {
        await mail.send((message) => {
          message
            .to(user.email)
            .from(config.fromEmail, config.fromName)
            .subject(`Calendrier de marché créé pour votre OPA - ${config.appName}`)
            .htmlView('emails/calendar/market_calendar_created_opa_owner', {
              userName: `${user.givenName} ${user.familyName}`,
              opaName,
              calendarCode,
              startDate,
              endDate,
              location,
              hierarchicalLocation,
              appUrl: config.frontendUrl,
              appName: config.appName,
              supportEmail: config.supportEmail,
              supportPhone: config.supportPhone,
              year: config.year,
            })
        })
      }

      // 2. Récupérer les basin admin et field agent du même bassin de production
      const basinAdminsAndAgents = await User.query()
        .where('production_basin_id', productionBasinId)
        .whereIn('role', ['basin_admin', 'field_agent'])
        .whereNull('deleted_at')
        .exec()

      logger.info(
        `📧 Envoi emails calendrier marché à ${basinAdminsAndAgents.length} basin admin/field agent`
      )

      // Envoyer email aux basin admin et field agent
      for (const user of basinAdminsAndAgents) {
        await mail.send((message) => {
          message
            .to(user.email)
            .from(config.fromEmail, config.fromName)
            .subject(`Nouveau calendrier de marché créé - ${config.appName}`)
            .htmlView('emails/calendar/market_calendar_created_basin_staff', {
              userName: `${user.givenName} ${user.familyName}`,
              opaName,
              calendarCode,
              startDate,
              endDate,
              location,
              hierarchicalLocation,
              appUrl: config.frontendUrl,
              appName: config.appName,
              supportEmail: config.supportEmail,
              supportPhone: config.supportPhone,
              year: config.year,
            })
        })
      }

      // 3. Récupérer les autres OPA du même bassin de production (excluant l'OPA propriétaire)
      // Utiliser getLocationCodesWithPropagation pour inclure toute la hiérarchie
      const basinLocationCodes =
        await this.productionBasinService.getLocationCodesWithPropagation(productionBasinId)

      const otherOpas = await Actor.query()
        .whereIn('location_code', basinLocationCodes)
        .where('actor_type', 'PRODUCERS')
        .whereNot('id', opaId)
        .whereNull('deleted_at')
        .exec()

      // Pour chaque OPA, récupérer ses utilisateurs
      let otherOpaUsersCount = 0
      for (const opa of otherOpas) {
        const users = await User.query()
          .where('actor_id', opa.id)
          .where('role', 'actor_manager')
          .whereNull('deleted_at')
          .exec()

        otherOpaUsersCount += users.length

        for (const user of users) {
          await mail.send((message) => {
            message
              .to(user.email)
              .from(config.fromEmail, config.fromName)
              .subject(`Nouveau calendrier de marché dans votre bassin - ${config.appName}`)
              .htmlView('emails/calendar/market_calendar_created_other_opa', {
                userName: `${user.givenName} ${user.familyName}`,
                ownOpaName: `${opa.familyName} ${opa.givenName}`,
                creatorOpaName: opaName,
                calendarCode,
                startDate,
                endDate,
                location,
                hierarchicalLocation,
                appUrl: config.frontendUrl,
                appName: config.appName,
                supportEmail: config.supportEmail,
                supportPhone: config.supportPhone,
                year: config.year,
              })
          })
        }
      }

      logger.info(
        `📧 Envoi emails calendrier marché à ${otherOpaUsersCount} utilisateur(s) d'autres OPA`
      )

      // 4. Récupérer tous les acteurs BUYER, EXPORTER, TRANSFORMER
      const otherActors = await Actor.query()
        .whereIn('actor_type', ['BUYER', 'EXPORTER', 'TRANSFORMER'])
        .whereNull('deleted_at')
        .exec()

      // Pour chaque acteur, récupérer ses utilisateurs
      let otherActorUsersCount = 0
      for (const actor of otherActors) {
        const users = await User.query()
          .where('actor_id', actor.id)
          .where('role', 'actor_manager')
          .whereNull('deleted_at')
          .exec()

        otherActorUsersCount += users.length

        for (const user of users) {
          await mail.send((message) => {
            message
              .to(user.email)
              .from(config.fromEmail, config.fromName)
              .subject(`Nouveau calendrier de marché disponible - ${config.appName}`)
              .htmlView('emails/calendar/market_calendar_created_other_actor', {
                userName: `${user.givenName} ${user.familyName}`,
                actorName: `${actor.familyName} ${actor.givenName}`,
                opaName,
                calendarCode,
                startDate,
                endDate,
                location,
                hierarchicalLocation,
                appUrl: config.frontendUrl,
                appName: config.appName,
                supportEmail: config.supportEmail,
                supportPhone: config.supportPhone,
                year: config.year,
              })
          })
        }
      }

      logger.info(
        `📧 Envoi emails calendrier marché à ${otherActorUsersCount} utilisateur(s) d'autres acteurs`
      )

      const totalRecipients =
        opaUsers.length + basinAdminsAndAgents.length + otherOpaUsersCount + otherActorUsersCount

      logger.info(
        `✅ Emails de création de calendrier de marché envoyés à ${totalRecipients} destinataire(s)`
      )

      return true
    } catch (error) {
      logger.error("Erreur lors de l'envoi des emails de calendrier de marché:", error)
      return false
    }
  }

  /**
   * Envoie un email de notification de modification de calendrier de marché à tous les destinataires
   */
  async sendMarketCalendarUpdatedNotifications(
    calendarCode: string,
    startDate: string,
    endDate: string,
    location: string,
    hierarchicalLocation: string,
    opaId: string,
    opaName: string,
    productionBasinId: string
  ): Promise<boolean> {
    try {
      const config = BaseEmailService.getEmailConfig()

      // 1. Récupérer les utilisateurs de l'OPA propriétaire
      const opaUsers = await User.query()
        .where('actor_id', opaId)
        .where('role', 'actor_manager')
        .whereNull('deleted_at')
        .exec()

      logger.info(
        `📧 Envoi emails modification calendrier marché à ${opaUsers.length} utilisateur(s) de l'OPA`
      )

      // Envoyer email à l'OPA propriétaire
      for (const user of opaUsers) {
        await mail.send((message) => {
          message
            .to(user.email)
            .from(config.fromEmail, config.fromName)
            .subject(`Calendrier de marché modifié pour votre OPA - ${config.appName}`)
            .htmlView('emails/calendar/market_calendar_updated_opa_owner', {
              userName: `${user.givenName} ${user.familyName}`,
              opaName,
              calendarCode,
              startDate,
              endDate,
              location,
              hierarchicalLocation,
              appUrl: config.frontendUrl,
              appName: config.appName,
              supportEmail: config.supportEmail,
              supportPhone: config.supportPhone,
              year: config.year,
            })
        })
      }

      // 2. Récupérer les basin admin et field agent du même bassin de production
      const basinAdminsAndAgents = await User.query()
        .where('production_basin_id', productionBasinId)
        .whereIn('role', ['basin_admin', 'field_agent'])
        .whereNull('deleted_at')
        .exec()

      logger.info(
        `📧 Envoi emails modification calendrier marché à ${basinAdminsAndAgents.length} basin admin/field agent`
      )

      // Envoyer email aux basin admin et field agent
      for (const user of basinAdminsAndAgents) {
        await mail.send((message) => {
          message
            .to(user.email)
            .from(config.fromEmail, config.fromName)
            .subject(`Calendrier de marché modifié - ${config.appName}`)
            .htmlView('emails/calendar/market_calendar_updated_basin_staff', {
              userName: `${user.givenName} ${user.familyName}`,
              opaName,
              calendarCode,
              startDate,
              endDate,
              location,
              hierarchicalLocation,
              appUrl: config.frontendUrl,
              appName: config.appName,
              supportEmail: config.supportEmail,
              supportPhone: config.supportPhone,
              year: config.year,
            })
        })
      }

      // 3. Récupérer les autres OPA du même bassin de production (excluant l'OPA propriétaire)
      const basinLocationCodes =
        await this.productionBasinService.getLocationCodesWithPropagation(productionBasinId)

      const otherOpas = await Actor.query()
        .whereIn('location_code', basinLocationCodes)
        .where('actor_type', 'PRODUCERS')
        .whereNot('id', opaId)
        .whereNull('deleted_at')
        .exec()

      // Pour chaque OPA, récupérer ses utilisateurs
      let otherOpaUsersCount = 0
      for (const opa of otherOpas) {
        const users = await User.query()
          .where('actor_id', opa.id)
          .where('role', 'actor_manager')
          .whereNull('deleted_at')
          .exec()

        otherOpaUsersCount += users.length

        for (const user of users) {
          await mail.send((message) => {
            message
              .to(user.email)
              .from(config.fromEmail, config.fromName)
              .subject(`Calendrier de marché modifié dans votre bassin - ${config.appName}`)
              .htmlView('emails/calendar/market_calendar_updated_other_opa', {
                userName: `${user.givenName} ${user.familyName}`,
                ownOpaName: `${opa.familyName} ${opa.givenName}`,
                creatorOpaName: opaName,
                calendarCode,
                startDate,
                endDate,
                location,
                hierarchicalLocation,
                appUrl: config.frontendUrl,
                appName: config.appName,
                supportEmail: config.supportEmail,
                supportPhone: config.supportPhone,
                year: config.year,
              })
          })
        }
      }

      logger.info(
        `📧 Envoi emails modification calendrier marché à ${otherOpaUsersCount} utilisateur(s) d'autres OPA`
      )

      // 4. Récupérer tous les acteurs BUYER, EXPORTER, TRANSFORMER
      const otherActors = await Actor.query()
        .whereIn('actor_type', ['BUYER', 'EXPORTER', 'TRANSFORMER'])
        .whereNull('deleted_at')
        .exec()

      // Pour chaque acteur, récupérer ses utilisateurs
      let otherActorUsersCount = 0
      for (const actor of otherActors) {
        const users = await User.query()
          .where('actor_id', actor.id)
          .where('role', 'actor_manager')
          .whereNull('deleted_at')
          .exec()

        otherActorUsersCount += users.length

        for (const user of users) {
          await mail.send((message) => {
            message
              .to(user.email)
              .from(config.fromEmail, config.fromName)
              .subject(`Calendrier de marché modifié - ${config.appName}`)
              .htmlView('emails/calendar/market_calendar_updated_other_actor', {
                userName: `${user.givenName} ${user.familyName}`,
                actorName: `${actor.familyName} ${actor.givenName}`,
                opaName,
                calendarCode,
                startDate,
                endDate,
                location,
                hierarchicalLocation,
                appUrl: config.frontendUrl,
                appName: config.appName,
                supportEmail: config.supportEmail,
                supportPhone: config.supportPhone,
                year: config.year,
              })
          })
        }
      }

      logger.info(
        `📧 Envoi emails modification calendrier marché à ${otherActorUsersCount} utilisateur(s) d'autres acteurs`
      )

      const totalRecipients =
        opaUsers.length + basinAdminsAndAgents.length + otherOpaUsersCount + otherActorUsersCount

      logger.info(
        `✅ Emails de modification de calendrier de marché envoyés à ${totalRecipients} destinataire(s)`
      )

      return true
    } catch (error) {
      logger.error("Erreur lors de l'envoi des emails de modification de calendrier de marché:", error)
      return false
    }
  }

  /**
   * Envoie un email de notification d'annulation de calendrier de marché à tous les destinataires
   */
  async sendMarketCalendarCancelledNotifications(
    calendarCode: string,
    startDate: string,
    endDate: string,
    location: string,
    hierarchicalLocation: string,
    opaId: string,
    opaName: string,
    productionBasinId: string
  ): Promise<boolean> {
    try {
      const config = BaseEmailService.getEmailConfig()

      // 1. Récupérer les utilisateurs de l'OPA propriétaire
      const opaUsers = await User.query()
        .where('actor_id', opaId)
        .where('role', 'actor_manager')
        .whereNull('deleted_at')
        .exec()

      logger.info(
        `📧 Envoi emails annulation calendrier marché à ${opaUsers.length} utilisateur(s) de l'OPA`
      )

      // Envoyer email à l'OPA propriétaire
      for (const user of opaUsers) {
        await mail.send((message) => {
          message
            .to(user.email)
            .from(config.fromEmail, config.fromName)
            .subject(`Calendrier de marché annulé pour votre OPA - ${config.appName}`)
            .htmlView('emails/calendar/market_calendar_cancelled_opa_owner', {
              userName: `${user.givenName} ${user.familyName}`,
              opaName,
              calendarCode,
              startDate,
              endDate,
              location,
              hierarchicalLocation,
              appUrl: config.frontendUrl,
              appName: config.appName,
              supportEmail: config.supportEmail,
              supportPhone: config.supportPhone,
              year: config.year,
            })
        })
      }

      // 2. Récupérer les basin admin et field agent du même bassin de production
      const basinAdminsAndAgents = await User.query()
        .where('production_basin_id', productionBasinId)
        .whereIn('role', ['basin_admin', 'field_agent'])
        .whereNull('deleted_at')
        .exec()

      logger.info(
        `📧 Envoi emails annulation calendrier marché à ${basinAdminsAndAgents.length} basin admin/field agent`
      )

      // Envoyer email aux basin admin et field agent
      for (const user of basinAdminsAndAgents) {
        await mail.send((message) => {
          message
            .to(user.email)
            .from(config.fromEmail, config.fromName)
            .subject(`Calendrier de marché annulé - ${config.appName}`)
            .htmlView('emails/calendar/market_calendar_cancelled_basin_staff', {
              userName: `${user.givenName} ${user.familyName}`,
              opaName,
              calendarCode,
              startDate,
              endDate,
              location,
              hierarchicalLocation,
              appUrl: config.frontendUrl,
              appName: config.appName,
              supportEmail: config.supportEmail,
              supportPhone: config.supportPhone,
              year: config.year,
            })
        })
      }

      // 3. Récupérer les autres OPA du même bassin de production (excluant l'OPA propriétaire)
      const basinLocationCodes =
        await this.productionBasinService.getLocationCodesWithPropagation(productionBasinId)

      const otherOpas = await Actor.query()
        .whereIn('location_code', basinLocationCodes)
        .where('actor_type', 'PRODUCERS')
        .whereNot('id', opaId)
        .whereNull('deleted_at')
        .exec()

      // Pour chaque OPA, récupérer ses utilisateurs
      let otherOpaUsersCount = 0
      for (const opa of otherOpas) {
        const users = await User.query()
          .where('actor_id', opa.id)
          .where('role', 'actor_manager')
          .whereNull('deleted_at')
          .exec()

        otherOpaUsersCount += users.length

        for (const user of users) {
          await mail.send((message) => {
            message
              .to(user.email)
              .from(config.fromEmail, config.fromName)
              .subject(`Calendrier de marché annulé dans votre bassin - ${config.appName}`)
              .htmlView('emails/calendar/market_calendar_cancelled_other_opa', {
                userName: `${user.givenName} ${user.familyName}`,
                ownOpaName: `${opa.familyName} ${opa.givenName}`,
                creatorOpaName: opaName,
                calendarCode,
                startDate,
                endDate,
                location,
                hierarchicalLocation,
                appUrl: config.frontendUrl,
                appName: config.appName,
                supportEmail: config.supportEmail,
                supportPhone: config.supportPhone,
                year: config.year,
              })
          })
        }
      }

      logger.info(
        `📧 Envoi emails annulation calendrier marché à ${otherOpaUsersCount} utilisateur(s) d'autres OPA`
      )

      // 4. Récupérer tous les acteurs BUYER, EXPORTER, TRANSFORMER
      const otherActors = await Actor.query()
        .whereIn('actor_type', ['BUYER', 'EXPORTER', 'TRANSFORMER'])
        .whereNull('deleted_at')
        .exec()

      // Pour chaque acteur, récupérer ses utilisateurs
      let otherActorUsersCount = 0
      for (const actor of otherActors) {
        const users = await User.query()
          .where('actor_id', actor.id)
          .where('role', 'actor_manager')
          .whereNull('deleted_at')
          .exec()

        otherActorUsersCount += users.length

        for (const user of users) {
          await mail.send((message) => {
            message
              .to(user.email)
              .from(config.fromEmail, config.fromName)
              .subject(`Calendrier de marché annulé - ${config.appName}`)
              .htmlView('emails/calendar/market_calendar_cancelled_other_actor', {
                userName: `${user.givenName} ${user.familyName}`,
                actorName: `${actor.familyName} ${actor.givenName}`,
                opaName,
                calendarCode,
                startDate,
                endDate,
                location,
                hierarchicalLocation,
                appUrl: config.frontendUrl,
                appName: config.appName,
                supportEmail: config.supportEmail,
                supportPhone: config.supportPhone,
                year: config.year,
              })
          })
        }
      }

      logger.info(
        `📧 Envoi emails annulation calendrier marché à ${otherActorUsersCount} utilisateur(s) d'autres acteurs`
      )

      const totalRecipients =
        opaUsers.length + basinAdminsAndAgents.length + otherOpaUsersCount + otherActorUsersCount

      logger.info(
        `✅ Emails d'annulation de calendrier de marché envoyés à ${totalRecipients} destinataire(s)`
      )

      return true
    } catch (error) {
      logger.error("Erreur lors de l'envoi des emails d'annulation de calendrier de marché:", error)
      return false
    }
  }
}
