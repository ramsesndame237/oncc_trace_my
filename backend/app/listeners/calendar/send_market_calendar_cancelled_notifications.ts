import type { MarketCalendarCancelledPayload } from '#events/calendar/market_calendar_cancelled'
import { MarketCalendarEmailService } from '#services/email/market_calendar_email_service'
import { inject } from '@adonisjs/core'
import logger from '@adonisjs/core/services/logger'

/**
 * Listener pour l'envoi des emails de notification d'annulation de calendrier de marché
 */
@inject()
export default class SendMarketCalendarCancelledNotifications {
  constructor(protected marketCalendarEmailService: MarketCalendarEmailService) {}

  async handle(payload: MarketCalendarCancelledPayload) {
    try {
      logger.info(
        `📧 [Background] Envoi emails d'annulation de calendrier de marché ${payload.calendarCode} pour l'OPA ${payload.opaName}`
      )

      const success = await this.marketCalendarEmailService.sendMarketCalendarCancelledNotifications(
        payload.calendarCode,
        payload.startDate,
        payload.endDate,
        payload.location,
        payload.hierarchicalLocation,
        payload.opaId,
        payload.opaName,
        payload.productionBasinId
      )

      if (success) {
        logger.info(
          `✅ [Background] Emails d'annulation de calendrier de marché envoyés avec succès pour ${payload.calendarCode}`
        )
      } else {
        logger.error(
          `❌ [Background] Échec envoi emails d'annulation de calendrier de marché pour ${payload.calendarCode}`
        )
      }
    } catch (error) {
      logger.error(
        `❌ [Background] Erreur envoi emails d'annulation de calendrier de marché pour ${payload.calendarCode}:`,
        error
      )
    }
  }
}
