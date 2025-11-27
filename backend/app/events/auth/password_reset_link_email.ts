/**
 * Événement: Lien de réinitialisation de mot de passe
 */
export interface PasswordResetLinkEmailPayload {
  email: string
  resetToken: string
  userName: string
}
