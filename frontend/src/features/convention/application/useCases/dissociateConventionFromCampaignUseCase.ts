import { DI_TOKENS } from "@/core/infrastructure/di/tokens";
import { inject, injectable } from "tsyringe";
import type { IConventionRepository } from "../../domain/IConventionRepository";

/**
 * Use case pour dissocier une convention d'une campagne
 */
@injectable()
export class DissociateConventionFromCampaignUseCase {
  constructor(
    @inject(DI_TOKENS.IConventionRepository)
    private repository: IConventionRepository
  ) {}

  public async execute(
    conventionId: string,
    campaignId: string,
    isOnline: boolean
  ): Promise<void> {
    return this.repository.dissociateFromCampaign(
      conventionId,
      campaignId,
      isOnline
    );
  }
}
