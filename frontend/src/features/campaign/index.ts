// Exports structurés par couche
export {
  ActivateCampaignUseCase,
  CreateCampaignUseCase,
  GetCampaignByIdUseCase,
  GetCampaignsUseCase,
} from "./application/useCases";
export type {
  Campaign,
  CampaignStatus,
  CampaignWithSync,
} from "./domain/campaign.types";
export { CampaignServiceProvider } from "./infrastructure/di/campaignServiceProvider";
export { CampaignRepository } from "./infrastructure/repositories/campaignRepository";
export { useCampaignStore } from "./infrastructure/store/campaignStore";
export { CampaignList } from "./presentation/components";
export * from "./presentation/hooks";
export { campaignSchema } from "./presentation/schemas";
export type { CampaignFormData } from "./presentation/schemas";
