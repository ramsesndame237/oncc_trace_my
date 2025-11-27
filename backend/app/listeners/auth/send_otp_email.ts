import type { OtpEmailPayload } from '#events/auth/otp_email'
import { AuthEmailService } from '#services/email/auth_email_service'
import logger from '@adonisjs/core/services/logger'

/**
 * Listener pour l'envoi d'OTP
 */
export default class SendOtpEmail {
  async handle(payload: OtpEmailPayload) {
    try {
      logger.info(`📧 [Background] Envoi OTP à ${payload.email}`)
      const success = await AuthEmailService.sendOTP(payload.email, payload.otpCode, payload.userName)
      if (success) {
        logger.info(`✅ [Background] OTP envoyé à ${payload.email}`)
      } else {
        logger.warn(`⚠️ [Background] Échec envoi OTP à ${payload.email}`)
      }
    } catch (error) {
      logger.error(`❌ [Background] Erreur envoi OTP à ${payload.email}:`, error)
    }
  }
}
