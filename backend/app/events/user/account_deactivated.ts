/**
 * Événement: Notification de désactivation de compte
 */
export interface AccountDeactivatedPayload {
  email: string
  userName: string
  reason?: string
}
