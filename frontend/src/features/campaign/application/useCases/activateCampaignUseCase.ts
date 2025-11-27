import { DI_TOKENS } from "@/core/infrastructure/di/tokens";
import { inject, injectable } from "tsyringe";
import type { ICampaignRepository } from "../../domain/ICampaignRepository";
import type { ActivateCampaignRequest } from "../../domain/types";

/**
 * Use case pour activer une campagne
 */
@injectable()
export class ActivateCampaignUseCase {
  constructor(
    @inject(DI_TOKENS.ICampaignRepository)
    private repository: ICampaignRepository
  ) {}

  /**
   * Exécute le use case pour activer une campagne
   */
  public async execute(
    request: ActivateCampaignRequest,
    isOnline: boolean
  ): Promise<void> {
    return this.repository.activate(request, isOnline);
  }
}