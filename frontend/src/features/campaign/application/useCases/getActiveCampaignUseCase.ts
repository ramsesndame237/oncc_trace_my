import { DI_TOKENS } from "@/core/infrastructure/di/tokens";
import { inject, injectable } from "tsyringe";
import type { ICampaignRepository } from "../../domain/ICampaignRepository";
import type { CampaignWithSync } from "../../domain/campaign.types";

/**
 * Use case pour récupérer la campagne active
 */
@injectable()
export class GetActiveCampaignUseCase {
  constructor(
    @inject(DI_TOKENS.ICampaignRepository)
    private repository: ICampaignRepository
  ) {}

  /**
   * Exécute le use case pour récupérer la campagne active
   */
  public async execute(isOnline: boolean): Promise<CampaignWithSync | null> {
    return this.repository.getActiveCampaign(isOnline);
  }
}
