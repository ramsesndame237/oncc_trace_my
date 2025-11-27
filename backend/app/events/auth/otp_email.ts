/**
 * Événement: Envoi d'OTP par email
 */
export interface OtpEmailPayload {
  email: string
  otpCode: string
  userName: string
}
