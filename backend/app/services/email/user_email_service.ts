import { BaseEmailService } from '#services/email/base_email_service'
import logger from '@adonisjs/core/services/logger'
import mail from '@adonisjs/mail/services/main'

/**
 * Service pour tous les emails de gestion des utilisateurs
 */
export class UserEmailService extends BaseEmailService {
  /**
   * Envoie un email de bienvenue avec le mot de passe temporaire
   */
  static async sendWelcomeEmail(
    email: string,
    userName: string,
    username: string,
    tempPassword: string
  ): Promise<boolean> {
    try {
      const config = this.getEmailConfig()

      await mail.send((message) => {
        message
          .to(email)
          .from(config.fromEmail, config.fromName)
          .subject(`Bienvenue sur ${config.appName}`)
          .htmlView('emails/user/welcome', {
            userName,
            username,
            tempPassword,
            loginUrl: `${config.frontendUrl}/auth/login`,
            appUrl: config.frontendUrl,
            appName: config.appName,
            supportEmail: config.supportEmail,
            supportPhone: config.supportPhone,
            year: config.year,
          })
      })

      logger.info(`Email de bienvenue envoyé à ${email}`)
      return true
    } catch (error) {
      logger.error("Erreur lors de l'envoi de l'email de bienvenue:", {
        email,
        errorMessage: error.message,
        errorCode: error.code,
        errorStack: error.stack,
      })
      return false
    }
  }

  /**
   * Envoie un email de notification d'activation de compte
   */
  static async sendAccountActivatedEmail(email: string, userName: string): Promise<boolean> {
    try {
      const config = this.getEmailConfig()

      await mail.send((message) => {
        message
          .to(email)
          .from(config.fromEmail, config.fromName)
          .subject(`Votre compte a été activé - ${config.appName}`)
          .htmlView('emails/user/account_activated', {
            userName,
            appUrl: config.frontendUrl,
            appName: config.appName,
            supportEmail: config.supportEmail,
            supportPhone: config.supportPhone,
            year: config.year,
          })
      })

      logger.info(`Email d'activation de compte envoyé à ${email}`)
      return true
    } catch (error) {
      logger.error("Erreur lors de l'envoi de l'email d'activation de compte:", error)
      return false
    }
  }

  /**
   * Envoie un email de notification de désactivation de compte
   */
  static async sendAccountDeactivatedEmail(
    email: string,
    userName: string,
    reason?: string
  ): Promise<boolean> {
    try {
      const config = this.getEmailConfig()

      await mail.send((message) => {
        message
          .to(email)
          .from(config.fromEmail, config.fromName)
          .subject(`Votre compte a été désactivé - ${config.appName}`)
          .htmlView('emails/user/account_deactivated', {
            userName,
            reason: reason || 'Aucune raison spécifiée',
            appName: config.appName,
            supportEmail: config.supportEmail,
            supportPhone: config.supportPhone,
            year: config.year,
          })
      })

      logger.info(`Email de désactivation de compte envoyé à ${email}`)
      return true
    } catch (error) {
      logger.error("Erreur lors de l'envoi de l'email de désactivation de compte:", error)
      return false
    }
  }

  /**
   * Envoie un email de notification de réinitialisation de mot de passe par un admin
   */
  static async sendAdminPasswordResetEmail(
    email: string,
    userName: string,
    newPassword: string
  ): Promise<boolean> {
    try {
      const config = this.getEmailConfig()

      await mail.send((message) => {
        message
          .to(email)
          .from(config.fromEmail, config.fromName)
          .subject(`Votre mot de passe a été réinitialisé - ${config.appName}`)
          .htmlView('emails/user/admin_password_reset', {
            userName,
            newPassword,
            appUrl: config.frontendUrl,
            appName: config.appName,
            supportEmail: config.supportEmail,
            supportPhone: config.supportPhone,
            year: config.year,
          })
      })

      logger.info(`Email de réinitialisation de mot de passe par admin envoyé à ${email}`)
      return true
    } catch (error) {
      logger.error(
        "Erreur lors de l'envoi de l'email de réinitialisation de mot de passe par admin:",
        error
      )
      return false
    }
  }

  /**
   * Envoie un email de bienvenue à un manager d'acteur
   */
  static async sendActorManagerWelcomeEmail(
    email: string,
    userName: string,
    username: string,
    tempPassword: string,
    actorInfo: {
      name: string
      type: string
      location?: string
    }
  ): Promise<boolean> {
    try {
      const config = this.getEmailConfig()

      await mail.send((message) => {
        message
          .to(email)
          .from(config.fromEmail, config.fromName)
          .subject(`Bienvenue en tant que Manager - ${config.appName}`)
          .htmlView('emails/user/actor_manager_welcome', {
            userName,
            username,
            tempPassword,
            actorName: actorInfo.name,
            actorType: actorInfo.type,
            actorLocation: actorInfo.location || 'Non spécifiée',
            appUrl: config.frontendUrl,
            appName: config.appName,
            supportEmail: config.supportEmail,
            supportPhone: config.supportPhone,
            year: config.year,
          })
      })

      logger.info(`Email de bienvenue manager d'acteur envoyé à ${email}`)
      return true
    } catch (error) {
      logger.error("Erreur lors de l'envoi de l'email de bienvenue manager d'acteur:", {
        email,
        errorMessage: error.message,
        errorCode: error.code,
        errorStack: error.stack,
      })
      return false
    }
  }
}
