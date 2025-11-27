import { DI_TOKENS } from '@/core/infrastructure/di/tokens'
import { inject, injectable } from 'tsyringe'
import type { CalendarWithSync } from '../../domain/Calendar'
import type { ICalendarRepository } from '../../domain/ICalendarRepository'

/**
 * Use case pour mettre à jour le nombre de ventes attendues d'un calendrier
 */
@injectable()
export class UpdateExpectedSalesCountUseCase {
  constructor(
    @inject(DI_TOKENS.ICalendarRepository)
    private calendarRepository: ICalendarRepository
  ) {}

  /**
   * Exécute la mise à jour du nombre de ventes attendues
   * @param id - ID du calendrier
   * @param code - Code du calendrier pour confirmation
   * @param expectedSalesCount - Nouveau nombre de ventes attendues
   * @returns Le calendrier mis à jour
   */
  async execute(
    id: string,
    code: string,
    expectedSalesCount: number
  ): Promise<CalendarWithSync> {
    return this.calendarRepository.updateExpectedSalesCount(id, code, expectedSalesCount)
  }
}
