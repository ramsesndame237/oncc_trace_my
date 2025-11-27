import { inject, injectable } from 'tsyringe'
import { SystemErrorCodes } from '@/core/domain/error-codes'
import { DI_TOKENS } from '@/core/infrastructure/di/tokens'
import { ApiError } from '@/core/infrastructure/api/client'
import type { IStoreRepository } from '../../domain/IStoreRepository'
import { StoreWithSync } from '../../domain/store.domain.types'

/**
 * Cas d'usage pour récupérer un magasin par son ID
 */
@injectable()
export class GetStoreByIdUseCase {
  constructor(
    @inject(DI_TOKENS.IStoreRepository)
    private readonly storeRepository: IStoreRepository
  ) {}

  async execute(id: string, isOnline: boolean = true): Promise<StoreWithSync> {
    try {
      // Validation de l'ID
      if (!id) {
        throw new ApiError(
          SystemErrorCodes.INTERNAL_ERROR,
          'ID du magasin requis'
        )
      }

      if (typeof id !== 'string') {
        throw new ApiError(
          SystemErrorCodes.INTERNAL_ERROR,
          'ID du magasin invalide'
        )
      }

      // Récupération du magasin
      const response = await this.storeRepository.getById(id, isOnline)
      return response
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }
      throw new ApiError(
        SystemErrorCodes.INTERNAL_ERROR,
        'Erreur inconnue lors de la récupération du magasin'
      )
    }
  }
}