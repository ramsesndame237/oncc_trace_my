import { DI_TOKENS } from '@/core/infrastructure/di/tokens'
import { inject, injectable } from 'tsyringe'
import type { ICalendarRepository } from '../../domain/ICalendarRepository'
import type { UpdateCalendarRequest } from '../../domain/types/request'

/**
 * Use case pour mettre à jour un calendrier
 */
@injectable()
export class UpdateCalendarUseCase {
  constructor(
    @inject(DI_TOKENS.ICalendarRepository)
    private repository: ICalendarRepository
  ) {}

  /**
   * Exécute le use case pour mettre à jour un calendrier
   * @param id - ID du calendrier à mettre à jour
   * @param request - Données à mettre à jour
   * @param editOffline - Si true, modifie l'opération pendante existante
   */
  public async execute(
    id: string,
    request: UpdateCalendarRequest,
    editOffline?: boolean
  ): Promise<void> {
    await this.repository.update(id, request, editOffline)
  }
}
