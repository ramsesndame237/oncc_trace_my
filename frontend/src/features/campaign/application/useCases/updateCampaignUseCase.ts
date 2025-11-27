import { DI_TOKENS } from "@/core/infrastructure/di/tokens";
import { inject, injectable } from "tsyringe";
import type { ICampaignRepository } from "../../domain/ICampaignRepository";
import type { UpdateCampaignRequest } from "../../domain/types";

/**
 * Use case pour modifier une campagne existante
 */
@injectable()
export class UpdateCampaignUseCase {
  constructor(
    @inject(DI_TOKENS.ICampaignRepository)
    private repository: ICampaignRepository
  ) {}

  /**
   * Exécute le use case pour modifier une campagne
   */
  public async execute(
    request: UpdateCampaignRequest,
    isOnline: boolean
  ): Promise<void> {
    return this.repository.update(request, isOnline);
  }
}
