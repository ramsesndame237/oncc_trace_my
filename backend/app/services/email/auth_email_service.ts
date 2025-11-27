import env from '#start/env'
import { BaseEmailService } from '#services/email/base_email_service'
import logger from '@adonisjs/core/services/logger'
import mail from '@adonisjs/mail/services/main'

/**
 * Service pour tous les emails d'authentification
 */
export class AuthEmailService extends BaseEmailService {
  /**
   * Envoie un code OTP par email
   */
  static async sendOTP(email: string, otpCode: string, userName?: string): Promise<boolean> {
    try {
      const config = this.getEmailConfig()

      await mail.send((message) => {
        message
          .to(email)
          .from(config.fromEmail, config.fromName)
          .subject(`Code de vérification ${config.appName}`)
          .htmlView('emails/auth/otp', {
            otpCode,
            userName: userName || 'Utilisateur',
            validityMinutes: 10,
            appName: config.appName,
            supportEmail: config.supportEmail,
            supportPhone: config.supportPhone,
            year: config.year,
          })
      })

      logger.info(`OTP envoyé avec succès à ${email}`)
      return true
    } catch (error) {
      logger.error({
        err: error,
        message: "Erreur lors de l'envoi de l'OTP",
        email,
        errorMessage: error.message,
        errorStack: error.stack,
      })

      // En mode développement, on affiche le code dans les logs
      if (env.get('NODE_ENV') === 'development') {
        logger.info(`[DEV] Code OTP pour ${email}: ${otpCode}`)
      }

      return false
    }
  }

  /**
   * Envoie un email de notification de changement de mot de passe
   */
  static async sendPasswordChangeNotification(email: string, userName?: string): Promise<boolean> {
    try {
      const config = this.getEmailConfig()

      await mail.send((message) => {
        message
          .to(email)
          .from(config.fromEmail, config.fromName)
          .subject(`Mot de passe modifié - ${config.appName}`)
          .htmlView('emails/auth/password_changed', {
            userName: userName || 'Utilisateur',
            changeDate: new Date().toLocaleString('fr-FR'),
            appName: config.appName,
            supportEmail: config.supportEmail,
            supportPhone: config.supportPhone,
            year: config.year,
          })
      })

      logger.info(`Notification de changement de mot de passe envoyée à ${email}`)
      return true
    } catch (error) {
      logger.error("Erreur lors de l'envoi de la notification:", error)
      return false
    }
  }

  /**
   * Envoie un email de bienvenue pour un nouveau compte
   */
  static async sendWelcomeEmail(
    email: string,
    userName: string,
    tempPassword: string
  ): Promise<boolean> {
    try {
      const config = this.getEmailConfig()

      await mail.send((message) => {
        message
          .to(email)
          .from(config.fromEmail, config.fromName)
          .subject(`Bienvenue - Votre compte a été créé - ${config.appName}`)
          .htmlView('emails/auth/welcome', {
            userName,
            tempPassword,
            loginUrl: `${config.frontendUrl}/auth/login`,
            appName: config.appName,
            supportEmail: config.supportEmail,
            supportPhone: config.supportPhone,
            year: config.year,
          })
      })

      logger.info(`Email de bienvenue envoyé à ${email}`)
      return true
    } catch (error) {
      logger.error("Erreur lors de l'envoi de l'email de bienvenue:", error)
      return false
    }
  }

  /**
   * Envoie un email de notification d'initialisation de compte
   */
  static async sendAccountInitializationNotification(
    email: string,
    userName?: string
  ): Promise<boolean> {
    try {
      const config = this.getEmailConfig()

      await mail.send((message) => {
        message
          .to(email)
          .from(config.fromEmail, config.fromName)
          .subject(`Compte initialisé avec succès - ${config.appName}`)
          .htmlView('emails/auth/account_initialized', {
            userName: userName || 'Utilisateur',
            initializationDate: new Date().toLocaleString('fr-FR'),
            appName: config.appName,
            supportEmail: config.supportEmail,
            supportPhone: config.supportPhone,
            year: config.year,
          })
      })

      logger.info(`Notification d'initialisation de compte envoyée à ${email}`)
      return true
    } catch (error) {
      logger.error("Erreur lors de l'envoi de la notification d'initialisation:", error)
      return false
    }
  }

  /**
   * Envoie un email avec le pseudo de l'utilisateur
   */
  static async sendUserNameRecoveryEmail(
    email: string,
    username: string,
    userName?: string
  ): Promise<boolean> {
    try {
      const config = this.getEmailConfig()

      await mail.send((message) => {
        message
          .to(email)
          .from(config.fromEmail, config.fromName)
          .subject(`Récupération de votre pseudo - ${config.appName}`)
          .htmlView('emails/auth/pseudo_recovery', {
            userName: userName || 'Utilisateur',
            username,
            appName: config.appName,
            supportEmail: config.supportEmail,
            supportPhone: config.supportPhone,
            year: config.year,
          })
      })

      logger.info(`Pseudo de récupération envoyé à ${email}`)
      return true
    } catch (error) {
      logger.error("Erreur lors de l'envoi du pseudo de récupération:", error)
      return false
    }
  }

  /**
   * Envoie un email avec le lien de réinitialisation de mot de passe
   */
  static async sendPasswordResetLinkEmail(
    email: string,
    resetToken: string,
    userName?: string
  ): Promise<boolean> {
    try {
      const config = this.getEmailConfig()
      const resetUrl = `${config.frontendUrl}/auth/recovery/security-check?token=${resetToken}`

      await mail.send((message) => {
        message
          .to(email)
          .from(config.fromEmail, config.fromName)
          .subject(`Réinitialisation de votre mot de passe - ${config.appName}`)
          .htmlView('emails/auth/password_reset_link', {
            userName: userName || 'Utilisateur',
            resetUrl,
            resetToken,
            expirationMinutes: 30,
            appName: config.appName,
            supportEmail: config.supportEmail,
            supportPhone: config.supportPhone,
            year: config.year,
          })
      })

      logger.info(`Lien de réinitialisation de mot de passe envoyé à ${email}`)
      return true
    } catch (error) {
      logger.error("Erreur lors de l'envoi du lien de réinitialisation:", error)
      return false
    }
  }

  /**
   * Envoie un email de notification d'activation de compte
   */
  static async sendAccountActivatedEmail(
    email: string,
    user: {
      fullName: string
      username: string
      role: string
      productionBasin?: { name: string }
    }
  ): Promise<boolean> {
    try {
      const config = this.getEmailConfig()

      await mail.send((message) => {
        message
          .to(email)
          .from(config.fromEmail, config.fromName)
          .subject(`Activation de votre compte - ${config.appName}`)
          .htmlView('emails/user/account_activated', {
            user: {
              fullName: user.fullName,
              username: user.username,
              email,
              role: user.role,
              productionBasin: user.productionBasin,
            },
            activationDate: new Date().toLocaleString('fr-FR'),
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
      logger.error("Erreur lors de l'envoi de l'email d'activation:", error)
      return false
    }
  }

  /**
   * Envoie un email de notification de désactivation de compte
   */
  static async sendAccountDeactivatedEmail(
    email: string,
    user: {
      fullName: string
      username: string
      role: string
      productionBasin?: { name: string }
    },
    reason?: string
  ): Promise<boolean> {
    try {
      const config = this.getEmailConfig()

      await mail.send((message) => {
        message
          .to(email)
          .from(config.fromEmail, config.fromName)
          .subject(`Désactivation de votre compte - ${config.appName}`)
          .htmlView('emails/user/account_deactivated', {
            user: {
              fullName: user.fullName,
              username: user.username,
              email,
              role: user.role,
              productionBasin: user.productionBasin,
            },
            deactivationDate: new Date().toLocaleString('fr-FR'),
            reason,
            appName: config.appName,
            supportEmail: config.supportEmail,
            supportPhone: config.supportPhone,
            year: config.year,
          })
      })

      logger.info(`Email de désactivation de compte envoyé à ${email}`)
      return true
    } catch (error) {
      logger.error("Erreur lors de l'envoi de l'email de désactivation:", error)
      return false
    }
  }

  /**
   * Envoie un email de notification de réinitialisation de mot de passe par un administrateur
   */
  static async sendAdminPasswordResetEmail(
    email: string,
    user: {
      fullName: string
      username: string
    },
    admin: {
      fullName: string
      role: string
    },
    defaultPassword: string
  ): Promise<boolean> {
    try {
      const config = this.getEmailConfig()

      await mail.send((message) => {
        message
          .to(email)
          .from(config.fromEmail, config.fromName)
          .subject(`Réinitialisation de votre mot de passe - ${config.appName}`)
          .htmlView('emails/user/admin_password_reset', {
            userName: user.fullName,
            username: user.username,
            defaultPassword,
            adminName: admin.fullName,
            adminRole: admin.role,
            resetDate: new Date().toLocaleString('fr-FR'),
            loginUrl: `${config.frontendUrl}/auth/login`,
            appName: config.appName,
            supportEmail: config.supportEmail,
            supportPhone: config.supportPhone,
            year: config.year,
          })
      })

      logger.info(`Email de réinitialisation de mot de passe par admin envoyé à ${email}`)
      return true
    } catch (error) {
      logger.error("Erreur lors de l'envoi de l'email de réinitialisation par admin:", error)
      return false
    }
  }

  /**
   * Envoie un email de bienvenue pour un gestionnaire d'acteur
   */
  static async sendActorManagerWelcomeEmail(
    email: string,
    managerName: string,
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
          .subject(`Bienvenue - Gestionnaire d'acteur - ${config.appName}`)
          .htmlView('emails/user/actor_manager_welcome', {
            managerName,
            username,
            tempPassword,
            actorInfo: {
              name: actorInfo.name,
              type: actorInfo.type,
              location: actorInfo.location,
            },
            loginUrl: `${config.frontendUrl}/auth/login`,
            appName: config.appName,
            supportEmail: config.supportEmail,
            supportPhone: config.supportPhone,
            year: config.year,
          })
      })

      logger.info(`Email de bienvenue gestionnaire d'acteur envoyé à ${email}`)
      return true
    } catch (error) {
      logger.error("Erreur lors de l'envoi de l'email de bienvenue gestionnaire:", error)
      return false
    }
  }
}
