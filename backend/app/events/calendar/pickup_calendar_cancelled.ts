/**
 * Événement: Notification d'annulation d'un calendrier d'enlèvement
 * Pour notifier :
 * - Les utilisateurs de l'OPA propriétaire
 * - Les utilisateurs de l'acheteur/exportateur de la convention
 */
export interface PickupCalendarCancelledPayload {
  calendarId: string
  calendarCode: string
  startDate: string // Format: YYYY-MM-DD
  endDate: string // Format: YYYY-MM-DD
  location: string
  hierarchicalLocation: string // Localisation hiérarchique
  opaId: string
  opaName: string
  buyerExporterId: string
  buyerExporterName: string
  conventionCode: string
}
