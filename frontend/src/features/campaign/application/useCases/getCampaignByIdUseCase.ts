import { DI_TOKENS } from "@/core/infrastructure/di/tokens";
import { inject, injectable } from "tsyringe";
import type { ICampaignRepository } from "../../domain/ICampaignRepository";
import type { CampaignWithSync } from "../../domain/campaign.types";

/**
 * Use case pour récupérer une campagne par son ID
 */
@injectable()
export class GetCampaignByIdUseCase {
  constructor(
    @inject(DI_TOKENS.ICampaignRepository)
    private repository: ICampaignRepository
  ) {}

  /**
   * Exécute le use case pour récupérer une campagne par son ID
   */
  public async execute(
    id: string,
    isOnline: boolean
  ): Promise<CampaignWithSync> {
    return this.repository.getById(id, isOnline);
  }
}