import User from '#models/user'
import { BaseEmailService } from '#services/email/base_email_service'
import logger from '@adonisjs/core/services/logger'
import mail from '@adonisjs/mail/services/main'

/**
 * Service pour tous les emails de notification de transferts de produits
 */
export class ProductTransferEmailService extends BaseEmailService {
  /**
   * Envoie un email de notification de création de transfert GROUPAGE à l'OPA récepteur
   */
  static async sendGroupageTransferCreatedNotification(
    transferCode: string,
    transferDate: string,
    senderActorName: string,
    receiverActorId: string,
    receiverActorName: string,
    receiverStoreName: string,
    campaignCode: string,
    products: Array<{
      productType: string
      quantity: number
      unit: string
    }>
  ): Promise<boolean> {
    try {
      const config = this.getEmailConfig()

      // Récupérer les utilisateurs de l'OPA récepteur
      const receiverUsers = await User.query()
        .where('actor_id', receiverActorId)
        .where('role', 'actor_manager')
        .whereNull('deleted_at')
        .exec()

      logger.info(
        `📧 Envoi emails transfert groupage à ${receiverUsers.length} utilisateur(s) de l'OPA récepteur`
      )

      // Envoyer email à l'OPA récepteur
      for (const user of receiverUsers) {
        await mail.send((message) => {
          message
            .to(user.email)
            .from(config.fromEmail, config.fromName)
            .subject(`Nouveau transfert de produits reçu - ${config.appName}`)
            .htmlView('emails/product_transfer/groupage_transfer_created_receiver', {
              userName: `${user.givenName} ${user.familyName}`,
              receiverActorName,
              senderActorName,
              transferCode,
              transferDate,
              receiverStoreName,
              campaignCode,
              products,
              appUrl: config.frontendUrl,
              appName: config.appName,
              supportEmail: config.supportEmail,
              supportPhone: config.supportPhone,
              year: config.year,
            })
        })
      }

      logger.info(
        `✅ Emails de création de transfert groupage envoyés à ${receiverUsers.length} destinataire(s)`
      )

      return true
    } catch (error) {
      logger.error("Erreur lors de l'envoi des emails de transfert groupage:", error)
      return false
    }
  }

  /**
   * Envoie un email de notification d'annulation de transfert GROUPAGE à l'OPA récepteur
   */
  static async sendGroupageTransferCancelledNotification(
    transferCode: string,
    transferDate: string,
    senderActorName: string,
    receiverActorId: string,
    receiverActorName: string,
    receiverStoreName: string,
    campaignCode: string,
    products: Array<{
      productType: string
      quantity: number
      unit: string
    }>,
    cancellationReason?: string
  ): Promise<boolean> {
    try {
      const config = this.getEmailConfig()

      // Récupérer les utilisateurs de l'OPA récepteur
      const receiverUsers = await User.query()
        .where('actor_id', receiverActorId)
        .where('role', 'actor_manager')
        .whereNull('deleted_at')
        .exec()

      logger.info(
        `📧 Envoi emails d'annulation transfert groupage à ${receiverUsers.length} utilisateur(s) de l'OPA récepteur`
      )

      // Envoyer email à l'OPA récepteur
      for (const user of receiverUsers) {
        await mail.send((message) => {
          message
            .to(user.email)
            .from(config.fromEmail, config.fromName)
            .subject(`Transfert de produits annulé - ${config.appName}`)
            .htmlView('emails/product_transfer/groupage_transfer_cancelled_receiver', {
              userName: `${user.givenName} ${user.familyName}`,
              receiverActorName,
              senderActorName,
              transferCode,
              transferDate,
              receiverStoreName,
              campaignCode,
              products,
              cancellationReason,
              appUrl: config.frontendUrl,
              appName: config.appName,
              supportEmail: config.supportEmail,
              supportPhone: config.supportPhone,
              year: config.year,
            })
        })
      }

      logger.info(
        `✅ Emails d'annulation de transfert groupage envoyés à ${receiverUsers.length} destinataire(s)`
      )

      return true
    } catch (error) {
      logger.error("Erreur lors de l'envoi des emails d'annulation de transfert groupage:", error)
      return false
    }
  }

  /**
   * Envoie des emails de notification de création de transfert STANDARD au sender ET au receiver
   */
  static async sendStandardTransferCreatedNotifications(
    transferCode: string,
    transferDate: string,
    senderActorId: string,
    senderActorName: string,
    senderStoreName: string,
    receiverActorId: string,
    receiverActorName: string,
    receiverStoreName: string,
    campaignCode: string,
    products: Array<{
      productType: string
      quantity: number
      unit: string
    }>,
    driverInfo?: {
      fullName: string
      vehicleRegistration: string
      drivingLicenseNumber: string
      routeSheetCode: string
    }
  ): Promise<boolean> {
    try {
      const config = this.getEmailConfig()

      // Récupérer les utilisateurs du sender
      const senderUsers = await User.query()
        .where('actor_id', senderActorId)
        .where('role', 'actor_manager')
        .whereNull('deleted_at')
        .exec()

      // Récupérer les utilisateurs du receiver
      const receiverUsers = await User.query()
        .where('actor_id', receiverActorId)
        .where('role', 'actor_manager')
        .whereNull('deleted_at')
        .exec()

      logger.info(
        `📧 Envoi emails transfert standard à ${senderUsers.length} sender(s) et ${receiverUsers.length} receiver(s)`
      )

      // Envoyer email aux senders
      for (const user of senderUsers) {
        await mail.send((message) => {
          message
            .to(user.email)
            .from(config.fromEmail, config.fromName)
            .subject(`Transfert de produits enregistré - ${config.appName}`)
            .htmlView('emails/product_transfer/standard_transfer_created_sender', {
              userName: `${user.givenName} ${user.familyName}`,
              senderActorName,
              senderStoreName,
              receiverActorName,
              receiverStoreName,
              transferCode,
              transferDate,
              campaignCode,
              products,
              driverFullName: driverInfo?.fullName,
              driverVehicleRegistration: driverInfo?.vehicleRegistration,
              driverLicenseNumber: driverInfo?.drivingLicenseNumber,
              driverRouteSheetCode: driverInfo?.routeSheetCode,
              appUrl: config.frontendUrl,
              appName: config.appName,
              supportEmail: config.supportEmail,
              supportPhone: config.supportPhone,
              year: config.year,
            })
        })
      }

      // Envoyer email aux receivers
      for (const user of receiverUsers) {
        await mail.send((message) => {
          message
            .to(user.email)
            .from(config.fromEmail, config.fromName)
            .subject(`Nouveau transfert de produits - ${config.appName}`)
            .htmlView('emails/product_transfer/standard_transfer_created_receiver', {
              userName: `${user.givenName} ${user.familyName}`,
              senderActorName,
              senderStoreName,
              receiverActorName,
              receiverStoreName,
              transferCode,
              transferDate,
              campaignCode,
              products,
              driverFullName: driverInfo?.fullName,
              driverVehicleRegistration: driverInfo?.vehicleRegistration,
              driverLicenseNumber: driverInfo?.drivingLicenseNumber,
              driverRouteSheetCode: driverInfo?.routeSheetCode,
              appUrl: config.frontendUrl,
              appName: config.appName,
              supportEmail: config.supportEmail,
              supportPhone: config.supportPhone,
              year: config.year,
            })
        })
      }

      logger.info(
        `✅ Emails de création de transfert standard envoyés à ${senderUsers.length + receiverUsers.length} destinataire(s)`
      )

      return true
    } catch (error) {
      logger.error("Erreur lors de l'envoi des emails de transfert standard:", error)
      return false
    }
  }

  /**
   * Envoie des emails de notification d'annulation de transfert STANDARD au sender ET au receiver
   */
  static async sendStandardTransferCancelledNotifications(
    transferCode: string,
    transferDate: string,
    senderActorId: string,
    senderActorName: string,
    senderStoreName: string,
    receiverActorId: string,
    receiverActorName: string,
    receiverStoreName: string,
    campaignCode: string,
    products: Array<{
      productType: string
      quantity: number
      unit: string
    }>,
    driverInfo?: {
      fullName: string
      vehicleRegistration: string
      drivingLicenseNumber: string
      routeSheetCode: string
    },
    cancellationReason?: string
  ): Promise<boolean> {
    try {
      const config = this.getEmailConfig()

      // Récupérer les utilisateurs du sender
      const senderUsers = await User.query()
        .where('actor_id', senderActorId)
        .where('role', 'actor_manager')
        .whereNull('deleted_at')
        .exec()

      // Récupérer les utilisateurs du receiver
      const receiverUsers = await User.query()
        .where('actor_id', receiverActorId)
        .where('role', 'actor_manager')
        .whereNull('deleted_at')
        .exec()

      logger.info(
        `📧 Envoi emails annulation transfert standard à ${senderUsers.length} sender(s) et ${receiverUsers.length} receiver(s)`
      )

      // Envoyer email aux senders
      for (const user of senderUsers) {
        await mail.send((message) => {
          message
            .to(user.email)
            .from(config.fromEmail, config.fromName)
            .subject(`Transfert de produits annulé - ${config.appName}`)
            .htmlView('emails/product_transfer/standard_transfer_cancelled_sender', {
              userName: `${user.givenName} ${user.familyName}`,
              senderActorName,
              senderStoreName,
              receiverActorName,
              receiverStoreName,
              transferCode,
              transferDate,
              campaignCode,
              products,
              driverFullName: driverInfo?.fullName,
              driverVehicleRegistration: driverInfo?.vehicleRegistration,
              driverLicenseNumber: driverInfo?.drivingLicenseNumber,
              driverRouteSheetCode: driverInfo?.routeSheetCode,
              cancellationReason,
              appUrl: config.frontendUrl,
              appName: config.appName,
              supportEmail: config.supportEmail,
              supportPhone: config.supportPhone,
              year: config.year,
            })
        })
      }

      // Envoyer email aux receivers
      for (const user of receiverUsers) {
        await mail.send((message) => {
          message
            .to(user.email)
            .from(config.fromEmail, config.fromName)
            .subject(`Transfert de produits annulé - ${config.appName}`)
            .htmlView('emails/product_transfer/standard_transfer_cancelled_receiver', {
              userName: `${user.givenName} ${user.familyName}`,
              senderActorName,
              senderStoreName,
              receiverActorName,
              receiverStoreName,
              transferCode,
              transferDate,
              campaignCode,
              products,
              driverFullName: driverInfo?.fullName,
              driverVehicleRegistration: driverInfo?.vehicleRegistration,
              driverLicenseNumber: driverInfo?.drivingLicenseNumber,
              driverRouteSheetCode: driverInfo?.routeSheetCode,
              cancellationReason,
              appUrl: config.frontendUrl,
              appName: config.appName,
              supportEmail: config.supportEmail,
              supportPhone: config.supportPhone,
              year: config.year,
            })
        })
      }

      logger.info(
        `✅ Emails d'annulation de transfert standard envoyés à ${senderUsers.length + receiverUsers.length} destinataire(s)`
      )

      return true
    } catch (error) {
      logger.error("Erreur lors de l'envoi des emails d'annulation de transfert standard:", error)
      return false
    }
  }
}
