import { ensureDIConfigured } from "@/core/infrastructure/di/container";
import { DI_TOKENS } from "@/core/infrastructure/di/tokens";
import { container } from "tsyringe";
import {
  AssociateConventionToCampaignUseCase,
  CreateConventionUseCase,
  DissociateConventionFromCampaignUseCase,
  GetConventionByIdUseCase,
  GetConventionsUseCase,
  UpdateConventionUseCase,
} from "../../application/useCases";
import { IConventionRepository } from "../../domain/IConventionRepository";

export class ConventionServiceProvider {
  static getRepository(): IConventionRepository {
    ensureDIConfigured();
    return container.resolve<IConventionRepository>(
      DI_TOKENS.IConventionRepository
    );
  }

  static getGetConventionsUseCase(): GetConventionsUseCase {
    ensureDIConfigured();
    return container.resolve(GetConventionsUseCase);
  }

  static getGetConventionByIdUseCase(): GetConventionByIdUseCase {
    ensureDIConfigured();
    return container.resolve(GetConventionByIdUseCase);
  }

  static getCreateConventionUseCase(): CreateConventionUseCase {
    ensureDIConfigured();
    return container.resolve(CreateConventionUseCase);
  }

  static getUpdateConventionUseCase(): UpdateConventionUseCase {
    ensureDIConfigured();
    return container.resolve(UpdateConventionUseCase);
  }

  static getAssociateConventionToCampaignUseCase(): AssociateConventionToCampaignUseCase {
    ensureDIConfigured();
    return container.resolve(AssociateConventionToCampaignUseCase);
  }

  static getDissociateConventionFromCampaignUseCase(): DissociateConventionFromCampaignUseCase {
    ensureDIConfigured();
    return container.resolve(DissociateConventionFromCampaignUseCase);
  }
}
