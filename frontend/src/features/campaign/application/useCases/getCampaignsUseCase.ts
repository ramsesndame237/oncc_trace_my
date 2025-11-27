import { DI_TOKENS } from "@/core/infrastructure/di/tokens";
import { inject, injectable } from "tsyringe";
import type { ICampaignRepository, GetCampaignsResult } from "../../domain/ICampaignRepository";
import type { CampaignFilters } from "../../domain/campaign.types";

/**
 * Use case pour récupérer toutes les campagnes
 */
@injectable()
export class GetCampaignsUseCase {
  constructor(
    @inject(DI_TOKENS.ICampaignRepository)
    private repository: ICampaignRepository
  ) {}

  /**
   * Exécute le use case pour récupérer toutes les campagnes
   */
  public async execute(
    isOnline: boolean,
    filters?: CampaignFilters
  ): Promise<GetCampaignsResult> {
    return this.repository.getAll(isOnline, filters);
  }
}