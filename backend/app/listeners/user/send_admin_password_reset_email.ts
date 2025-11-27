import type { AdminPasswordResetPayload } from '#events/user/admin_password_reset'
import { UserEmailService } from '#services/email/user_email_service'
import logger from '@adonisjs/core/services/logger'

/**
 * Listener pour l'envoi de l'email de réinitialisation de mot de passe par admin
 */
export default class SendAdminPasswordResetEmail {
  async handle(payload: AdminPasswordResetPayload) {
    try {
      logger.info(
        `📧 [Background] Envoi email de réinitialisation de mot de passe par admin à ${payload.email}`
      )

      const success = await UserEmailService.sendAdminPasswordResetEmail(
        payload.email,
        payload.userName,
        payload.newPassword
      )

      if (success) {
        logger.info(
          `✅ [Background] Email de réinitialisation de mot de passe par admin envoyé avec succès à ${payload.email}`
        )
      } else {
        logger.error(
          `❌ [Background] Échec envoi email de réinitialisation de mot de passe par admin à ${payload.email}`
        )
      }
    } catch (error) {
      logger.error(
        `❌ [Background] Erreur envoi email de réinitialisation de mot de passe par admin à ${payload.email}:`,
        error
      )
    }
  }
}
