import { DI_TOKENS } from "@/core/infrastructure/di/tokens";
import { inject, injectable } from "tsyringe";
import type { IConventionRepository } from "../../domain/IConventionRepository";

/**
 * Use case pour associer une convention à la campagne active
 */
@injectable()
export class AssociateConventionToCampaignUseCase {
  constructor(
    @inject(DI_TOKENS.IConventionRepository)
    private repository: IConventionRepository
  ) {}

  public async execute(
    conventionId: string,
    campaignId: string,
    isOnline: boolean
  ): Promise<void> {
    return this.repository.associateToCampaign(
      conventionId,
      campaignId,
      isOnline
    );
  }
}
