import { inject, injectable } from 'tsyringe'
import { DI_TOKENS } from '@/core/infrastructure/di/tokens'
import type { ICalendarRepository } from '../../domain/ICalendarRepository'
import type {
  CalendarFilters,
  GetCalendarsResult,
} from '../../domain/Calendar'

@injectable()
export class GetCalendarsUseCase {
  constructor(
    @inject(DI_TOKENS.ICalendarRepository)
    private calendarRepository: ICalendarRepository
  ) {}

  async execute(
    filters: CalendarFilters,
    isOnline: boolean
  ): Promise<GetCalendarsResult> {
    return this.calendarRepository.getAll(filters, isOnline)
  }
}
