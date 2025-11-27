import { DI_TOKENS } from '@/core/infrastructure/di/tokens'
import { inject, injectable } from 'tsyringe'
import type { CalendarStatus, CalendarWithSync } from '../../domain/Calendar'
import type { ICalendarRepository } from '../../domain/ICalendarRepository'

/**
 * Use case pour mettre à jour le statut d'un calendrier
 */
@injectable()
export class UpdateCalendarStatusUseCase {
  constructor(
    @inject(DI_TOKENS.ICalendarRepository)
    private calendarRepository: ICalendarRepository
  ) {}

  /**
   * Exécute la mise à jour du statut
   * @param id - ID du calendrier
   * @param code - Code du calendrier pour confirmation
   * @param status - Nouveau statut (active ou inactive)
   * @returns Le calendrier mis à jour
   */
  async execute(
    id: string,
    code: string,
    status: CalendarStatus
  ): Promise<CalendarWithSync> {
    return this.calendarRepository.updateStatus(id, code, status)
  }
}
