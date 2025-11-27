/**
 * Événement: Notification d'annulation d'un calendrier de marché
 * Pour notifier :
 * - Les utilisateurs de l'OPA propriétaire
 * - Les basin admin et field agent du même bassin de production
 * - Les autres OPAs du même bassin de production
 * - Tous les acheteurs, exportateurs et transformateurs du système
 */
export interface MarketCalendarCancelledPayload {
  calendarId: string
  calendarCode: string
  startDate: string // Format: YYYY-MM-DD
  endDate: string // Format: YYYY-MM-DD
  location: string
  hierarchicalLocation: string // Localisation hiérarchique
  opaId: string
  opaName: string
  productionBasinId: string
}
