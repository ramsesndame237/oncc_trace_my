import { BaseEmailService } from '#services/email/base_email_service'
import logger from '@adonisjs/core/services/logger'
import mail from '@adonisjs/mail/services/main'

/**
 * Service pour tous les emails de convention
 */
export class ConventionEmailService extends BaseEmailService {
  /**
   * Envoie un email de notification aux acteurs associés (acheteur/exportateur et OPA)
   * lors de la création d'une convention
   */
  static async sendConventionCreatedNotification(
    email: string,
    userName: string,
    convention: {
      code: string
      signatureDate: string
      products: Array<{
        code: string
        name: string
        quantity: number
        unit: string
      }>
    },
    partnerInfo: {
      name: string
      type: string
    },
    createdBy: string
  ): Promise<boolean> {
    try {
      const config = this.getEmailConfig()

      await mail.send((message) => {
        message
          .to(email)
          .from(config.fromEmail, config.fromName)
          .subject(`Nouvelle convention créée : ${convention.code} - ${config.appName}`)
          .htmlView('emails/convention/convention_created', {
            userName,
            conventionCode: convention.code,
            signatureDate: convention.signatureDate,
            products: convention.products,
            partnerName: partnerInfo.name,
            partnerType: partnerInfo.type,
            createdBy,
            appUrl: config.frontendUrl,
            appName: config.appName,
            supportEmail: config.supportEmail,
            supportPhone: config.supportPhone,
            year: config.year,
          })
      })

      logger.info(`Email de notification de convention créée envoyé à ${email}`)
      return true
    } catch (error) {
      logger.error("Erreur lors de l'envoi de l'email de convention créée:", error)
      return false
    }
  }

  /**
   * Envoie un email de résumé à l'OPA qui a créé sa propre convention
   */
  static async sendConventionCreatedSummary(
    email: string,
    userName: string,
    convention: {
      code: string
      signatureDate: string
      products: Array<{
        code: string
        name: string
        quantity: number
        unit: string
      }>
    },
    buyerExporter: {
      name: string
      type: string
    }
  ): Promise<boolean> {
    try {
      const config = this.getEmailConfig()

      await mail.send((message) => {
        message
          .to(email)
          .from(config.fromEmail, config.fromName)
          .subject(`Confirmation de création de convention : ${convention.code} - ${config.appName}`)
          .htmlView('emails/convention/convention_created_summary', {
            userName,
            conventionCode: convention.code,
            signatureDate: convention.signatureDate,
            products: convention.products,
            buyerExporterName: buyerExporter.name,
            buyerExporterType: buyerExporter.type,
            appUrl: config.frontendUrl,
            appName: config.appName,
            supportEmail: config.supportEmail,
            supportPhone: config.supportPhone,
            year: config.year,
          })
      })

      logger.info(`Email de résumé de convention créée envoyé à ${email}`)
      return true
    } catch (error) {
      logger.error("Erreur lors de l'envoi de l'email de résumé de convention:", error)
      return false
    }
  }

  /**
   * Envoie un email de notification de modification de convention
   */
  static async sendConventionUpdatedNotification(
    email: string,
    userName: string,
    convention: {
      code: string
      signatureDate: string
      products: Array<{
        code: string
        name: string
        quality: string
        standard: string
        weight: number
        bags: number
        pricePerKg: number
        humidity: number
      }>
    },
    changes: {
      signatureDateChanged: boolean
      productsChanged: boolean
      oldSignatureDate?: string
      newSignatureDate?: string
    },
    partnerInfo: {
      name: string
      type: string
    },
    updatedBy: string
  ): Promise<boolean> {
    try {
      const config = this.getEmailConfig()

      await mail.send((message) => {
        message
          .to(email)
          .from(config.fromEmail, config.fromName)
          .subject(`Convention modifiée : ${convention.code} - ${config.appName}`)
          .htmlView('emails/convention/convention_updated', {
            userName,
            conventionCode: convention.code,
            signatureDate: convention.signatureDate,
            products: convention.products,
            changes,
            partnerName: partnerInfo.name,
            partnerType: partnerInfo.type,
            updatedBy,
            appUrl: config.frontendUrl,
            appName: config.appName,
            supportEmail: config.supportEmail,
            supportPhone: config.supportPhone,
            year: config.year,
          })
      })

      logger.info(`Email de notification de convention modifiée envoyé à ${email}`)
      return true
    } catch (error) {
      logger.error("Erreur lors de l'envoi de l'email de convention modifiée:", error)
      return false
    }
  }

  /**
   * Envoie un email de notification d'association de convention à une campagne
   */
  static async sendConventionAssociatedToCampaignNotification(
    email: string,
    userName: string,
    convention: {
      code: string
      signatureDate: string
    },
    campaign: {
      code: string
      startDate: string
      endDate: string
    },
    partnerInfo: {
      name: string
      type: string
    },
    associatedBy: string
  ): Promise<boolean> {
    try {
      const config = this.getEmailConfig()

      await mail.send((message) => {
        message
          .to(email)
          .from(config.fromEmail, config.fromName)
          .subject(
            `Convention associée à la campagne ${campaign.code} - ${config.appName}`
          )
          .htmlView('emails/convention/convention_associated_to_campaign', {
            userName,
            conventionCode: convention.code,
            signatureDate: convention.signatureDate,
            campaignCode: campaign.code,
            campaignStartDate: campaign.startDate,
            campaignEndDate: campaign.endDate,
            partnerName: partnerInfo.name,
            partnerType: partnerInfo.type,
            associatedBy,
            appUrl: config.frontendUrl,
            appName: config.appName,
            supportEmail: config.supportEmail,
            supportPhone: config.supportPhone,
            year: config.year,
          })
      })

      logger.info(`Email de notification d'association de convention à campagne envoyé à ${email}`)
      return true
    } catch (error) {
      logger.error(
        "Erreur lors de l'envoi de l'email d'association de convention à campagne:",
        error
      )
      return false
    }
  }

  /**
   * Envoie un email de notification de dissociation de convention d'une campagne
   */
  static async sendConventionDissociatedFromCampaignNotification(
    email: string,
    userName: string,
    convention: {
      code: string
      signatureDate: string
    },
    campaign: {
      code: string
      startDate: string
      endDate: string
    },
    partnerInfo: {
      name: string
      type: string
    },
    dissociatedBy: string
  ): Promise<boolean> {
    try {
      const config = this.getEmailConfig()

      await mail.send((message) => {
        message
          .to(email)
          .from(config.fromEmail, config.fromName)
          .subject(
            `Convention dissociée de la campagne ${campaign.code} - ${config.appName}`
          )
          .htmlView('emails/convention/convention_dissociated_from_campaign', {
            userName,
            conventionCode: convention.code,
            signatureDate: convention.signatureDate,
            campaignCode: campaign.code,
            campaignStartDate: campaign.startDate,
            campaignEndDate: campaign.endDate,
            partnerName: partnerInfo.name,
            partnerType: partnerInfo.type,
            dissociatedBy,
            appUrl: config.frontendUrl,
            appName: config.appName,
            supportEmail: config.supportEmail,
            supportPhone: config.supportPhone,
            year: config.year,
          })
      })

      logger.info(
        `Email de notification de dissociation de convention de campagne envoyé à ${email}`
      )
      return true
    } catch (error) {
      logger.error(
        "Erreur lors de l'envoi de l'email de dissociation de convention de campagne:",
        error
      )
      return false
    }
  }
}
