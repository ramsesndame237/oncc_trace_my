import { DI_TOKENS } from "@/core/infrastructure/di/tokens";
import { inject, injectable } from "tsyringe";
import type { ICampaignRepository } from "../../domain/ICampaignRepository";
import type { CreateCampaignRequest } from "../../domain/types";

/**
 * Use case pour créer une nouvelle campagne
 */
@injectable()
export class CreateCampaignUseCase {
  constructor(
    @inject(DI_TOKENS.ICampaignRepository)
    private repository: ICampaignRepository
  ) {}

  /**
   * Exécute le use case pour créer une campagne
   */
  public async execute(
    request: CreateCampaignRequest
  ): Promise<void> {
    return this.repository.add(request);
  }
}