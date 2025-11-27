import { DI_TOKENS } from "@/core/infrastructure/di/tokens";
import { inject, injectable } from "tsyringe";
import type { ICampaignRepository } from "../../domain/ICampaignRepository";

/**
 * Use case pour compter le nombre total de campagnes
 */
@injectable()
export class GetCampaignCountUseCase {
  constructor(
    @inject(DI_TOKENS.ICampaignRepository)
    private repository: ICampaignRepository
  ) {}

  /**
   * Exécute le use case pour compter les campagnes
   */
  public async execute(isOnline: boolean): Promise<number> {
    return this.repository.count(isOnline);
  }
}