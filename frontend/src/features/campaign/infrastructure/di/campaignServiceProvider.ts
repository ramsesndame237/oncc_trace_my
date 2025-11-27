import { ensureDIConfigured } from "@/core/infrastructure/di/container";
import { container } from "tsyringe";
import {
  ActivateCampaignUseCase,
  CreateCampaignUseCase,
  DeactivateCampaignUseCase,
  GetActiveCampaignUseCase,
  GetCampaignByIdUseCase,
  GetCampaignCountUseCase,
  GetCampaignsUseCase,
  UpdateCampaignUseCase,
} from "../../application/useCases";

/**
 * Service provider pour l'injection des dépendances des campagnes
 */
export class CampaignServiceProvider {
  /**
   * Récupère l'instance du use case pour obtenir les campagnes
   */
  public static getGetCampaignsUseCase(): GetCampaignsUseCase {
    ensureDIConfigured();
    return container.resolve(GetCampaignsUseCase);
  }

  /**
   * Récupère l'instance du use case pour obtenir une campagne par ID
   */
  public static getGetCampaignByIdUseCase(): GetCampaignByIdUseCase {
    ensureDIConfigured();
    return container.resolve(GetCampaignByIdUseCase);
  }

  /**
   * Récupère l'instance du use case pour créer une campagne
   */
  public static getCreateCampaignUseCase(): CreateCampaignUseCase {
    ensureDIConfigured();
    return container.resolve(CreateCampaignUseCase);
  }

  /**
   * Récupère l'instance du use case pour modifier une campagne
   */
  public static getUpdateCampaignUseCase(): UpdateCampaignUseCase {
    ensureDIConfigured();
    return container.resolve(UpdateCampaignUseCase);
  }

  /**
   * Récupère l'instance du use case pour activer une campagne
   */
  public static getActivateCampaignUseCase(): ActivateCampaignUseCase {
    ensureDIConfigured();
    return container.resolve(ActivateCampaignUseCase);
  }

  /**
   * Récupère l'instance du use case pour désactiver une campagne
   */
  public static getDeactivateCampaignUseCase(): DeactivateCampaignUseCase {
    ensureDIConfigured();
    return container.resolve(DeactivateCampaignUseCase);
  }

  /**
   * Récupère l'instance du use case pour compter les campagnes
   */
  public static getGetCampaignCountUseCase(): GetCampaignCountUseCase {
    ensureDIConfigured();
    return container.resolve(GetCampaignCountUseCase);
  }

  /**
   * Récupère l'instance du use case pour obtenir la campagne active
   */
  public static getGetActiveCampaignUseCase(): GetActiveCampaignUseCase {
    ensureDIConfigured();
    return container.resolve(GetActiveCampaignUseCase);
  }
}
