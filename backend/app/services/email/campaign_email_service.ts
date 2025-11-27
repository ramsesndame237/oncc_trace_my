import { BaseEmailService } from '#services/email/base_email_service'
import logger from '@adonisjs/core/services/logger'
import mail from '@adonisjs/mail/services/main'

/**
 * Service pour tous les emails de campagne
 */
export class CampaignEmailService extends BaseEmailService {
  /**
   * Envoie un email de notification d'activation de campagne
   */
  static async sendCampaignActivatedEmail(
    email: string,
    userName: string,
    campaign: {
      code: string
      startDate: string
      endDate: string
    },
    activatedBy: string
  ): Promise<boolean> {
    try {
      const config = this.getEmailConfig()

      await mail.send((message) => {
        message
          .to(email)
          .from(config.fromEmail, config.fromName)
          .subject(`Nouvelle campagne activée : ${campaign.code} - ${config.appName}`)
          .htmlView('emails/campaign/campaign_activated', {
            userName,
            campaign: {
              code: campaign.code,
              startDate: campaign.startDate,
              endDate: campaign.endDate,
            },
            activationDate: new Date().toLocaleString('fr-FR'),
            activatedBy,
            appUrl: config.frontendUrl,
            appName: config.appName,
            supportEmail: config.supportEmail,
            supportPhone: config.supportPhone,
            year: config.year,
          })
      })

      logger.info(`Email de notification de campagne envoyé à ${email}`)
      return true
    } catch (error) {
      logger.error("Erreur lors de l'envoi de l'email de notification de campagne:", error)
      return false
    }
  }

  /**
   * Envoie un email de notification du statut des magasins pour une campagne
   */
  static async sendStoresStatusEmail(
    email: string,
    userName: string,
    campaign: {
      code: string
      startDate: string
      endDate: string
    },
    storesData: {
      totalStores: number
      activeStores: number
      inactiveStores: number
    },
    activatedBy: string
  ): Promise<boolean> {
    try {
      const config = this.getEmailConfig()

      await mail.send((message) => {
        message
          .to(email)
          .from(config.fromEmail, config.fromName)
          .subject(
            `Alerte: Magasins non associés à la campagne ${campaign.code} - ${config.appName}`
          )
          .htmlView('emails/campaign/campaign_stores_status', {
            userName,
            campaign: {
              code: campaign.code,
              startDate: campaign.startDate,
              endDate: campaign.endDate,
            },
            totalStores: storesData.totalStores,
            activeStores: storesData.activeStores,
            inactiveStores: storesData.inactiveStores,
            activatedBy,
            appUrl: config.frontendUrl,
            appName: config.appName,
            supportEmail: config.supportEmail,
            supportPhone: config.supportPhone,
            year: config.year,
          })
      })

      logger.info(`Email de statut des magasins envoyé à ${email}`)
      return true
    } catch (error) {
      logger.error("Erreur lors de l'envoi de l'email de statut des magasins:", error)
      return false
    }
  }

  /**
   * Envoie un email de notification du statut des conventions d'un OPA pour une campagne
   */
  static async sendOpaConventionsStatusEmail(
    email: string,
    userName: string,
    campaign: {
      code: string
      startDate: string
      endDate: string
    },
    opaName: string,
    conventionsData: {
      totalConventions: number
      activeConventions: number
      inactiveConventions: number
    },
    activatedBy: string
  ): Promise<boolean> {
    try {
      const config = this.getEmailConfig()

      await mail.send((message) => {
        message
          .to(email)
          .from(config.fromEmail, config.fromName)
          .subject(
            `Action requise: Associez vos conventions à la campagne ${campaign.code} - ${config.appName}`
          )
          .htmlView('emails/campaign/campaign_opa_conventions_status', {
            userName,
            opaName,
            campaign: {
              code: campaign.code,
              startDate: campaign.startDate,
              endDate: campaign.endDate,
            },
            totalConventions: conventionsData.totalConventions,
            activeConventions: conventionsData.activeConventions,
            inactiveConventions: conventionsData.inactiveConventions,
            activatedBy,
            appUrl: config.frontendUrl,
            appName: config.appName,
            supportEmail: config.supportEmail,
            supportPhone: config.supportPhone,
            year: config.year,
          })
      })

      logger.info(`Email de statut des conventions OPA envoyé à ${email}`)
      return true
    } catch (error) {
      logger.error("Erreur lors de l'envoi de l'email de statut des conventions OPA:", error)
      return false
    }
  }

  /**
   * Envoie un email de notification du statut des conventions d'un acheteur/exportateur pour une campagne
   */
  static async sendBuyerConventionsStatusEmail(
    email: string,
    userName: string,
    campaign: {
      code: string
      startDate: string
      endDate: string
    },
    buyerName: string,
    conventionsData: {
      totalConventions: number
      activeConventions: number
      inactiveConventions: number
    },
    activatedBy: string
  ): Promise<boolean> {
    try {
      const config = this.getEmailConfig()

      await mail.send((message) => {
        message
          .to(email)
          .from(config.fromEmail, config.fromName)
          .subject(
            `Information: Conventions non associées à la campagne ${campaign.code} - ${config.appName}`
          )
          .htmlView('emails/campaign/campaign_buyer_conventions_status', {
            userName,
            buyerName,
            campaign: {
              code: campaign.code,
              startDate: campaign.startDate,
              endDate: campaign.endDate,
            },
            totalConventions: conventionsData.totalConventions,
            activeConventions: conventionsData.activeConventions,
            inactiveConventions: conventionsData.inactiveConventions,
            activatedBy,
            appUrl: config.frontendUrl,
            appName: config.appName,
            supportEmail: config.supportEmail,
            supportPhone: config.supportPhone,
            year: config.year,
          })
      })

      logger.info(`Email de statut des conventions acheteur/exportateur envoyé à ${email}`)
      return true
    } catch (error) {
      logger.error(
        "Erreur lors de l'envoi de l'email de statut des conventions acheteur/exportateur:",
        error
      )
      return false
    }
  }
}
