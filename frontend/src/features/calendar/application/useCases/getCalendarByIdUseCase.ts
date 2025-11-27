import { DI_TOKENS } from '@/core/infrastructure/di/tokens'
import { inject, injectable } from 'tsyringe'
import type { ICalendarRepository } from '../../domain/ICalendarRepository'
import type { CalendarWithSync } from '../../domain/Calendar'

/**
 * Use case pour récupérer un calendrier par son ID
 */
@injectable()
export class GetCalendarByIdUseCase {
  constructor(
    @inject(DI_TOKENS.ICalendarRepository)
    private repository: ICalendarRepository
  ) {}

  /**
   * Exécute le use case pour récupérer un calendrier par son ID
   * @param id - ID du calendrier à récupérer
   * @param isOnline - Indique si l'application est en ligne
   */
  public async execute(
    id: string,
    isOnline: boolean = true
  ): Promise<CalendarWithSync> {
    return await this.repository.getById(id, isOnline)
  }
}
