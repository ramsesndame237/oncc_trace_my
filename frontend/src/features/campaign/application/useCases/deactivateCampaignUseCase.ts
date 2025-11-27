import { DI_TOKENS } from "@/core/infrastructure/di/tokens";
import { inject, injectable } from "tsyringe";
import type { ICampaignRepository } from "../../domain/ICampaignRepository";
import type { DeactivateCampaignRequest } from "../../domain/types";

/**
 * Use case pour désactiver une campagne
 */
@injectable()
export class DeactivateCampaignUseCase {
  constructor(
    @inject(DI_TOKENS.ICampaignRepository)
    private repository: ICampaignRepository
  ) {}

  /**
   * Exécute le use case pour désactiver une campagne
   */
  public async execute(
    request: DeactivateCampaignRequest,
    isOnline: boolean
  ): Promise<void> {
    return this.repository.deactivate(request, isOnline);
  }
}
