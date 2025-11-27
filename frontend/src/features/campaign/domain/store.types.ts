import { PaginationMeta } from "@/core/domain/types";
import { CampaignFilters } from "./campaign.types";
import {
  ActivateCampaignRequest,
  CampaignResponse,
  CreateCampaignRequest,
  DeactivateCampaignRequest,
  UpdateCampaignRequest,
} from "./types";

/**
 * État global du store des campagnes
 */
export interface CampaignState {
  campaigns: CampaignResponse[];
  meta: PaginationMeta | undefined;
  filters: CampaignFilters;
  totalCampaigns: number;
  isLoading: boolean;
  isOnline: boolean;
  error: string | null;
}

/**
 * Actions du store des campagnes
 */
export interface CampaignActions {
  // Actions synchrones
  setFilters: (newFilters: Partial<CampaignFilters>) => void;

  // Actions asynchrones
  fetchCampaigns: () => Promise<void>;
  fetchCampaignCount: () => Promise<void>;
  fetchCampaignById: (id: string) => Promise<CampaignResponse | null>;
  createCampaign: (data: CreateCampaignRequest) => Promise<void>;
  updateCampaign: (data: UpdateCampaignRequest) => Promise<void>;
  activateCampaign: (data: ActivateCampaignRequest) => Promise<void>;
  deactivateCampaign: (data: DeactivateCampaignRequest) => Promise<void>;
}
