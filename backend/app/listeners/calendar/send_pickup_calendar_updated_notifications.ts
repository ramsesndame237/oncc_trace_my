import type { PickupCalendarUpdatedPayload } from '#events/calendar/pickup_calendar_updated'
import { PickupCalendarEmailService } from '#services/email/pickup_calendar_email_service'
import logger from '@adonisjs/core/services/logger'

/**
 * Listener pour l'envoi des emails de notification de modification de calendrier d'enlèvement
 */
export default class SendPickupCalendarUpdatedNotifications {
  async handle(payload: PickupCalendarUpdatedPayload) {
    try {
      logger.info(
        `📧 [Background] Envoi emails de modification de calendrier d'enlèvement ${payload.calendarCode} pour l'OPA ${payload.opaName}`
      )

      const success = await PickupCalendarEmailService.sendPickupCalendarUpdatedNotifications(
        payload.calendarCode,
        payload.startDate,
        payload.endDate,
        payload.location,
        payload.hierarchicalLocation,
        payload.opaId,
        payload.opaName,
        payload.buyerExporterId,
        payload.buyerExporterName,
        payload.conventionCode
      )

      if (success) {
        logger.info(
          `✅ [Background] Emails de modification de calendrier d'enlèvement envoyés avec succès pour ${payload.calendarCode}`
        )
      } else {
        logger.error(
          `❌ [Background] Échec envoi emails de modification de calendrier d'enlèvement pour ${payload.calendarCode}`
        )
      }
    } catch (error) {
      logger.error(
        `❌ [Background] Erreur envoi emails de modification de calendrier d'enlèvement pour ${payload.calendarCode}:`,
        error
      )
    }
  }
}
