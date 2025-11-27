import { DI_TOKENS } from '@/core/infrastructure/di/tokens'
import { inject, injectable } from 'tsyringe'
import type { ICalendarRepository } from '../../domain/ICalendarRepository'
import type { CreateCalendarRequest } from '../../domain/types/request'

/**
 * Use case pour créer un nouveau calendrier
 */
@injectable()
export class CreateCalendarUseCase {
  constructor(
    @inject(DI_TOKENS.ICalendarRepository)
    private repository: ICalendarRepository
  ) {}

  /**
   * Exécute le use case pour créer un calendrier
   * @param payload - Données du calendrier à créer
   * @param isOnline - Indique si l'application est en ligne
   */
  public async execute(payload: CreateCalendarRequest, isOnline: boolean = true): Promise<void> {
    return this.repository.create(payload, isOnline)
  }
}
