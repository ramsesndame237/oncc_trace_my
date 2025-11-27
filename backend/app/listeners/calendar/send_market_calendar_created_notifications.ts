import type { MarketCalendarCreatedPayload } from '#events/calendar/market_calendar_created'
import { MarketCalendarEmailService } from '#services/email/market_calendar_email_service'
import { inject } from '@adonisjs/core'
import logger from '@adonisjs/core/services/logger'

/**
 * Listener pour l'envoi des emails de notification de création de calendrier de marché
 */
@inject()
export default class SendMarketCalendarCreatedNotifications {
  constructor(protected marketCalendarEmailService: MarketCalendarEmailService) {}

  async handle(payload: MarketCalendarCreatedPayload) {
    try {
      logger.info(
        `📧 [Background] Envoi emails de création de calendrier de marché ${payload.calendarCode} pour l'OPA ${payload.opaName}`
      )

      const success = await this.marketCalendarEmailService.sendMarketCalendarCreatedNotifications(
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
          `✅ [Background] Emails de calendrier de marché envoyés avec succès pour ${payload.calendarCode}`
        )
      } else {
        logger.error(
          `❌ [Background] Échec envoi emails de calendrier de marché pour ${payload.calendarCode}`
        )
      }
    } catch (error) {
      logger.error(
        `❌ [Background] Erreur envoi emails de calendrier de marché pour ${payload.calendarCode}:`,
        error
      )
    }
  }
}
