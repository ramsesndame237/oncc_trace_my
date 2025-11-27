/**
 * Événement: Réinitialisation de mot de passe par un admin
 */
export interface AdminPasswordResetPayload {
  email: string
  userName: string
  newPassword: string
}
