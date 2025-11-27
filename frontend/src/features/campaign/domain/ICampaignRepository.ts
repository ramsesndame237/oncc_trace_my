import { ISyncHandler } from "@/core/domain/sync.types";
import { PaginationMeta } from "@/core/domain/types";
import { CampaignFilters, CampaignWithSync } from "./campaign.types";
import {
  ActivateCampaignRequest,
  CreateCampaignRequest,
  DeactivateCampaignRequest,
  UpdateCampaignRequest,
} from "./types";

export interface GetCampaignsResult {
  campaigns: CampaignWithSync[];
  meta: PaginationMeta | undefined;
}

/**
 * Interface du repository pour les campagnes.
 * Définit le contrat pour la couche infrastructure.
 */
export interface ICampaignRepository extends ISyncHandler {
  /**
   * Récupère toutes les campagnes avec leurs statuts de synchronisation
   * @param isOnline - Indique si l'application est en ligne pour déterminer la source des données
   * @param filters - Filtres optionnels pour la recherche et la pagination
   * @returns Une promesse résolue avec les campagnes et les métadonnées de pagination
   */
  getAll(
    isOnline: boolean,
    filters?: CampaignFilters
  ): Promise<GetCampaignsResult>;

  /**
   * Récupère une campagne spécifique par son ID
   * @param id - ID de la campagne à récupérer
   * @param isOnline - Indique si l'application est en ligne pour déterminer la source des données
   * @returns Une promesse résolue avec la campagne
   */
  getById(id: string, isOnline: boolean): Promise<CampaignWithSync>;

  /**
   * Récupère la campagne actuellement active
   * @param isOnline - Indique si l'application est en ligne pour déterminer la source des données
   * @returns Une promesse résolue avec la campagne active ou null si aucune campagne n'est active
   */
  getActiveCampaign(isOnline: boolean): Promise<CampaignWithSync | null>;

  /**
   * Ajoute une nouvelle campagne
   */
  add(data: CreateCampaignRequest): Promise<void>;

  /**
   * Met à jour une campagne existante
   */
  update(data: UpdateCampaignRequest, isOnline: boolean): Promise<void>;

  /**
   * Active une campagne spécifique
   */
  activate(data: ActivateCampaignRequest, isOnline: boolean): Promise<void>;

  /**
   * Désactive une campagne spécifique
   */
  deactivate(data: DeactivateCampaignRequest, isOnline: boolean): Promise<void>;

  /**
   * Compte le nombre total de campagnes
   * @param isOnline - Indique si l'application est en ligne pour déterminer la source des données
   * @returns Une promesse résolue avec le nombre total de campagnes
   */
  count(isOnline: boolean): Promise<number>;
}
