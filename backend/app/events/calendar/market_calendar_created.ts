/**
 * Événement: Notification de création d'un calendrier de marché
 * Pour notifier :
 * - Les utilisateurs de l'OPA propriétaire
 * - Les basin admin et field agent du même bassin de production
 * - Les autres OPA du même bassin de production
 * - Tous les acteurs acheteurs, exportateurs et transformateurs du système
 */
export interface MarketCalendarCreatedPayload {
  calendarId: string
  calendarCode: string
  startDate: string // Format: YYYY-MM-DD
  endDate: string // Format: YYYY-MM-DD
  location: string
  hierarchicalLocation: string // Localisation hiérarchique (ex: "Centre > Mfoundi > Yaoundé 1 > Bastos")
  opaId: string
  opaName: string
  productionBasinId: string
}
